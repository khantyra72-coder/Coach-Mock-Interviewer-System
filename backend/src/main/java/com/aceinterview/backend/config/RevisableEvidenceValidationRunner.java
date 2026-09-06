package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Order(40)
@ConditionalOnProperty(name = "app.evidence.revise-validation.enabled", havingValue = "true")
public class RevisableEvidenceValidationRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(RevisableEvidenceValidationRunner.class);
    private final QuestionRepository questions;
    private final RubricCriterionRepository criteria;
    private final EvidenceGroupValidator validator;

    public RevisableEvidenceValidationRunner(QuestionRepository questions,
                                             RubricCriterionRepository criteria,
                                             EvidenceGroupValidator validator) {
        this.questions = questions;
        this.criteria = criteria;
        this.validator = validator;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Question> candidates = questions.findActiveQuestionsWithRevisableEvidence();
        int valid = 0;
        int revise = 0;
        for (Question question : candidates) {
            List<RubricCriterion> rubric = criteria.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            EvidenceGroupValidator.QuestionValidation result = validator.validate(question, rubric);
            Set<Long> invalidCriteria = new HashSet<>();
            result.criteria().stream().filter(item -> !item.valid())
                    .map(EvidenceGroupValidator.CriterionValidation::criterionId)
                    .forEach(invalidCriteria::add);
            boolean questionInvalid = !result.issues().isEmpty();
            for (RubricCriterion criterion : rubric) {
                criterion.setEvidenceStatus(questionInvalid || invalidCriteria.contains(criterion.getId())
                        ? "REVISE" : "AUTO_VALIDATED");
                criteria.save(criterion);
            }
            if (result.valid()) {
                valid++;
            } else {
                revise++;
                log.warn("Evidence remains REVISE for question {}: questionIssues={}, criterionIssues={}",
                        question.getId(), result.issues(),
                        result.criteria().stream().filter(item -> !item.valid()).toList());
            }
        }
        log.info("Revisable evidence validation complete: candidates={}, validated={}, remainingReviseQuestions={}",
                candidates.size(), valid, revise);
    }
}
