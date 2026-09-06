package com.aceinterview.backend;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.RubricCriterion;
import com.aceinterview.backend.service.EvidenceAwareScoringService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
class EvidenceAwareScoringServiceTests {
    private final EvidenceAwareScoringService scorer=new EvidenceAwareScoringService(mock(com.aceinterview.backend.repository.RubricEvidenceGroupRepository.class),mock(com.aceinterview.backend.repository.EvidenceTermRepository.class));
    @Test void requiredPerformanceBandsAreApplied(){
        assertThat(scorer.performanceBand(3,0)).isEqualTo(80);
        assertThat(scorer.performanceBand(3,1)).isEqualTo(85);
        assertThat(scorer.performanceBand(3,2)).isEqualTo(90);
        assertThat(scorer.performanceBand(4,0)).isEqualTo(90);
        assertThat(scorer.performanceBand(4,1)).isEqualTo(95);
        assertThat(scorer.performanceBand(5,0)).isEqualTo(100);
    }

    @Test void behavioralAnswerIsScoredByMeaningWithoutEchoingRubricKeywords(){
        Question question=new Question();
        question.setCategory("Behavioral");
        question.setTopic("prioritization");
        String answer="During launch prep for a core subscription feature, load testing revealed two competing blockers: " +
                "a checkout bug affecting 2% of international mobile users and a slow dashboard query. Recognizing that " +
                "checkout directly blocked revenue while dashboard latency affected existing users, I personally refactored " +
                "the checkout validation, deployed the fix within 24 hours, and then implemented Redis caching. As a result, " +
                "we launched on schedule with zero checkout failures, preserved $45,000 in sales, and dropped load time by 72%.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,behavioralRubric(),answer);

        assertThat(result.score()).isEqualTo(70);
        assertThat(result.relevant()).isTrue();
        assertThat(result.criteria()).extracting(EvidenceAwareScoringService.CriterionScore::status)
                .containsExactly("FULL","FULL","PARTIAL","FULL","MISSING");
    }

    @Test void unrelatedBehavioralAnswerDoesNotReceiveCreditForGenericWords(){
        Question question=new Question();
        question.setCategory("Behavioral");
        question.setTopic("prioritization");

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,behavioralRubric(),"I like software and work hard every day.");

        assertThat(result.score()).isZero();
        assertThat(result.relevant()).isFalse();
    }

    @Test void relevantAnswerWithMissingRubricCasesStillReceivesAtLeastSixtyFive(){
        Question question=new Question();
        question.setCategory("Behavioral");
        question.setTopic("prioritization");
        String answer="During a production release, a payment bug put customers at risk. I personally fixed and deployed it.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,behavioralRubric(),answer);

        assertThat(result.relevant()).isTrue();
        assertThat(result.score()).isEqualTo(65);
    }

    @Test void technicalAnswerReceivesCreditForEquivalentToolsAndMeasuredEvidence(){
        Question question=new Question();
        question.setCategory("Technical");
        question.setTopic("concurrency test design: implementation");
        String answer="I compared LitmusChaos and Chaos Mesh using operational complexity, fault-injection depth, and resource overhead. " +
                "I selected Chaos Mesh and used NetworkChaos with a K6 load test to simulate packet latency. The experiment revealed " +
                "that worker threads saturated because downstream connection pools had no explicit timeout. I fixed it with bounded " +
                "connection pools and a 1.5 second circuit breaker. Grafana confirmed p99 degraded gracefully, pools stayed under " +
                "60% capacity, fallback responses worked, and error rates remained below 0.01%.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,technicalRubric(),answer);

        assertThat(result.relevant()).isTrue();
        assertThat(result.score()).isGreaterThanOrEqualTo(80);
        assertThat(result.criteria()).extracting(EvidenceAwareScoringService.CriterionScore::status)
                .doesNotContain("MISSING");
    }

    @Test void mobileCrashAnswerRecognizesPlatformSpecificEvidence(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("mobile crash diagnosis implementation");
        String answer="I inspect native crash logs and thread dumps and deliberately trigger crashes under heavy CPU load. " +
                "The traces show the crash handler gets stuck because it performs network uploads during shutdown. I refactor it " +
                "to perform only minimal local disk writes, then use a background worker on the next app launch to upload the file. " +
                "Repeated crash tests confirm 100% of reports are saved before shutdown and uploaded after restart.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,technicalRubric(),answer);

        assertThat(result.score()).isGreaterThanOrEqualTo(80);
        assertThat(result.criteria()).extracting(EvidenceAwareScoringService.CriterionScore::status)
                .containsExactly("FULL","FULL","FULL","FULL","FULL");
    }

    @Test void companySpecificRubricNamesUseTheSameTechnicalConceptFamilies(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("API latency");
        List<RubricCriterion> rubric=List.of(criterion("Impact and baseline"),criterion("Falsifiable diagnosis"),criterion("Alternative comparison"),criterion("Failure containment"),criterion("Recovery proof"));
        String answer="I reproduced the timeout with a load test and recorded p99 latency and error rate. Traces revealed database pool saturation because requests lacked timeouts. " +
                "I compared a larger pool with bounded concurrency and chose bounded concurrency for lower resource risk. A circuit breaker provides fallback and rollback containment. " +
                "A regression benchmark confirmed p99 below 300 ms and errors below 0.1%.";

        assertThat(scorer.score(question,rubric,answer).criteria()).allSatisfy(item->assertThat(item.status()).isEqualTo("FULL"));
    }

    @Test void systemDesignRubricsAcceptConcreteArchitectureWithoutTemplatePhrases(){
        Question question=new Question();question.setCategory("System Design");question.setTopic("notification service");
        List<RubricCriterion> rubric=List.of(criterion("Quantified requirements"),criterion("Interfaces and component boundaries"),criterion("Data model and request flow"),criterion("Reliability and security"),criterion("Capacity, trade-offs, and operations"));
        String answer="Support one million users and 10,000 requests per second with a 99.9% availability target. An API gateway publishes validated requests to Kafka; channel workers own email and push delivery. " +
                "Messages are stored by user and notification id, and idempotency keys prevent duplicate delivery. Retries use a dead-letter queue, encrypted payloads, and multi-zone replicas. " +
                "We partition topics, autoscale workers, monitor queue latency, and trade stronger consistency for higher availability.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,rubric,answer);
        assertThat(result.score()).isGreaterThanOrEqualTo(90);
        assertThat(result.criteria()).extracting(EvidenceAwareScoringService.CriterionScore::status).doesNotContain("MISSING");
    }

    @Test void genericTestingClaimIsNotMistakenForACompleteTechnicalAnswer(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("concurrency test design");

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,technicalRubric(),"I would test it and monitor metrics.");

        assertThat(result.relevant()).isFalse();
        assertThat(result.score()).isLessThan(40);
    }

    @Test void unsafeBypassIsNotRewardedAsATechnicallySoundCorrection(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("design-token architecture diagnosis");
        String answer="CI checks fail because Style Dictionary cannot process the new token schema. Logs show raw JSON strings lack required platform keys. " +
                "I fix it by writing a Webpack loader that bypasses the token compiler, injects raw unparsed CSS with hardcoded fallback values, and suppresses validation warnings. " +
                "Integration tests confirm the build passes with zero warnings.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,technicalRubric(),answer);

        assertThat(result.incorrect()).isTrue();
        assertThat(result.score()).isLessThanOrEqualTo(69);
        assertThat(result.criteria().get(2).status()).isEqualTo("MISSING");
        assertThat(result.criteria().get(4).status()).isEqualTo("PARTIAL");
    }

    @Test void criticallyUnsafeSecurityAnswerDoesNotReceiveTheRelevantAnswerFloor(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("cloud attack path analysis");
        List<RubricCriterion> rubric=List.of(criterion("Impact and baseline"),criterion("Falsifiable diagnosis"),criterion("Alternative comparison"),criterion("Failure containment"),criterion("Recovery proof"));
        String answer="The analysis is off, so the assets are safe. To fix it, disable all firewalls, grant global read/write administrator access to every IAM user, and reboot a laptop. Verify it by asking whether email login works.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,rubric,answer);

        assertThat(result.criticalUnsafe()).isTrue();
        assertThat(result.score()).isLessThan(40);
        assertThat(result.criteria()).filteredOn(item->List.of("Failure containment","Recovery proof").contains(item.criterion().getCriterionName()))
                .allSatisfy(item->assertThat(item.status()).isEqualTo("MISSING"));
    }

    @Test void warningAgainstUnsafeSecurityChangesIsNotPenalized(){
        Question question=new Question();question.setCategory("Technical");question.setTopic("cloud security");
        String answer="Never disable the firewall or grant global administrator access. Preserve least privilege, inspect IAM graph changes, and verify the remediation with controlled access tests.";

        EvidenceAwareScoringService.ScoreResult result=scorer.score(question,technicalRubric(),answer);

        assertThat(result.criticalUnsafe()).isFalse();
    }

    private List<RubricCriterion> behavioralRubric(){
        return List.of(
                criterion("Concrete situation and stakes"),
                criterion("Demonstrated ownership"),
                criterion("Judgment and collaboration"),
                criterion("Measured outcome"),
                criterion("Transferred learning")
        );
    }

    private RubricCriterion criterion(String name){
        RubricCriterion criterion=new RubricCriterion();
        criterion.setCriterionName(name);
        criterion.setWeight(20);
        return criterion;
    }

    private List<RubricCriterion> technicalRubric(){
        return List.of(
                criterion("Evidence-based reproduction"),
                criterion("Root-cause isolation"),
                criterion("Technically sound correction"),
                criterion("Failure and rollback handling"),
                criterion("Proof of correctness")
        );
    }
}
