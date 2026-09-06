package com.aceinterview.backend;

import com.aceinterview.backend.config.InterviewTaxonomyInitializer;
import com.aceinterview.backend.repository.CompanyRepository;
import com.aceinterview.backend.repository.InterviewTypeRepository;
import com.aceinterview.backend.repository.TechRoleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class InterviewTaxonomyInitializerTests {
    @Autowired CompanyRepository companyRepository;
    @Autowired TechRoleRepository techRoleRepository;
    @Autowired InterviewTypeRepository interviewTypeRepository;

    @Test
    void seedsTheCanonicalTaxonomyInDisplayOrder() {
        assertThat(companyRepository.findByActiveTrueOrderByDisplayOrderAsc())
                .extracting("name")
                .containsExactlyElementsOf(InterviewTaxonomyInitializer.COMPANIES);
        assertThat(techRoleRepository.findByActiveTrueOrderByDisplayOrderAsc())
                .extracting("name")
                .containsExactlyElementsOf(InterviewTaxonomyInitializer.TECH_ROLES);
        assertThat(interviewTypeRepository.findByActiveTrueOrderByDisplayOrderAsc())
                .extracting("name")
                .containsExactlyElementsOf(InterviewTaxonomyInitializer.INTERVIEW_TYPES);
    }
}
