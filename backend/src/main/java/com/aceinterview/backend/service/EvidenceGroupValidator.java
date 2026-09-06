package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EvidenceGroupValidator {
    private static final Set<String> GENERIC=Set.of("answer","question","technical","behavioral","system","design","implementation","example","approach","company","role");
    private static final Set<String> TYPES=Set.of("TERM","ALTERNATIVE","INCORRECT");
    private final RubricEvidenceGroupRepository groups;
    private final EvidenceTermRepository terms;
    public EvidenceGroupValidator(RubricEvidenceGroupRepository groups,EvidenceTermRepository terms){this.groups=groups;this.terms=terms;}

    public QuestionValidation validate(Question question,List<RubricCriterion> criteria){
        List<String> questionIssues=new ArrayList<>();
        if(criteria.size()!=5)questionIssues.add("Expected exactly 5 rubric criteria");
        if(criteria.stream().filter(c->"CORE".equals(c.getImportance())).count()!=3)questionIssues.add("Expected exactly 3 CORE criteria");
        if(criteria.stream().filter(c->"SUPPORTING".equals(c.getImportance())).count()!=2)questionIssues.add("Expected exactly 2 SUPPORTING criteria");
        List<CriterionValidation> results=new ArrayList<>();
        for(RubricCriterion criterion:criteria)results.add(validateCriterion(question,criterion));
        for(int i=0;i<results.size();i++)for(int j=i+1;j<results.size();j++){
            double overlap=jaccard(results.get(i).positiveEvidence(),results.get(j).positiveEvidence());
            if(overlap>=.85)questionIssues.add("Criteria "+(i+1)+" and "+(j+1)+" have excessive evidence overlap");
        }
        return new QuestionValidation(question.getId(),questionIssues,results);
    }

    private CriterionValidation validateCriterion(Question question,RubricCriterion criterion){
        List<String> issues=new ArrayList<>();List<RubricEvidenceGroup> evidenceGroups=groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId());
        if(evidenceGroups.size()<2||evidenceGroups.size()>4)issues.add("Evidence group count must be 2-4");
        Set<String> concepts=new HashSet<>(),positive=new HashSet<>();
        for(RubricEvidenceGroup group:evidenceGroups){
            String concept=normalize(group.getConcept());if(!concepts.add(concept))issues.add("Duplicate evidence-group concept");
            List<EvidenceTerm> groupTerms=terms.findByEvidenceGroupId(group.getId());
            if(groupTerms.stream().noneMatch(t->Set.of("TERM","ALTERNATIVE").contains(t.getTermType())))issues.add("Group has no positive evidence: "+group.getConcept());
            if(groupTerms.stream().anyMatch(t->!TYPES.contains(t.getTermType())))issues.add("Invalid evidence term type");
            List<String> normalized=groupTerms.stream().filter(t->!"INCORRECT".equals(t.getTermType())).map(t->normalize(t.getValue())).filter(v->!v.isBlank()).toList();
            if(!normalized.isEmpty()&&normalized.stream().allMatch(this::genericOnly))issues.add("Generic-only evidence group: "+group.getConcept());
            for(String value:normalized)if(!positive.add(value))issues.add("Duplicate positive evidence: "+value);
        }
        return new CriterionValidation(criterion.getId(),issues,positive);
    }

    private boolean genericOnly(String value){Set<String> tokens=tokens(value);return tokens.isEmpty()||GENERIC.containsAll(tokens);}
    private String normalize(String value){return value==null?"":value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private Set<String> tokens(String value){return Arrays.stream(normalize(value).split(" ")).filter(v->v.length()>3).collect(Collectors.toSet());}
    private double jaccard(Set<String>a,Set<String>b){Set<String>left=new HashSet<>(a);left.retainAll(b);Set<String>all=new HashSet<>(a);all.addAll(b);return all.isEmpty()?0:(double)left.size()/all.size();}
    public record CriterionValidation(Long criterionId,List<String> issues,Set<String> positiveEvidence){public boolean valid(){return issues.isEmpty();}}
    public record QuestionValidation(Long questionId,List<String> issues,List<CriterionValidation> criteria){public boolean valid(){return issues.isEmpty()&&criteria.stream().allMatch(CriterionValidation::valid);}public int issueCount(){return issues.size()+criteria.stream().mapToInt(c->c.issues().size()).sum();}}
}
