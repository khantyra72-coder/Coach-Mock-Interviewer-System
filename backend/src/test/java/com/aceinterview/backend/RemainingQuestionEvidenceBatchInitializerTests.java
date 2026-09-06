package com.aceinterview.backend;

import com.aceinterview.backend.repository.QuestionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "app.evidence.remaining-batch.enabled=true",
        "app.evidence.remaining-batch.size=100",
        "spring.jpa.show-sql=false"
})
@ActiveProfiles("test")
class RemainingQuestionEvidenceBatchInitializerTests {
    @Autowired QuestionRepository questions;
    @Autowired EntityManager entityManager;

    @Test
    void addsAValidatedAndResumableEvidenceBatch() {
        assertThat(questions.countQuestionsMissingEvidence()).isEqualTo(1400);
        assertThat(count("select count(distinct rc.question_id) from rubric_criteria rc join rubric_evidence_groups reg on reg.rubric_criterion_id = rc.id"))
                .isEqualTo(100);
        assertThat(count("select count(*) from rubric_evidence_groups")).isEqualTo(1000);
        assertThat(count("select count(*) from rubric_criteria where evidence_status = 'REVISE'"))
                .isZero();
        assertThat(count("select count(*) from rubric_criteria rc join rubric_evidence_groups reg on reg.rubric_criterion_id = rc.id where rc.rubric_version < 2"))
                .isZero();
    }

    private long count(String sql) {
        return ((Number) entityManager.createNativeQuery(sql).getSingleResult()).longValue();
    }
}
