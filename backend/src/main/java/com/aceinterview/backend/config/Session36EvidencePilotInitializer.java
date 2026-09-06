package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component @Order(5)
@ConditionalOnProperty(name="app.content.initializers.enabled",matchIfMissing=true)
public class Session36EvidencePilotInitializer implements CommandLineRunner {
    static final long PILOT_SESSION_ID=36L;
    private static final Set<String> GENERIC=Set.of("amazon","frontend developer","technical","and","implementation","question");
    private final SessionQuestionRepository sessionQuestions;
    private final RubricCriterionRepository criteria;
    private final RubricEvidenceGroupRepository groups;
    private final EvidenceTermRepository terms;

    public Session36EvidencePilotInitializer(SessionQuestionRepository sessionQuestions,RubricCriterionRepository criteria,
                                             RubricEvidenceGroupRepository groups,EvidenceTermRepository terms){
        this.sessionQuestions=sessionQuestions;this.criteria=criteria;this.groups=groups;this.terms=terms;
    }

    @Override @Transactional public void run(String...args){
        List<SessionQuestion> pilot=sessionQuestions.findByInterviewSessionIdOrderByQuestionOrderAsc(PILOT_SESSION_ID);
        for(SessionQuestion assigned:pilot){
            Question question=assigned.getQuestion();
            List<RubricCriterion> rubric=criteria.findByQuestionIdOrderByCriterionOrderAsc(question.getId());
            for(RubricCriterion criterion:rubric){
                criterion.setImportance(criterion.getCriterionOrder()<=3?"CORE":"SUPPORTING");
                criterion.setRubricVersion(2);criterion.setEvidenceStatus("PILOT");
                criterion.setSemanticDescription(criterion.getExpectedEvidence());criteria.save(criterion);
                if(!groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()).isEmpty())continue;
                RubricEvidenceGroup primary=group(criterion,1,criterion.getCriterionName(),criterion.getExpectedEvidence());
                LinkedHashSet<String> primaryTerms=new LinkedHashSet<>();
                if(criterion.getKeywords()!=null)Arrays.stream(criterion.getKeywords().split("[,;|]")).map(String::trim).filter(value->value.length()>2).filter(value->!GENERIC.contains(value.toLowerCase(Locale.ROOT))).forEach(primaryTerms::add);
                primaryTerms.add(question.getTopic());primaryTerms.forEach(value->term(primary,"TERM",value));

                RubricEvidenceGroup alternatives=group(criterion,2,"Equivalent evidence for "+criterion.getCriterionName(),"Accept semantically equivalent tools, mechanisms, measurements, or valid approaches.");
                alternatives(criterion.getCriterionName()).stream()
                        .filter(value->primaryTerms.stream().noneMatch(primaryValue->primaryValue.equalsIgnoreCase(value)))
                        .forEach(value->term(alternatives,"ALTERNATIVE",value));
                term(alternatives,"INCORRECT","claims success without a mechanism or supporting evidence");
            }
        }
    }

    private RubricEvidenceGroup group(RubricCriterion criterion,int order,String concept,String description){RubricEvidenceGroup value=new RubricEvidenceGroup();value.setRubricCriterion(criterion);value.setGroupOrder(order);value.setConcept(concept);value.setDescription(description);return groups.save(value);}
    private void term(RubricEvidenceGroup group,String type,String value){if(value==null||value.isBlank())return;EvidenceTerm term=new EvidenceTerm();term.setEvidenceGroup(group);term.setTermType(type);term.setValue(value.trim());terms.save(term);}
    private List<String> alternatives(String name){
        String value=name.toLowerCase(Locale.ROOT);
        if(value.matches(".*(baseline|scope|reproduction|evidence|impact).*"))return List.of("initial measurement","before-and-after comparison","reproduce consistently","telemetry","performance trace","measured user impact");
        if(value.matches(".*(root|causal|diagnosis|mechanism).*"))return List.of("falsifiable hypothesis","isolate the cause","controlled comparison","Chrome DevTools","heap snapshot","CPU profile","network waterfall");
        if(value.matches(".*(correction|alternative|sound|implementable).*"))return List.of("valid fix","mitigation","implementation change","compare trade-offs","compatibility consideration","resource cleanup");
        if(value.matches(".*(rollback|containment|rollout|failure).*"))return List.of("revert safely","feature flag","canary rollout","gradual release","fallback path","limit blast radius");
        return List.of("regression test","verify the fix","success metric","monitoring","acceptance threshold","cross-browser validation");
    }
}
