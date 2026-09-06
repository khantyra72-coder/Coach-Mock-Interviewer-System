package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.Company;
import com.aceinterview.backend.entity.InterviewType;
import com.aceinterview.backend.entity.TechRole;
import com.aceinterview.backend.repository.CompanyRepository;
import com.aceinterview.backend.repository.InterviewTypeRepository;
import com.aceinterview.backend.repository.TechRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@ConditionalOnProperty(name="app.content.initializers.enabled",matchIfMissing=true)
@Order(1)
public class InterviewTaxonomyInitializer implements CommandLineRunner {
    public static final List<String> COMPANIES = List.of("Google", "Microsoft", "Amazon", "Apple", "Meta");
    public static final List<String> TECH_ROLES = List.of(
            "Software Engineer", "Frontend Developer", "Backend Developer", "Full-Stack Developer",
            "Data Scientist", "ML / AI Engineer", "Cloud / DevOps Engineer", "Mobile Developer",
            "Cybersecurity Analyst", "QA / Test Engineer"
    );
    public static final List<String> INTERVIEW_TYPES = List.of("Technical", "Behavioral", "System Design");

    private final CompanyRepository companyRepository;
    private final TechRoleRepository techRoleRepository;
    private final InterviewTypeRepository interviewTypeRepository;

    public InterviewTaxonomyInitializer(
            CompanyRepository companyRepository,
            TechRoleRepository techRoleRepository,
            InterviewTypeRepository interviewTypeRepository
    ) {
        this.companyRepository = companyRepository;
        this.techRoleRepository = techRoleRepository;
        this.interviewTypeRepository = interviewTypeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (int index = 0; index < COMPANIES.size(); index++) {
            Company company = companyRepository.findByName(COMPANIES.get(index)).orElseGet(Company::new);
            company.setName(COMPANIES.get(index));
            company.setDisplayOrder(index + 1);
            company.setActive(true);
            companyRepository.save(company);
        }
        for (int index = 0; index < TECH_ROLES.size(); index++) {
            TechRole role = techRoleRepository.findByName(TECH_ROLES.get(index)).orElseGet(TechRole::new);
            role.setName(TECH_ROLES.get(index));
            role.setDisplayOrder(index + 1);
            role.setActive(true);
            techRoleRepository.save(role);
        }
        for (int index = 0; index < INTERVIEW_TYPES.size(); index++) {
            InterviewType type = interviewTypeRepository.findByName(INTERVIEW_TYPES.get(index)).orElseGet(InterviewType::new);
            type.setName(INTERVIEW_TYPES.get(index));
            type.setDisplayOrder(index + 1);
            type.setActive(true);
            interviewTypeRepository.save(type);
        }
    }
}
