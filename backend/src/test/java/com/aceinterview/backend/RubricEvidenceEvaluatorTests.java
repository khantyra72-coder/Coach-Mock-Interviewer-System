package com.aceinterview.backend;

import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.service.RubricEvidenceEvaluator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RubricEvidenceEvaluatorTests {
    private final RubricEvidenceEvaluator evaluator=new RubricEvidenceEvaluator();

    @Test void sharedGenericWordsCannotEarnCreditForAnotherCriterion(){
        RubricCriterion first=criterion("Algorithm choice","algorithm,technical,and,breadth first search,bfs");
        RubricCriterion second=criterion("Complexity","complexity,technical,and,linear,time");
        List<RubricCriterion> criteria=List.of(first,second);

        assertThat(evaluator.evaluate(first,criteria,"This technical answer discusses complexity and linear time.").status()).isEqualTo("MISSING");
        assertThat(evaluator.evaluate(second,criteria,"The complexity is linear time.").status()).isEqualTo("FULL");
    }

    private RubricCriterion criterion(String name,String keywords){RubricCriterion value=new RubricCriterion();value.setCriterionName(name);value.setKeywords(keywords);return value;}
}
