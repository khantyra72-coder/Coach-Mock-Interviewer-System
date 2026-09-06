package com.aceinterview.backend;

import com.aceinterview.backend.service.ExperienceLevelEvaluator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExperienceLevelEvaluatorTests {
    private final ExperienceLevelEvaluator evaluator=new ExperienceLevelEvaluator();

    @Test void sameAnswerHasDifferentDepthResultByExperienceLevel(){
        String criterion="Verification and measured result";
        String basicAnswer="I would test the fix and verify that it works.";
        assertThat(evaluator.evaluate("Intern",criterion,basicAnswer).full()).isTrue();
        assertThat(evaluator.evaluate("Entry (0–2 yrs)",criterion,basicAnswer).full()).isTrue();
        assertThat(evaluator.evaluate("Mid (3–5 yrs)",criterion,basicAnswer).full()).isFalse();
        assertThat(evaluator.evaluate("Senior",criterion,basicAnswer).full()).isFalse();
    }

    @Test void seniorAnswerCanSatisfySeniorDepth(){
        String answer="I would validate with tests, define an SLO threshold, use a canary rollout, and monitor rollback signals.";
        assertThat(evaluator.evaluate("Senior","Verification and measured result",answer).full()).isTrue();
    }

    @Test void strongBehavioralAnswerReceivesCreditWithoutEchoingRubricKeywords(){
        String answer="When a senior team member proposed migrating our main API gateway from Go to Node.js, " +
                "I evaluated the claim by building production-equivalent benchmarks. I gathered throughput, p99 latency, " +
                "and memory data, compared the alternative, and presented the evidence in an architecture review. " +
                "The team reached consensus to keep Go, preventing the rewrite and saving an estimated $120,000 in annual costs.";

        assertThat(evaluator.behavioralEvidenceStatus("Concrete situation and stakes",answer)).isEqualTo("FULL");
        assertThat(evaluator.behavioralEvidenceStatus("Demonstrated ownership",answer)).isEqualTo("FULL");
        assertThat(evaluator.behavioralEvidenceStatus("Judgment and collaboration",answer)).isEqualTo("FULL");
        assertThat(evaluator.behavioralEvidenceStatus("Measured outcome",answer)).isEqualTo("FULL");
        assertThat(evaluator.behavioralEvidenceStatus("Transferred learning",answer)).isEqualTo("MISSING");
    }

    @Test void vagueBehavioralAnswerIsNotOverScored(){
        String answer="The team handled the situation and it went well.";
        assertThat(evaluator.behavioralEvidenceStatus("Demonstrated ownership",answer)).isNotEqualTo("FULL");
        assertThat(evaluator.behavioralEvidenceStatus("Measured outcome",answer)).isNotEqualTo("FULL");
    }
}
