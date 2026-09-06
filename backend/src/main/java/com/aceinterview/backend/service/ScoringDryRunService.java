package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class ScoringDryRunService {
    private final AnswerRepository answers;private final RubricCriterionRepository criteria;private final EvidenceAwareScoringService scorer;
    public ScoringDryRunService(AnswerRepository answers,RubricCriterionRepository criteria,EvidenceAwareScoringService scorer){this.answers=answers;this.criteria=criteria;this.scorer=scorer;}
    @Transactional(readOnly=true) public SessionReport evaluate(long sessionId){
        List<AnswerReport> reports=new ArrayList<>();
        for(Answer answer:answers.findByInterviewSessionIdOrderByAnsweredAtAsc(sessionId)){
            List<RubricCriterion> rubric=criteria.findByQuestionIdOrderByCriterionOrderAsc(answer.getQuestion().getId());
            if(!scorer.supports(rubric))continue;
            EvidenceAwareScoringService.ScoreResult result=scorer.score(answer.getQuestion(),rubric,answer.getAnswerText());
            int full=(int)result.criteria().stream().filter(c->"FULL".equals(c.status())).count();
            int partial=(int)result.criteria().stream().filter(c->"PARTIAL".equals(c.status())).count();
            int missing=(int)result.criteria().stream().filter(c->"MISSING".equals(c.status())).count();
            reports.add(new AnswerReport(answer.getId(),answer.getQuestion().getId(),answer.getQuestion().getTopic(),answer.getScore(),result.score(),full,partial,missing,result.relevant(),result.incorrect()));
        }
        int oldAverage=(int)Math.round(reports.stream().mapToInt(r->r.oldScore()==null?0:r.oldScore()).average().orElse(0));
        int newAverage=(int)Math.round(reports.stream().mapToInt(AnswerReport::newScore).average().orElse(0));
        return new SessionReport(sessionId,oldAverage,newAverage,reports);
    }
    public record AnswerReport(Long answerId,Long questionId,String topic,Integer oldScore,int newScore,int full,int partial,int missing,boolean relevant,boolean incorrect){}
    public record SessionReport(long sessionId,int oldAverage,int newAverage,List<AnswerReport> answers){}
}
