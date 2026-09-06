package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import com.aceinterview.backend.service.EvidenceGroupValidator;
import com.fasterxml.jackson.databind.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.InputStream;
import java.util.*;

@Component @Order(20)
@ConditionalOnProperty(name="app.evidence.fifty-question-pilot.enabled",havingValue="true")
public class FiftyQuestionEvidencePilotInitializer implements CommandLineRunner {
    private static final Logger log=LoggerFactory.getLogger(FiftyQuestionEvidencePilotInitializer.class);
    private final QuestionRepository questions;private final RubricCriterionRepository criteria;private final RubricEvidenceGroupRepository groups;private final EvidenceTermRepository terms;private final EvidenceGroupValidator validator;private final ObjectMapper mapper=new ObjectMapper();
    public FiftyQuestionEvidencePilotInitializer(QuestionRepository questions,RubricCriterionRepository criteria,RubricEvidenceGroupRepository groups,EvidenceTermRepository terms,EvidenceGroupValidator validator){this.questions=questions;this.criteria=criteria;this.groups=groups;this.terms=terms;this.validator=validator;}
    @Override @Transactional public void run(String...args)throws Exception{
        int processed=0,missingQuestions=0,invalidRubrics=0,validated=0,revise=0;
        try(InputStream input=new ClassPathResource("data/pilot-questions.json").getInputStream()){
            for(JsonNode seed:mapper.readTree(input)){
                String prompt=seed.path("prompt").asText();Question question=questions.findByNormalizedText(normalize(prompt)).orElse(null);if(question==null){missingQuestions++;continue;}
                List<RubricCriterion> rubric=criteria.findByQuestionIdOrderByCriterionOrderAsc(question.getId());if(rubric.size()!=5){invalidRubrics++;continue;}
                for(int i=0;i<rubric.size();i++)seedCriterion(question,rubric.get(i),i);
                terms.flush();groups.flush();criteria.flush();
                EvidenceGroupValidator.QuestionValidation result=validator.validate(question,rubric);Set<Long>invalid=new HashSet<>();result.criteria().stream().filter(v->!v.valid()).map(EvidenceGroupValidator.CriterionValidation::criterionId).forEach(invalid::add);
                boolean questionInvalid=!result.issues().isEmpty();rubric.forEach(c->{c.setEvidenceStatus(questionInvalid||invalid.contains(c.getId())?"REVISE":"AUTO_VALIDATED");criteria.save(c);});
                processed++;if(result.valid())validated++;else revise++;
            }
        }
        log.info("50-question evidence pilot complete: processed={}, validated={}, revise={}, missingQuestions={}, invalidRubrics={}",processed,validated,revise,missingQuestions,invalidRubrics);
    }
    private void seedCriterion(Question question,RubricCriterion criterion,int index){
        criterion.setImportance(index<3?"CORE":"SUPPORTING");criterion.setSemanticDescription(criterion.getExpectedEvidence());
        List<RubricEvidenceGroup> existingGroups=groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId());
        if(!existingGroups.isEmpty()){deduplicateExistingEvidence(existingGroups);if(criterion.getRubricVersion()==null||criterion.getRubricVersion()<2)criterion.setRubricVersion(2);criteria.save(criterion);return;}
        criterion.setRubricVersion(2);criterion.setEvidenceStatus("PILOT");criteria.save(criterion);
        LinkedHashSet<String> primary=split(criterion.getKeywords());addUnique(primary,question.getTopic());create(criterion,1,criterion.getCriterionName(),criterion.getExpectedEvidence(),"TERM",primary);
        LinkedHashSet<String> alternatives=split(criterion.getAcceptableAlternatives());alternatives.add(criterion.getExpectedEvidence());alternatives.addAll(equivalents(criterion.getCriterionName()));alternatives.removeIf(value->primary.stream().anyMatch(p->normalize(p).equals(normalize(value))));create(criterion,2,"Equivalent evidence for "+criterion.getCriterionName(),"Accept equivalent terminology and technically valid approaches.","ALTERNATIVE",alternatives);
    }
    private void deduplicateExistingEvidence(List<RubricEvidenceGroup> existingGroups){Set<String>seenPositive=new HashSet<>();for(RubricEvidenceGroup group:existingGroups)for(EvidenceTerm term:terms.findByEvidenceGroupId(group.getId()))if(!"INCORRECT".equals(term.getTermType())&&!seenPositive.add(normalize(term.getValue())))terms.delete(term);}
    private void create(RubricCriterion criterion,int order,String concept,String description,String type,Collection<String>values){RubricEvidenceGroup group=new RubricEvidenceGroup();group.setRubricCriterion(criterion);group.setGroupOrder(order);group.setConcept(concept);group.setDescription(description);group=groups.save(group);Set<String>seen=new HashSet<>();for(String value:values)if(value!=null&&!value.isBlank()&&seen.add(normalize(value))){EvidenceTerm term=new EvidenceTerm();term.setEvidenceGroup(group);term.setTermType(type);term.setValue(value.trim());terms.save(term);}}
    private LinkedHashSet<String> split(String value){LinkedHashSet<String>result=new LinkedHashSet<>();if(value!=null)Arrays.stream(value.split("[,;|]")).map(String::trim).filter(v->v.length()>2).forEach(v->addUnique(result,v));return result;}
    private void addUnique(LinkedHashSet<String> values,String candidate){if(candidate!=null&&!candidate.isBlank()&&values.stream().noneMatch(value->normalize(value).equals(normalize(candidate))))values.add(candidate);}
    private List<String> equivalents(String name){String n=name.toLowerCase(Locale.ROOT);if(n.matches(".*(complex|performance|measure|result|verification|correct).*"))return List.of("runtime and memory analysis","measurable validation","edge-case testing");if(n.matches(".*(trade|decision|alternative|selection).*"))return List.of("compare viable options","justify the choice","state the trade-offs");if(n.matches(".*(reliab|failure|rollback|recovery|operation).*"))return List.of("failure handling","safe rollback","monitoring and recovery");if(n.matches(".*(ownership|action|collabor|judgment).*"))return List.of("personal contribution","decision rationale","team coordination");return List.of("clear mechanism","concrete example","relevant evidence");}
    private String normalize(String value){return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
}
