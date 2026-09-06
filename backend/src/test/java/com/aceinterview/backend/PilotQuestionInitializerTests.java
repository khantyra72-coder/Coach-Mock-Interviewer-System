package com.aceinterview.backend;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PilotQuestionInitializerTests {
    @Autowired EntityManager entityManager;

    private long count(String sql) {
        return ((Number) entityManager.createNativeQuery(sql).getSingleResult()).longValue();
    }

    @Test
    void importsACompleteValidPilot() {
        assertThat(count("select count(*) from questions")).isEqualTo(1500);
        assertThat(count("select count(*) from rubric_criteria")).isEqualTo(7500);
        assertThat(count("select count(*) from questions where source_type = 'SHARED'")).isEqualTo(600);
        assertThat(count("select count(*) from questions where source_type = 'COMPANY_SPECIFIC'")).isEqualTo(900);
        assertThat(count("select count(*) from questions where source_type = 'COMPANY_SPECIFIC' and category = 'Technical'")).isEqualTo(300);
        assertThat(count("select count(*) from questions where source_type = 'COMPANY_SPECIFIC' and category = 'Behavioral'")).isEqualTo(300);
        assertThat(count("select count(*) from questions where source_type = 'COMPANY_SPECIFIC' and category = 'System Design'")).isEqualTo(300);
        assertThat(count("select count(*) from (select question_id from rubric_criteria group by question_id having count(*) <> 5 or sum(weight) <> 100) invalid"))
                .isZero();
        assertThat(count("select count(*) from (select normalized_text from questions group by normalized_text having count(*) > 1) duplicates"))
                .isZero();
    }
}
