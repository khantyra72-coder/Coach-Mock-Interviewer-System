package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class OpenRouterScoringService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final EvidenceAwareScoringService fallbackScoringService;

    public OpenRouterScoringService(
            @Value("${app.ai.openrouter.api-key:}") String apiKey,
            @Value("${app.ai.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${app.ai.openrouter.model:openrouter/free}") String model,
            EvidenceAwareScoringService fallbackScoringService
    ) {
        this.objectMapper = new ObjectMapper();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        this.fallbackScoringService = fallbackScoringService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    public AiEvaluation evaluate(
            Question question,
            List<RubricCriterion> criteria,
            String answer
    ) {
        if (answer == null || answer.isBlank()) {
            return emptyEvaluation(criteria);
        }
        String trimmedAnswer = answer.trim();

if (trimmedAnswer.length() < 20
        || trimmedAnswer.split("\\s+").length < 4) {
    return emptyEvaluation(criteria);
}

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "OPENROUTER_API_KEY is missing. Start the backend from the terminal where it was exported."
            );
        }

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("temperature", 0.1);
            addStructuredOutputSchema(requestBody);

            ArrayNode messages = requestBody.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content", systemPrompt());

            messages.addObject()
                    .put("role", "user")
                    .put("content", buildUserPrompt(question, criteria, answer));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .timeout(Duration.ofSeconds(120))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(requestBody)
                    ))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "OpenRouter request failed with status " + response.statusCode()
                );
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String content = responseJson.path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText();

            return parseEvaluation(content, criteria);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI scoring was interrupted.", exception);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "AI scoring failed: " + exception.getMessage(),
                    exception
            );
        }
    }
    private void addStructuredOutputSchema(ObjectNode requestBody) {
    ObjectNode responseFormat = requestBody.putObject("response_format");
    responseFormat.put("type", "json_schema");

    ObjectNode jsonSchema = responseFormat.putObject("json_schema");
    jsonSchema.put("name", "interview_evaluation");
    jsonSchema.put("strict", true);

    ObjectNode schema = jsonSchema.putObject("schema");
    schema.put("type", "object");
    schema.put("additionalProperties", false);

    ObjectNode properties = schema.putObject("properties");

    ObjectNode score = properties.putObject("score");
    score.put("type", "integer");
    score.put("minimum", 0);
    score.put("maximum", 100);

    properties.putObject("relevant").put("type", "boolean");
    properties.putObject("incorrect").put("type", "boolean");
    properties.putObject("criticalUnsafe").put("type", "boolean");

    ObjectNode criteria = properties.putObject("criteria");
    criteria.put("type", "array");

    ObjectNode criterion = criteria.putObject("items");
    criterion.put("type", "object");
    criterion.put("additionalProperties", false);

    ObjectNode criterionProperties = criterion.putObject("properties");
    criterionProperties.putObject("index").put("type", "integer");

    ObjectNode status = criterionProperties.putObject("status");
    status.put("type", "string");
    status.putArray("enum")
            .add("FULL")
            .add("PARTIAL")
            .add("MISSING");

    criterionProperties.putObject("evidence").put("type", "string");

    criterion.putArray("required")
            .add("index")
            .add("status")
            .add("evidence");

    schema.putArray("required")
            .add("score")
            .add("relevant")
            .add("incorrect")
            .add("criticalUnsafe")
            .add("criteria");

    ObjectNode provider = requestBody.putObject("provider");
    provider.put("require_parameters", true);
}
    private String systemPrompt() {
        return """
                You are a strict but fair technical interview evaluator.
                Evaluate meaning and technical correctness, not exact keyword matches.
                Do not reward irrelevant, random, copied-looking filler, or unsafe answers.
                A short but correct answer can receive partial credit.
                A detailed answer should receive high credit only when it directly answers
                the question and explains diagnosis, correction, trade-offs, and verification.

                Return JSON only, with no Markdown and no text outside the JSON.

                Required JSON shape:
                {
                  "score": 0,
                  "relevant": true,
                  "incorrect": false,
                  "criticalUnsafe": false,
                  "criteria": [
                    {
                      "index": 0,
                      "status": "FULL",
                      "evidence": "Brief explanation based on the answer"
                    }
                  ]
                }

                score must be an integer from 0 to 100.
                status must be FULL, PARTIAL, or MISSING.
                Return exactly one criteria item for every supplied rubric criterion.
                Use the supplied zero-based criterion index.
                If the answer is greetings, nonsense, or unrelated, set relevant to false,
                score to 0, and every criterion to MISSING.
                """;
    }

    private String buildUserPrompt(
            Question question,
            List<RubricCriterion> criteria,
            String answer
    ) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Question: ")
                .append(question.getQuestionText())
                .append("\n");

        prompt.append("Category: ")
                .append(question.getCategory())
                .append("\n");

        prompt.append("Topic: ")
                .append(question.getTopic())
                .append("\n\n");

        prompt.append("Rubric criteria:\n");

        for (int index = 0; index < criteria.size(); index++) {
            RubricCriterion criterion = criteria.get(index);
            prompt.append(index)
                    .append(". ")
                    .append(criterion.getCriterionName())
                    .append(" (weight ")
                    .append(criterion.getWeight())
                    .append(")\n");
        }

        prompt.append("\nCandidate answer:\n")
                .append(answer);

        return prompt.toString();
    }

    private AiEvaluation parseEvaluation(
            String content,
            List<RubricCriterion> criteria
    ) throws Exception {
        String cleaned = removeCodeFence(content);
        JsonNode root = objectMapper.readTree(cleaned);

        boolean relevant = root.path("relevant").asBoolean(false);
        boolean incorrect = root.path("incorrect").asBoolean(false);
        boolean criticalUnsafe = root.path("criticalUnsafe").asBoolean(false);
        int score = clamp(root.path("score").asInt(0));

        List<AiCriterionEvaluation> evaluatedCriteria = new ArrayList<>();
        JsonNode returnedCriteria = root.path("criteria");

        for (int index = 0; index < criteria.size(); index++) {
            JsonNode item = findCriterion(returnedCriteria, index);
            String status = normalizeStatus(item.path("status").asText("MISSING"));
            String evidence = item.path("evidence").asText("").trim();

            if (!relevant) {
                status = "MISSING";
                evidence = "";
            }

            evaluatedCriteria.add(
                    new AiCriterionEvaluation(index, status, evidence)
            );
        }

        if (!relevant) {
            score = 0;
        }

        return new AiEvaluation(
                score,
                relevant,
                incorrect,
                criticalUnsafe,
                evaluatedCriteria
        );
    }

    private JsonNode findCriterion(JsonNode criteria, int wantedIndex) {
        if (criteria.isArray()) {
            for (JsonNode item : criteria) {
                if (item.path("index").asInt(-1) == wantedIndex) {
                    return item;
                }
            }
        }

        return objectMapper.createObjectNode();
    }

    private String normalizeStatus(String status) {
        String normalized = status.toUpperCase(Locale.ROOT);

        return switch (normalized) {
            case "FULL", "PARTIAL", "MISSING" -> normalized;
            default -> "MISSING";
        };
    }

    private String removeCodeFence(String content) {
    String cleaned = content == null ? "" : content.trim();

    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
        cleaned = cleaned.replaceFirst("\\s*```$", "");
    }

    int firstBrace = cleaned.indexOf('{');
    int lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned.trim();
}

    private AiEvaluation emptyEvaluation(List<RubricCriterion> criteria) {
        List<AiCriterionEvaluation> missing = new ArrayList<>();

        for (int index = 0; index < criteria.size(); index++) {
            missing.add(new AiCriterionEvaluation(index, "MISSING", ""));
        }

        return new AiEvaluation(0, false, false, false, missing);
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    public record AiCriterionEvaluation(
            int index,
            String status,
            String evidence
    ) {}

    public record AiEvaluation(
            int score,
            boolean relevant,
            boolean incorrect,
            boolean criticalUnsafe,
            List<AiCriterionEvaluation> criteria
    ) {}
public EvidenceAwareScoringService.ScoreResult score(
        Question question,
        List<RubricCriterion> criteria,
        String answer
) {
    if (apiKey == null || apiKey.isBlank()) {
        return fallbackScoringService.score(question, criteria, answer);
    }

    AiEvaluation evaluation;
    try {
        evaluation = evaluate(question, criteria, answer);
    } catch (IllegalStateException exception) {
        // Provider outages, timeouts, quota failures, and malformed responses
        // must not prevent a candidate from submitting an interview answer.
        return fallbackScoringService.score(question, criteria, answer);
    }
    List<EvidenceAwareScoringService.CriterionScore> results = new ArrayList<>();

    for (AiCriterionEvaluation item : evaluation.criteria()) {
        RubricCriterion criterion = criteria.get(item.index());

        int awarded = switch (item.status()) {
            case "FULL" -> criterion.getWeight();
            case "PARTIAL" -> criterion.getWeight() / 2;
            default -> 0;
        };

        List<String> evidence = item.evidence().isBlank()
                ? List.of()
                : List.of(item.evidence());

        results.add(new EvidenceAwareScoringService.CriterionScore(
                criterion,
                item.status(),
                awarded,
                evidence,
                List.of()
        ));
    }

    int totalWeight = results.stream()
        .mapToInt(item -> item.criterion().getWeight())
        .sum();

    int totalAwarded = results.stream()
        .mapToInt(EvidenceAwareScoringService.CriterionScore::awarded)
        .sum();

int consistentScore = totalWeight == 0
        ? 0
        : (int) Math.round((totalAwarded * 100.0) / totalWeight);
    return new EvidenceAwareScoringService.ScoreResult(
            consistentScore,
            evaluation.relevant(),
            evaluation.incorrect(),
            evaluation.criticalUnsafe(),
            results
    );
}
}
