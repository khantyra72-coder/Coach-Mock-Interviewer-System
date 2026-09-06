package com.aceinterview.backend.repository;
import com.aceinterview.backend.entity.AnswerRubricScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AnswerRubricScoreRepository extends JpaRepository<AnswerRubricScore,Long>{
    List<AnswerRubricScore> findByAnswerIdOrderByRubricCriterionCriterionOrderAsc(Long answerId);
}
