package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EvidenceAwareScoringService {
    private final RubricEvidenceGroupRepository groups;private final EvidenceTermRepository terms;
    public EvidenceAwareScoringService(RubricEvidenceGroupRepository groups,EvidenceTermRepository terms){this.groups=groups;this.terms=terms;}
    public boolean supports(List<RubricCriterion> criteria){return criteria.size()==5&&criteria.stream().allMatch(c->c.getRubricVersion()!=null&&c.getRubricVersion()>=2&&!groups.findByRubricCriterionIdOrderByGroupOrderAsc(c.getId()).isEmpty());}
    public ScoreResult score(Question question,List<RubricCriterion> criteria,String answer){
        String text=normalize(answer);List<CriterionScore> scores=new ArrayList<>();boolean incorrect=false;
        for(RubricCriterion criterion:criteria){
            LinkedHashSet<String> matched=new LinkedHashSet<>();LinkedHashSet<String> incorrectMatched=new LinkedHashSet<>();
            for(RubricEvidenceGroup group:groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()))for(EvidenceTerm term:terms.findByEvidenceGroupId(group.getId())){
                if(matches(text,term.getValue())){if("INCORRECT".equals(term.getTermType()))incorrectMatched.add(term.getValue());else matched.add(term.getValue());}
            }
            incorrect|=!incorrectMatched.isEmpty();String status=matched.size()>=2?"FULL":matched.size()==1?"PARTIAL":"MISSING";
            int awarded="FULL".equals(status)?criterion.getWeight():"PARTIAL".equals(status)?criterion.getWeight()/2:0;
            scores.add(new CriterionScore(criterion,status,awarded,new ArrayList<>(matched),new ArrayList<>(incorrectMatched)));
        }
        int full=(int)scores.stream().filter(s->"FULL".equals(s.status())).count(),partial=(int)scores.stream().filter(s->"PARTIAL".equals(s.status())).count();
        int raw=performanceBand(full,partial);boolean relevant=topicRelated(text,question.getTopic())||scores.stream().filter(s->!"MISSING".equals(s.status())).count()>=2;
        int finalScore=Math.min(raw,relevant?100:39);if(incorrect)finalScore=Math.min(finalScore,69);
        return new ScoreResult(finalScore,relevant,incorrect,scores);
    }
    public int performanceBand(int full,int partial){int base=switch(full){case 0->0;case 1->40;case 2->60;case 3->80;case 4->90;default->100;};int increment=full==0?10:5;int cap=switch(full){case 0->50;case 1->60;case 2->75;case 3->90;case 4->95;default->100;};return Math.min(cap,base+partial*increment);}
    private boolean matches(String answer,String evidence){String value=normalize(evidence);if(value.length()<3)return false;if(answer.contains(value))return true;Set<String>w=tokens(value);if(w.size()<2)return false;Set<String>a=tokens(answer);long found=w.stream().filter(a::contains).count();return found>=2&&(double)found/w.size()>=.75;}
    private boolean topicRelated(String answer,String topic){Set<String>topicWords=tokens(topic),answerWords=tokens(answer);return !topicWords.isEmpty()&&topicWords.stream().filter(answerWords::contains).count()>=Math.min(2,topicWords.size());}
    private String normalize(String value){return value==null?"":value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private Set<String> tokens(String value){return Arrays.stream(normalize(value).split(" ")).filter(v->v.length()>3).map(v->v.endsWith("s")&&v.length()>4?v.substring(0,v.length()-1):v).collect(Collectors.toSet());}
    public record CriterionScore(RubricCriterion criterion,String status,int awarded,List<String> matched,List<String> incorrectMatched){}
    public record ScoreResult(int score,boolean relevant,boolean incorrect,List<CriterionScore> criteria){}
}
