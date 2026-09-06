package com.aceinterview.backend;

import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import com.aceinterview.backend.repository.RubricEvidenceGroupRepository;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.ActiveProfiles;

import java.io.InputStream;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "app.evidence.fifty-question-pilot.enabled=true",
        "spring.jpa.show-sql=false"
})
@ActiveProfiles("test")
class FiftyQuestionEvidencePilotInitializerTests {
    @Autowired QuestionRepository questions;
    @Autowired RubricCriterionRepository criteria;
    @Autowired RubricEvidenceGroupRepository groups;
    @Autowired EvidenceGroupValidator validator;

    @Test
    void equipsAllFiftyPilotQuestionsWithValidatedEvidencePackages() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Set<Long> pilotQuestionIds = new HashSet<>();
        List<String> validationFailures = new ArrayList<>();

        try (InputStream input = new ClassPathResource("data/pilot-questions.json").getInputStream()) {
            for (JsonNode seed : mapper.readTree(input)) {
                Question question = questions.findByNormalizedText(normalize(seed.path("prompt").asText()))
                        .orElseThrow();
                assertThat(pilotQuestionIds.add(question.getId())).isTrue();

                List<RubricCriterion> rubric = criteria.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
                assertThat(rubric).hasSize(5);
                assertThat(rubric).allSatisfy(criterion -> {
                    assertThat(criterion.getRubricVersion()).isGreaterThanOrEqualTo(2);
                    assertThat(groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()))
                            .hasSizeBetween(2, 4);
                });
                EvidenceGroupValidator.QuestionValidation validation = validator.validate(question, rubric);
                if (!validation.valid()) {
                    validationFailures.add(question.getQuestionText() + " => " + validation);
                }
            }
        }

        assertThat(pilotQuestionIds).hasSize(50);
        assertThat(validationFailures).isEmpty();
    }

    private String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }
}
