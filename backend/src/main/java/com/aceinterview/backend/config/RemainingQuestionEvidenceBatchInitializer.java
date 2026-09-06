package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.EvidenceTerm;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.entity.RubricEvidenceGroup;
import com.aceinterview.backend.repository.EvidenceTermRepository;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import com.aceinterview.backend.repository.RubricEvidenceGroupRepository;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
@Order(30)
@ConditionalOnProperty(name = "app.evidence.remaining-batch.enabled", havingValue = "true")
public class RemainingQuestionEvidenceBatchInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(RemainingQuestionEvidenceBatchInitializer.class);
    private static final Map<String, List<String>> SYNONYMS = synonyms();

    private final QuestionRepository questions;
    private final RubricCriterionRepository criteria;
    private final RubricEvidenceGroupRepository groups;
    private final EvidenceTermRepository terms;
    private final EvidenceGroupValidator validator;
    private final int batchSize;
    private final int rounds;
    private final TransactionTemplate transactions;

    public RemainingQuestionEvidenceBatchInitializer(
            QuestionRepository questions,
            RubricCriterionRepository criteria,
            RubricEvidenceGroupRepository groups,
            EvidenceTermRepository terms,
            EvidenceGroupValidator validator,
            PlatformTransactionManager transactionManager,
            @Value("${app.evidence.remaining-batch.size:100}") int batchSize,
            @Value("${app.evidence.remaining-batch.rounds:1}") int rounds) {
        this.questions = questions;
        this.criteria = criteria;
        this.groups = groups;
        this.terms = terms;
        this.validator = validator;
        this.batchSize = Math.max(1, Math.min(batchSize, 500));
        this.rounds = Math.max(1, Math.min(rounds, 20));
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(String... args) {
        for (int round = 1; round <= rounds; round++) {
            int currentRound = round;
            BatchResult result = transactions.execute(status -> processBatch(currentRound));
            if (result == null || result.processed() == 0 || result.remaining() == 0) break;
        }
    }

    private BatchResult processBatch(int round) {
        long before = questions.countQuestionsMissingEvidence();
        List<Question> batch = questions.findQuestionsMissingEvidence(PageRequest.of(0, batchSize));
        int validated = 0;
        int revise = 0;
        int invalidRubrics = 0;

        for (Question question : batch) {
            List<RubricCriterion> rubric = criteria.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            if (rubric.size() != 5) {
                invalidRubrics++;
                continue;
            }

            for (int index = 0; index < rubric.size(); index++) {
                seedMissingEvidence(question, rubric.get(index), index);
            }
            terms.flush();
            groups.flush();
            criteria.flush();

            EvidenceGroupValidator.QuestionValidation result = validator.validate(question, rubric);
            Set<Long> invalidCriteria = new HashSet<>();
            result.criteria().stream()
                    .filter(item -> !item.valid())
                    .map(EvidenceGroupValidator.CriterionValidation::criterionId)
                    .forEach(invalidCriteria::add);
            boolean questionInvalid = !result.issues().isEmpty();
            for (RubricCriterion criterion : rubric) {
                criterion.setEvidenceStatus(questionInvalid || invalidCriteria.contains(criterion.getId())
                        ? "REVISE" : "AUTO_VALIDATED");
                criteria.save(criterion);
            }
            if (result.valid()) validated++; else revise++;
        }

        criteria.flush();
        long remaining = questions.countQuestionsMissingEvidence();
        log.info("Remaining evidence batch {} complete: requested={}, processed={}, validated={}, revise={}, invalidRubrics={}, before={}, remaining={}",
                round, batchSize, batch.size(), validated, revise, invalidRubrics, before, remaining);
        return new BatchResult(batch.size(), remaining);
    }

    private void seedMissingEvidence(Question question, RubricCriterion criterion, int index) {
        criterion.setImportance(index < 3 ? "CORE" : "SUPPORTING");
        criterion.setSemanticDescription(criterion.getExpectedEvidence());
        if (criterion.getRubricVersion() == null || criterion.getRubricVersion() < 2) {
            criterion.setRubricVersion(2);
        }
        if (!groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()).isEmpty()) {
            criteria.save(criterion);
            return;
        }

        criterion.setEvidenceStatus("PILOT");
        criteria.save(criterion);

        LinkedHashMap<String, String> primary = new LinkedHashMap<>();
        for (String keyword : split(criterion.getKeywords())) add(primary, keyword);
        add(primary, question.getTopic());
        add(primary, criterion.getExpectedEvidence());
        createGroup(criterion, 1, criterion.getCriterionName(), criterion.getExpectedEvidence(), "TERM", primary.values());

        LinkedHashMap<String, String> alternatives = new LinkedHashMap<>();
        for (String alternative : split(criterion.getAcceptableAlternatives())) add(alternatives, alternative);
        for (String keyword : split(criterion.getKeywords())) {
            for (String equivalent : equivalents(keyword)) add(alternatives, equivalent);
        }
        for (String equivalent : criterionEquivalents(criterion.getCriterionName())) add(alternatives, equivalent);
        primary.keySet().forEach(alternatives::remove);
        if (alternatives.isEmpty()) {
            add(alternatives, "technically equivalent terminology");
            add(alternatives, "valid alternative with justification");
        }
        createGroup(criterion, 2, "Accepted alternatives for " + criterion.getCriterionName(),
                "Accept synonyms, equivalent mechanisms, and other technically valid approaches.",
                "ALTERNATIVE", alternatives.values());
    }

    private void createGroup(RubricCriterion criterion, int order, String concept, String description,
                             String type, Iterable<String> values) {
        RubricEvidenceGroup group = new RubricEvidenceGroup();
        group.setRubricCriterion(criterion);
        group.setGroupOrder(order);
        group.setConcept(concept);
        group.setDescription(description);
        group = groups.save(group);

        Set<String> seen = new HashSet<>();
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized.isBlank() || !seen.add(normalized)) continue;
            EvidenceTerm term = new EvidenceTerm();
            term.setEvidenceGroup(group);
            term.setTermType(type);
            term.setValue(value.trim());
            terms.save(term);
        }
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split("[,;|]"))
                .map(String::trim)
                .filter(item -> item.length() > 2)
                .toList();
    }

    private void add(Map<String, String> values, String candidate) {
        if (candidate == null || candidate.isBlank()) return;
        String trimmed = candidate.trim();
        // Long rubric guidance is useful as a description, but it is not a matchable evidence term.
        if (trimmed.length() > 300) return;
        values.putIfAbsent(normalize(trimmed), trimmed);
    }

    private List<String> equivalents(String keyword) {
        String normalized = normalize(keyword);
        List<String> result = new ArrayList<>(SYNONYMS.getOrDefault(normalized, List.of()));
        if (normalized.endsWith("ing") && normalized.length() > 6) result.add(normalized.substring(0, normalized.length() - 3));
        if (normalized.endsWith("tion") && normalized.length() > 7) result.add(normalized.substring(0, normalized.length() - 4));
        return result;
    }

    private List<String> criterionEquivalents(String name) {
        String normalized = normalize(name);
        if (normalized.matches(".*(complex|performance|latency|measure|result|verification|correct).*"))
            return List.of("runtime and memory analysis", "measurable validation", "edge case testing");
        if (normalized.matches(".*(trade|decision|alternative|selection).*"))
            return List.of("compare viable options", "justify the choice", "state benefits and drawbacks");
        if (normalized.matches(".*(reliab|failure|rollback|recovery|operation).*"))
            return List.of("fault handling", "safe recovery", "telemetry and restoration");
        if (normalized.matches(".*(ownership|action|collabor|judgment|communication).*"))
            return List.of("personal contribution", "decision rationale", "stakeholder coordination");
        return List.of("clear supporting mechanism", "specific supporting detail", "relevant supporting evidence");
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static Map<String, List<String>> synonyms() {
        Map<String, List<String>> values = new HashMap<>();
        values.put("latency", List.of("response time", "delay"));
        values.put("performance", List.of("efficiency", "throughput"));
        values.put("reliability", List.of("availability", "resilience"));
        values.put("failure", List.of("fault", "outage", "error condition"));
        values.put("monitor", List.of("observe", "track", "instrument"));
        values.put("monitoring", List.of("observability", "telemetry", "instrumentation"));
        values.put("measure", List.of("quantify", "metric", "benchmark"));
        values.put("result", List.of("outcome", "impact", "effect"));
        values.put("outcome", List.of("result", "impact", "effect"));
        values.put("tradeoff", List.of("compromise", "benefit and drawback", "balance"));
        values.put("decision", List.of("choice", "rationale", "judgment"));
        values.put("collaboration", List.of("teamwork", "stakeholder alignment", "coordination"));
        values.put("ownership", List.of("responsibility", "initiative", "personal contribution"));
        values.put("security", List.of("protection", "threat prevention", "safety control"));
        values.put("authentication", List.of("identity verification", "login validation"));
        values.put("authorization", List.of("access control", "permissions"));
        values.put("cache", List.of("caching", "temporary data store"));
        values.put("database", List.of("data store", "persistence layer"));
        values.put("scalability", List.of("ability to scale", "growth capacity"));
        values.put("concurrency", List.of("parallel execution", "simultaneous operations"));
        values.put("testing", List.of("validation", "verification", "quality check"));
        values.put("rollback", List.of("revert", "restore", "safe recovery"));
        values.put("deployment", List.of("release", "rollout"));
        values.put("consistency", List.of("data coherence", "correct shared state"));
        values.put("queue", List.of("message buffer", "message broker"));
        values.put("api", List.of("interface", "endpoint", "service contract"));
        values.put("memory", List.of("space usage", "ram consumption"));
        values.put("complexity", List.of("runtime cost", "big o", "resource growth"));
        values.put("algorithm", List.of("procedure", "method", "computational approach"));
        values.put("requirements", List.of("constraints", "needs", "acceptance conditions"));
        values.put("impact", List.of("effect", "outcome", "measurable change"));
        values.put("risk", List.of("downside", "hazard", "failure possibility"));
        values.put("feedback", List.of("review comments", "input", "critique"));
        values.put("learning", List.of("lesson", "improvement", "new understanding"));
        values.put("communication", List.of("explanation", "alignment", "information sharing"));
        values.put("ambiguity", List.of("uncertainty", "unclear requirements", "unknowns"));
        values.put("customer", List.of("user", "client", "consumer"));
        values.put("user", List.of("customer", "end user", "consumer"));
        values.put("verify", List.of("validate", "confirm", "check"));
        values.put("error", List.of("failure", "fault", "incorrect behavior"));
        return Map.copyOf(values);
    }

    private record BatchResult(int processed, long remaining) {}
}
