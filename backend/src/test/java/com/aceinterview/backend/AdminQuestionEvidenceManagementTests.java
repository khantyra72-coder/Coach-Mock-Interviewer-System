package com.aceinterview.backend;

import com.aceinterview.backend.controller.AdminQuestionController;
import com.aceinterview.backend.controller.AdminQuestionController.*;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.RubricCriterionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.jpa.show-sql=false",
        "app.evidence.remaining-batch.enabled=true",
        "app.evidence.remaining-batch.size=100"
})
@ActiveProfiles("test")
class AdminQuestionEvidenceManagementTests {
    @Autowired AdminQuestionController controller;
    @Autowired QuestionRepository questions;
    @Autowired RubricCriterionRepository criteria;

    @Test
    void loadsEvidenceOnDemandAndUpdatesWithoutReplacingRubricRecords() {
        Question question = questions.findByActiveTrue().get(0);
        long criterionCountBefore = criteria.count();
        QuestionAdminResponse detail = controller.get(question.getId());
        List<Long> criterionIdsBefore = detail.rubrics().stream().map(RubricAdminResponse::id).toList();

        assertThat(controller.list().stream().filter(item -> item.id().equals(question.getId())).findFirst().orElseThrow()
                .rubrics()).allSatisfy(rubric -> assertThat(rubric.evidenceGroups()).isEmpty());
        assertThat(detail.rubrics()).hasSize(5).allSatisfy(rubric -> assertThat(rubric.evidenceGroups()).hasSizeBetween(2, 4));

        List<RubricWriteRequest> updatedRubrics = new ArrayList<>();
        for (int criterionIndex = 0; criterionIndex < detail.rubrics().size(); criterionIndex++) {
            RubricAdminResponse rubric = detail.rubrics().get(criterionIndex);
            List<EvidenceGroupWriteRequest> evidenceGroups = new ArrayList<>();
            for (int groupIndex = 0; groupIndex < rubric.evidenceGroups().size(); groupIndex++) {
                EvidenceGroupAdminResponse group = rubric.evidenceGroups().get(groupIndex);
                List<EvidenceTermWriteRequest> evidenceTerms = group.terms().stream()
                        .map(term -> new EvidenceTermWriteRequest(term.type(), term.value()))
                        .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
                if (criterionIndex == 0 && groupIndex == 0) {
                    evidenceTerms.add(new EvidenceTermWriteRequest("ALTERNATIVE", "administrator verified equivalent"));
                }
                evidenceGroups.add(new EvidenceGroupWriteRequest(group.concept(), group.description(), evidenceTerms));
            }
            updatedRubrics.add(new RubricWriteRequest(
                    rubric.name(), rubric.description(), rubric.expectedEvidence(), rubric.acceptableAlternatives(),
                    rubric.keywords(), rubric.weight(), rubric.importance(), rubric.rubricVersion(),
                    rubric.evidenceStatus(), rubric.semanticDescription(), evidenceGroups));
        }

        QuestionAdminResponse updated = controller.update(question.getId(), new QuestionWriteRequest(
                detail.questionText(), detail.role(), detail.interviewType(), detail.company(), detail.topic(),
                detail.difficulty(), detail.expectedAnswerSummary(), "Approved", updatedRubrics));

        assertThat(updated.rubrics().stream().map(RubricAdminResponse::id).toList()).isEqualTo(criterionIdsBefore);
        assertThat(criteria.count()).isEqualTo(criterionCountBefore);
        assertThat(updated.reviewStatus()).isEqualTo("Approved");
        assertThat(updated.active()).isTrue();
        assertThat(updated.rubrics()).allSatisfy(rubric -> assertThat(rubric.evidenceStatus()).isEqualTo("APPROVED"));
        assertThat(updated.rubrics().get(0).evidenceGroups().get(0).terms())
                .anySatisfy(term -> assertThat(term.value()).isEqualTo("administrator verified equivalent"));
    }
}
