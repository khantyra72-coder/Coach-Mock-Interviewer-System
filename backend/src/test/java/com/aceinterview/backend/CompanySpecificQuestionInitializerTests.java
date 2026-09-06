package com.aceinterview.backend;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest @ActiveProfiles("test")
class CompanySpecificQuestionInitializerTests {
    @Autowired EntityManager entityManager;
    private long count(String sql) { return ((Number) entityManager.createNativeQuery(sql).getSingleResult()).longValue(); }

    @Test void importsBalancedCompanySpecificBank() {
        assertThat(count("select count(*) from questions")).isEqualTo(1500);
        assertThat(count("select count(*) from questions where source_type='SHARED'")).isEqualTo(600);
        assertThat(count("select count(*) from questions where source_type='COMPANY_SPECIFIC'")).isEqualTo(900);
        assertThat(count("select count(*) from rubric_criteria")).isEqualTo(7500);
        assertThat(count("select count(distinct company_id) from questions where source_type='COMPANY_SPECIFIC'")).isEqualTo(5);
        assertThat(count("select count(*) from (select company_id,tech_role_id,interview_type_id from questions where source_type='COMPANY_SPECIFIC' group by company_id,tech_role_id,interview_type_id having count(*)<>6)x")).isZero();
        assertThat(count("select count(*) from questions where source_type='COMPANY_SPECIFIC' and review_status<>'Approved'")).isZero();
        assertThat(count("select count(*) from (select question_id from rubric_criteria group by question_id having count(*)<>5 or sum(weight)<>100)x")).isZero();
        assertThat(count("select count(*) from (select normalized_text from questions group by normalized_text having count(*)>1)x")).isZero();
        assertThat(count("select count(*) from (select expected_answer_summary from questions group by expected_answer_summary having count(*)>1)x")).isZero();
        assertThat(count("select count(*) from (select expected_evidence from rubric_criteria group by expected_evidence having count(*)>1)x")).isZero();
    }
}
