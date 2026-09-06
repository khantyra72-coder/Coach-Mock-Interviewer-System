package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import org.slf4j.Logger;import org.slf4j.LoggerFactory;

@Component @Order(7)
@ConditionalOnProperty(name="app.content.initializers.enabled",matchIfMissing=true)
public class Session36EvidenceValidationRunner implements CommandLineRunner {
    private static final Logger log=LoggerFactory.getLogger(Session36EvidenceValidationRunner.class);
    private final SessionQuestionRepository sessions;private final RubricCriterionRepository criteria;private final EvidenceGroupValidator validator;
    public Session36EvidenceValidationRunner(SessionQuestionRepository sessions,RubricCriterionRepository criteria,EvidenceGroupValidator validator){this.sessions=sessions;this.criteria=criteria;this.validator=validator;}
    @Override @Transactional public void run(String...args){
        for(SessionQuestion assigned:sessions.findByInterviewSessionIdOrderByQuestionOrderAsc(Session36EvidencePilotInitializer.PILOT_SESSION_ID)){
            List<RubricCriterion> rubric=criteria.findByQuestionIdOrderByCriterionOrderAsc(assigned.getQuestion().getId());
            EvidenceGroupValidator.QuestionValidation result=validator.validate(assigned.getQuestion(),rubric);
            if(!result.valid())log.warn("Evidence validation issues for question {}: questionIssues={}, criteria={}",assigned.getQuestion().getId(),result.issues(),result.criteria().stream().filter(item->!item.valid()).toList());
            Set<Long> invalid=new HashSet<>();result.criteria().stream().filter(item->!item.valid()).map(EvidenceGroupValidator.CriterionValidation::criterionId).forEach(invalid::add);
            boolean questionInvalid=!result.issues().isEmpty();
            rubric.forEach(criterion->{criterion.setEvidenceStatus(questionInvalid||invalid.contains(criterion.getId())?"REVISE":"AUTO_VALIDATED");criteria.save(criterion);});
        }
    }
}
