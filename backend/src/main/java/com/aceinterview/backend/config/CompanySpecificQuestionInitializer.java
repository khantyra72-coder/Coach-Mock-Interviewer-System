package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name="app.content.initializers.enabled",matchIfMissing=true)
@Order(4)
public class CompanySpecificQuestionInitializer implements CommandLineRunner {
    private static final Set<String> DIFFICULTIES = Set.of("Easy", "Medium", "Hard");
    private final ObjectMapper mapper = new ObjectMapper();
    private final QuestionRepository questions;
    private final RubricCriterionRepository rubrics;
    private final TechRoleRepository roles;
    private final InterviewTypeRepository types;
    private final CompanyRepository companies;

    public CompanySpecificQuestionInitializer(QuestionRepository questions, RubricCriterionRepository rubrics,
                                              TechRoleRepository roles, InterviewTypeRepository types,
                                              CompanyRepository companies) {
        this.questions = questions; this.rubrics = rubrics; this.roles = roles; this.types = types; this.companies = companies;
    }

    @Override @Transactional
    public void run(String... args) throws Exception {
        List<Seed> seeds;
        try (InputStream input = new ClassPathResource("data/company-specific-questions-final.json").getInputStream()) {
            seeds = mapper.readValue(input, new TypeReference<>() {});
        }
        validate(seeds);
        Map<String, TechRole> roleMap = roles.findAll().stream().collect(Collectors.toMap(TechRole::getName, Function.identity()));
        Map<String, InterviewType> typeMap = types.findAll().stream().collect(Collectors.toMap(InterviewType::getName, Function.identity()));
        Map<String, Company> companyMap = companies.findAll().stream().collect(Collectors.toMap(Company::getName, Function.identity()));

        for (Seed seed : seeds) {
            String normalized = normalize(seed.prompt());
            Question question = questions.findByNormalizedText(normalized)
                    .or(() -> seed.legacyPrompt() == null ? Optional.empty() : questions.findByNormalizedText(normalize(seed.legacyPrompt())))
                    .orElseGet(Question::new);
            question.setTechRole(roleMap.get(seed.role())); question.setInterviewType(typeMap.get(seed.type()));
            question.setCompany(companyMap.get(seed.company())); question.setQuestionText(seed.prompt().trim());
            question.setNormalizedText(normalized); question.setCategory(seed.type()); question.setTopic(seed.topic().trim());
            question.setDifficulty(seed.difficulty()); question.setSourceType("COMPANY_SPECIFIC");
            question.setExpectedAnswerSummary(seed.expectedAnswerSummary().trim()); question.setReviewStatus("Approved"); question.setActive(true);
            question = questions.save(question);

            List<RubricCriterion> current = rubrics.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            if (!current.isEmpty() && current.size() != 5) throw new IllegalStateException("Invalid existing rubric count for " + question.getId());
            for (int i = 0; i < 5; i++) {
                RubricSeed source = seed.rubrics().get(i);
                RubricCriterion target = current.isEmpty() ? new RubricCriterion() : current.get(i);
                target.setQuestion(question); target.setCriterionOrder(source.order()); target.setCriterionName(source.name().trim());
                target.setDescription(source.description().trim()); target.setExpectedEvidence(source.expectedEvidence().trim());
                target.setAcceptableAlternatives(clean(source.acceptableAlternatives())); target.setKeywords(clean(source.keywords()));
                target.setWeight(source.weight()); rubrics.save(target);
            }
        }

        Set<String> currentPrompts = seeds.stream()
                .map(seed -> normalize(seed.prompt()))
                .collect(Collectors.toSet());
        for (Question question : questions.findAll()) {
            if ("COMPANY_SPECIFIC".equals(question.getSourceType())
                    && !currentPrompts.contains(question.getNormalizedText())) {
                question.setActive(false);
                question.setReviewStatus("Retired");
                questions.save(question);
            }
        }
    }

    static void validate(List<Seed> seeds) {
        if (seeds.size() != 900) throw new IllegalStateException("Company-specific bank must contain 900 questions");
        Map<String, Long> combinations = seeds.stream().collect(Collectors.groupingBy(
                seed -> seed.company() + "|" + seed.role() + "|" + seed.type(), Collectors.counting()));
        if (combinations.size() != 150 || combinations.values().stream().anyMatch(count -> count != 6L))
            throw new IllegalStateException("Every company/role/type combination requires six questions");
        if (seeds.stream().filter(seed -> Boolean.TRUE.equals(seed.isOriginalPilot())).count() != 12
                || seeds.stream().filter(seed -> Boolean.TRUE.equals(seed.isOriginalPilot())).anyMatch(seed -> !"Google".equals(seed.company())))
            throw new IllegalStateException("The original 12 Google pilot questions must be preserved inside the 900");
        Set<String> prompts = new HashSet<>(), answers = new HashSet<>(), evidence = new HashSet<>();
        for (Seed seed : seeds) {
            if (!InterviewTaxonomyInitializer.COMPANIES.contains(seed.company()) || !InterviewTaxonomyInitializer.TECH_ROLES.contains(seed.role())
                    || !InterviewTaxonomyInitializer.INTERVIEW_TYPES.contains(seed.type()) || !DIFFICULTIES.contains(seed.difficulty())
                    || !"COMPANY_SPECIFIC".equals(seed.sourceType()) || seed.prompt() == null || !prompts.add(normalize(seed.prompt()))
                    || seed.expectedAnswerSummary() == null || !answers.add(seed.expectedAnswerSummary().trim()))
                throw new IllegalStateException("Invalid or duplicate company-specific question");
            if (seed.rubrics() == null || seed.rubrics().size() != 5 || seed.rubrics().stream().mapToInt(RubricSeed::weight).sum() != 100)
                throw new IllegalStateException("Every question requires five rubrics totaling 100");
            if (!seed.rubrics().stream().map(RubricSeed::order).collect(Collectors.toSet()).equals(Set.of(1,2,3,4,5)))
                throw new IllegalStateException("Rubric orders must be 1 through 5");
            if (seed.rubrics().stream().anyMatch(r -> r.name() == null || r.name().isBlank() || r.description() == null || r.description().isBlank()
                    || r.expectedEvidence() == null || r.expectedEvidence().isBlank() || !evidence.add(r.expectedEvidence().trim())))
                throw new IllegalStateException("Rubric content must be present and unique");
        }
    }

    private static String normalize(String value) { return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim(); }
    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public record Seed(String company, String role, String type, String topic, String difficulty, String sourceType,
                       String prompt, String legacyPrompt, String expectedAnswerSummary, List<RubricSeed> rubrics,
                       Boolean isOriginalPilot) {}
    public record RubricSeed(int order, String name, String description, String expectedEvidence,
                             String acceptableAlternatives, String keywords, int weight) {}
}
