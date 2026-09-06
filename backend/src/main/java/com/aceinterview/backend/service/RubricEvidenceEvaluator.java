package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.RubricCriterion;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

@Component
public class RubricEvidenceEvaluator {
    private static final Set<String> GENERIC=Set.of(
            "and","the","this","that","with","from","into","for","are","was","were","your","answer",
            "question","role","technical","behavioral","system","design","topic","explain","describe",
            "covers","specific","evaluates","whether","evidence","example","examples","approach"
    );

    public Evaluation evaluate(RubricCriterion target,List<RubricCriterion> criteria,String answer){
        Map<String,Long> frequency=criteria.stream()
                .flatMap(criterion->keywords(criterion).stream().distinct())
                .collect(java.util.stream.Collectors.groupingBy(value->value,java.util.stream.Collectors.counting()));
        List<String> specific=keywords(target).stream()
                .filter(value->!GENERIC.contains(value)&&frequency.getOrDefault(value,0L)==1L)
                .toList();
        List<String> matched=specific.stream().filter(value->contains(answer,value)).toList();
        if(specific.isEmpty())return new Evaluation("MISSING",matched);
        int fullThreshold=Math.min(2,specific.size());
        return new Evaluation(matched.size()>=fullThreshold?"FULL":matched.isEmpty()?"MISSING":"PARTIAL",matched);
    }

    private List<String> keywords(RubricCriterion criterion){
        if(criterion.getKeywords()==null)return List.of();
        return Arrays.stream(criterion.getKeywords().toLowerCase(Locale.ROOT).split("[,;|]"))
                .map(String::trim).filter(value->value.length()>2).distinct().toList();
    }

    private boolean contains(String answer,String value){
        return Pattern.compile("(?<![a-z0-9])"+Pattern.quote(value)+"(?![a-z0-9])").matcher(answer).find();
    }

    public record Evaluation(String status,List<String> matched){}
}
