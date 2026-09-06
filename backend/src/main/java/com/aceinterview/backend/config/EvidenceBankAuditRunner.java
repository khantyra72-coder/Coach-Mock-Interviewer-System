package com.aceinterview.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(50)
@ConditionalOnProperty(name = "app.evidence.bank-audit.enabled", havingValue = "true")
public class EvidenceBankAuditRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(EvidenceBankAuditRunner.class);
    private final JdbcTemplate jdbc;

    public EvidenceBankAuditRunner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        long questions = count("select count(*) from questions where active = true");
        long criteria = count("select count(*) from rubric_criteria rc join questions q on q.id = rc.question_id where q.active = true");
        long evidenceQuestions = count("select count(distinct rc.question_id) from rubric_criteria rc join questions q on q.id = rc.question_id join rubric_evidence_groups reg on reg.rubric_criterion_id = rc.id where q.active = true");
        long groups = count("select count(*) from rubric_evidence_groups reg join rubric_criteria rc on rc.id = reg.rubric_criterion_id join questions q on q.id = rc.question_id where q.active = true");
        long terms = count("select count(*) from evidence_terms et join rubric_evidence_groups reg on reg.id = et.evidence_group_id join rubric_criteria rc on rc.id = reg.rubric_criterion_id join questions q on q.id = rc.question_id where q.active = true");
        long missingCriteria = count("select count(*) from rubric_criteria rc join questions q on q.id = rc.question_id where q.active = true and not exists (select 1 from rubric_evidence_groups reg where reg.rubric_criterion_id = rc.id)");
        long reviseCriteria = count("select count(*) from rubric_criteria rc join questions q on q.id = rc.question_id where q.active = true and rc.evidence_status = 'REVISE'");
        long invalidQuestionPackages = count("""
                select count(*) from (
                  select question_id
                  from rubric_criteria rc
                  join questions q on q.id = rc.question_id
                  where q.active = true
                  group by question_id
                  having count(*) <> 5
                     or sum(weight) <> 100
                     or sum(case when importance = 'CORE' then 1 else 0 end) <> 3
                     or sum(case when importance = 'SUPPORTING' then 1 else 0 end) <> 2
                ) invalid
                """);
        long invalidGroupCounts = count("""
                select count(*) from (
                  select rc.id
                  from rubric_criteria rc
                  join questions q on q.id = rc.question_id
                  left join rubric_evidence_groups reg on reg.rubric_criterion_id = rc.id
                  where q.active = true
                  group by rc.id
                  having count(reg.id) < 2 or count(reg.id) > 4
                ) invalid
                """);

        log.info("Evidence bank audit: questions={}, criteria={}, evidenceQuestions={}, groups={}, terms={}, missingCriteria={}, reviseCriteria={}, invalidQuestionPackages={}, invalidGroupCounts={}",
                questions, criteria, evidenceQuestions, groups, terms, missingCriteria, reviseCriteria,
                invalidQuestionPackages, invalidGroupCounts);
    }

    private long count(String sql) {
        Long result = jdbc.queryForObject(sql, Long.class);
        return result == null ? 0 : result;
    }
}
