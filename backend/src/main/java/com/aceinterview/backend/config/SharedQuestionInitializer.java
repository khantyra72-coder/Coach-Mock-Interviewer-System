package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.InterviewType;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.entity.TechRole;
import com.aceinterview.backend.repository.InterviewTypeRepository;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import com.aceinterview.backend.repository.TechRoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name="app.content.initializers.enabled",matchIfMissing=true)
@Order(3)
public class SharedQuestionInitializer implements CommandLineRunner {
    private static final Set<String> DIFFICULTIES = Set.of("Easy", "Medium", "Hard");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final QuestionRepository questionRepository;
    private final RubricCriterionRepository rubricRepository;
    private final TechRoleRepository roleRepository;
    private final InterviewTypeRepository typeRepository;

    public SharedQuestionInitializer(QuestionRepository questionRepository,
                                     RubricCriterionRepository rubricRepository,
                                     TechRoleRepository roleRepository,
                                     InterviewTypeRepository typeRepository) {
        this.questionRepository = questionRepository;
        this.rubricRepository = rubricRepository;
        this.roleRepository = roleRepository;
        this.typeRepository = typeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<SharedQuestion> seeds;
        try (InputStream input = new ClassPathResource("data/shared-questions-final.json").getInputStream()) {
            seeds = objectMapper.readValue(input, new TypeReference<>() {});
        }
        validate(seeds);

        Map<String, TechRole> roles = roleRepository.findAll().stream()
                .collect(Collectors.toMap(TechRole::getName, Function.identity()));
        Map<String, InterviewType> types = typeRepository.findAll().stream()
                .collect(Collectors.toMap(InterviewType::getName, Function.identity()));

        for (SharedQuestion seed : seeds) {
            String normalized = normalize(seed.prompt());
            Question question = questionRepository.findByNormalizedText(normalized)
                    .or(() -> seed.legacyPrompt() == null ? java.util.Optional.empty()
                            : questionRepository.findByNormalizedText(normalize(seed.legacyPrompt())))
                    .orElseGet(Question::new);
            question.setTechRole(roles.get(seed.role()));
            question.setInterviewType(types.get(seed.type()));
            question.setCompany(null);
            question.setQuestionText(seed.prompt().trim());
            question.setNormalizedText(normalized);
            question.setCategory(seed.type());
            question.setTopic(seed.topic().trim());
            question.setDifficulty(seed.difficulty());
            question.setSourceType("SHARED");
            question.setExpectedAnswerSummary(seed.expectedAnswerSummary().trim());
            question.setReviewStatus("Approved");
            question.setActive(true);
            question = questionRepository.save(question);

            long rubricCount = rubricRepository.countByQuestionId(question.getId());
            if (rubricCount != 0 && rubricCount != 5) {
                throw new IllegalStateException("Question " + question.getId() + " has " + rubricCount + " rubric criteria");
            }
            List<RubricCriterion> existingRubrics = rubricCount == 0 ? List.of()
                    : rubricRepository.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            for (int index = 0; index < seed.rubrics().size(); index++) {
                    SharedRubric seedRubric = seed.rubrics().get(index);
                    RubricCriterion rubric = rubricCount == 0 ? new RubricCriterion() : existingRubrics.get(index);
                    rubric.setQuestion(question);
                    rubric.setCriterionOrder(seedRubric.order());
                    rubric.setCriterionName(seedRubric.name().trim());
                    rubric.setDescription(seedRubric.description().trim());
                    rubric.setExpectedEvidence(seedRubric.expectedEvidence().trim());
                    rubric.setAcceptableAlternatives(clean(seedRubric.acceptableAlternatives()));
                    rubric.setKeywords(clean(seedRubric.keywords()));
                    rubric.setWeight(seedRubric.weight());
                    rubricRepository.save(rubric);
            }
        }

        Set<String> currentPrompts = seeds.stream()
                .map(seed -> normalize(seed.prompt()))
                .collect(Collectors.toSet());
        for (Question question : questionRepository.findAll()) {
            if ("SHARED".equals(question.getSourceType()) && !currentPrompts.contains(question.getNormalizedText())) {
                question.setActive(false);
                question.setReviewStatus("Retired");
                questionRepository.save(question);
            }
        }
    }

    static void validate(List<SharedQuestion> seeds) {
        if (seeds.size() != 600) throw new IllegalStateException("Shared bank must contain exactly 600 questions");
        Map<String, Long> typeCounts = seeds.stream()
                .collect(Collectors.groupingBy(SharedQuestion::type, Collectors.counting()));
        if (!typeCounts.equals(Map.of("Technical", 200L, "Behavioral", 200L, "System Design", 200L))) {
            throw new IllegalStateException("Shared bank type distribution is invalid: " + typeCounts);
        }
        Map<String, Long> roleTypeCounts = seeds.stream()
                .collect(Collectors.groupingBy(seed -> seed.role() + "|" + seed.type(), Collectors.counting()));
        if (roleTypeCounts.size() != 30 || roleTypeCounts.values().stream().anyMatch(count -> count != 20L)) {
            throw new IllegalStateException("Every role/type combination must contain 20 questions: " + roleTypeCounts);
        }

        Set<String> prompts = new HashSet<>();
        for (SharedQuestion seed : seeds) {
            if (seed.prompt() == null || !prompts.add(normalize(seed.prompt()))) {
                throw new IllegalStateException("Duplicate or blank shared prompt");
            }
            if (!InterviewTaxonomyInitializer.TECH_ROLES.contains(seed.role())
                    || !InterviewTaxonomyInitializer.INTERVIEW_TYPES.contains(seed.type())
                    || !DIFFICULTIES.contains(seed.difficulty())
                    || !"SHARED".equals(seed.sourceType()) || seed.company() != null) {
                throw new IllegalStateException("Invalid shared question taxonomy");
            }
            if (seed.expectedAnswerSummary() == null || seed.expectedAnswerSummary().isBlank()) {
                throw new IllegalStateException("Expected answer cannot be blank");
            }
            if (seed.rubrics() == null || seed.rubrics().size() != 5
                    || seed.rubrics().stream().mapToInt(SharedRubric::weight).sum() != 100) {
                throw new IllegalStateException("Every shared question requires five rubrics totaling 100");
            }
            Set<Integer> orders = seed.rubrics().stream().map(SharedRubric::order).collect(Collectors.toSet());
            if (!orders.equals(Set.of(1, 2, 3, 4, 5))) throw new IllegalStateException("Rubric orders must be 1 through 5");
            if (seed.rubrics().stream().anyMatch(rubric -> rubric.name() == null || rubric.name().isBlank()
                    || rubric.description() == null || rubric.description().isBlank()
                    || rubric.expectedEvidence() == null || rubric.expectedEvidence().isBlank())) {
                throw new IllegalStateException("Rubric content cannot be blank");
            }
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record SharedQuestion(String role, String type, String topic, String difficulty, String sourceType,
                                 String company, String prompt, String expectedAnswerSummary,
                                 List<SharedRubric> rubrics, String legacyPrompt) {}
    public record SharedRubric(int order, String name, String description, String expectedEvidence,
                               String acceptableAlternatives, String keywords, int weight) {}
}
