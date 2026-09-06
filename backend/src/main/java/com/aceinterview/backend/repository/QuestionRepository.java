package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByActiveTrue();
    List<Question> findByReviewStatusNotOrderByIdAsc(String reviewStatus);
    Optional<Question> findByNormalizedText(String normalizedText);

    @Query(value = """
            select q.* from questions q
            where q.active = true
              and exists (
                select 1 from rubric_criteria rc
                where rc.question_id = q.id
                  and not exists (
                    select 1 from rubric_evidence_groups reg
                    where reg.rubric_criterion_id = rc.id
                  )
              )
            order by q.id
            """, nativeQuery = true)
    List<Question> findQuestionsMissingEvidence(Pageable pageable);

    @Query(value = """
            select count(*) from questions q
            where q.active = true
              and exists (
                select 1 from rubric_criteria rc
                where rc.question_id = q.id
                  and not exists (
                    select 1 from rubric_evidence_groups reg
                    where reg.rubric_criterion_id = rc.id
                  )
              )
            """, nativeQuery = true)
    long countQuestionsMissingEvidence();

    @Query("select distinct rc.question from RubricCriterion rc where rc.question.active = true and rc.evidenceStatus = 'REVISE'")
    List<Question> findActiveQuestionsWithRevisableEvidence();
}
