package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.Company;
import com.aceinterview.backend.entity.InterviewType;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.entity.TechRole;
import com.aceinterview.backend.repository.CompanyRepository;
import com.aceinterview.backend.repository.InterviewTypeRepository;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import com.aceinterview.backend.repository.TechRoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Order(2)
public class PilotQuestionInitializer implements CommandLineRunner {
    private static final Set<String> DIFFICULTIES = Set.of("Easy", "Medium", "Hard");
    private static final Set<String> SOURCES = Set.of("SHARED", "COMPANY_SPECIFIC");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final QuestionRepository questionRepository;
    private final RubricCriterionRepository rubricRepository;
    private final TechRoleRepository roleRepository;
    private final InterviewTypeRepository typeRepository;
    private final CompanyRepository companyRepository;

    public PilotQuestionInitializer(QuestionRepository questionRepository,
                                    RubricCriterionRepository rubricRepository, TechRoleRepository roleRepository,
                                    InterviewTypeRepository typeRepository, CompanyRepository companyRepository) {
        this.questionRepository = questionRepository;
        this.rubricRepository = rubricRepository;
        this.roleRepository = roleRepository;
        this.typeRepository = typeRepository;
        this.companyRepository = companyRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<PilotQuestion> seeds;
        try (InputStream input = new ClassPathResource("data/pilot-questions.json").getInputStream()) {
            seeds = objectMapper.readValue(input, new TypeReference<>() {});
        }
        validate(seeds);

        TechRole role = roleRepository.findByName("Software Engineer").orElseThrow();
        Company google = companyRepository.findByName("Google").orElseThrow();
        Map<String, InterviewType> types = typeRepository.findAll().stream()
                .collect(Collectors.toMap(InterviewType::getName, Function.identity()));

        for (PilotQuestion seed : seeds) {
            String normalized = normalize(seed.prompt());
            Question question = questionRepository.findByNormalizedText(normalized).orElseGet(Question::new);
            if (question.getId() == null) {
                question.setTechRole(role);
                question.setInterviewType(Optional.ofNullable(types.get(seed.type())).orElseThrow());
                question.setCompany("COMPANY_SPECIFIC".equals(seed.sourceType()) ? google : null);
                question.setQuestionText(seed.prompt().trim());
                question.setNormalizedText(normalized);
                question.setCategory(seed.type());
                question.setTopic(seed.topic().trim());
                question.setDifficulty(seed.difficulty());
                question.setSourceType(seed.sourceType());
                question.setExpectedAnswerSummary(seed.expectedAnswerSummary().trim());
                question.setReviewStatus("Approved");
                question.setActive(true);
                question = questionRepository.save(question);
            }

            long rubricCount = rubricRepository.countByQuestionId(question.getId());
            if (rubricCount != 0 && rubricCount != 5) {
                throw new IllegalStateException("Question " + question.getId() + " has " + rubricCount + " rubric criteria");
            }
            if (rubricCount == 0) {
                for (PilotRubric seedRubric : seed.rubrics()) {
                    RubricCriterion rubric = new RubricCriterion();
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
        }
    }

    static void validate(List<PilotQuestion> seeds) {
        if (seeds.size() != 50) throw new IllegalStateException("Pilot must contain exactly 50 questions");
        Map<String, Long> typeCounts = seeds.stream().collect(Collectors.groupingBy(PilotQuestion::type, Collectors.counting()));
        if (!typeCounts.equals(Map.of("Technical", 17L, "Behavioral", 17L, "System Design", 16L))) {
            throw new IllegalStateException("Pilot type distribution is invalid: " + typeCounts);
        }
        long shared = seeds.stream().filter(seed -> "SHARED".equals(seed.sourceType())).count();
        long google = seeds.stream().filter(seed -> "COMPANY_SPECIFIC".equals(seed.sourceType())).count();
        if (shared != 38 || google != 12) throw new IllegalStateException("Pilot source distribution must be 38 shared and 12 Google-specific");

        Set<String> prompts = new HashSet<>();
        for (PilotQuestion seed : seeds) {
            if (seed.prompt() == null || !prompts.add(normalize(seed.prompt()))) throw new IllegalStateException("Duplicate or blank prompt");
            if (!InterviewTaxonomyInitializer.INTERVIEW_TYPES.contains(seed.type())) throw new IllegalStateException("Invalid interview type");
            if (!DIFFICULTIES.contains(seed.difficulty()) || !SOURCES.contains(seed.sourceType())) throw new IllegalStateException("Invalid question taxonomy");
            if (("SHARED".equals(seed.sourceType()) && seed.company() != null)
                    || ("COMPANY_SPECIFIC".equals(seed.sourceType()) && !"Google".equals(seed.company()))) {
                throw new IllegalStateException("Invalid company/source combination");
            }
            if (seed.expectedAnswerSummary() == null || seed.expectedAnswerSummary().isBlank()) throw new IllegalStateException("Expected answer cannot be blank");
            if (seed.rubrics() == null || seed.rubrics().size() != 5) throw new IllegalStateException("Every question requires five rubrics");
            if (seed.rubrics().stream().mapToInt(PilotRubric::weight).sum() != 100) throw new IllegalStateException("Rubric weights must total 100");
            Set<Integer> orders = seed.rubrics().stream().map(PilotRubric::order).collect(Collectors.toSet());
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

    public record PilotQuestion(String type, String topic, String difficulty, String sourceType, String company,
                                String prompt, String expectedAnswerSummary, List<PilotRubric> rubrics) {}
    public record PilotRubric(int order, String name, String description, String expectedEvidence,
                              String acceptableAlternatives, String keywords, int weight) {}
}
