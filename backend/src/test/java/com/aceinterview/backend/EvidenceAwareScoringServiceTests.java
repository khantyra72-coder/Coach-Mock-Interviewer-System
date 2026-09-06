package com.aceinterview.backend;
import com.aceinterview.backend.service.EvidenceAwareScoringService;
import org.junit.jupiter.api.Test;
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
}
