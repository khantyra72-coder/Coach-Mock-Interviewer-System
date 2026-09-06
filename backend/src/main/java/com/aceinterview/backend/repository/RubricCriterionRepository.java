package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.RubricCriterion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RubricCriterionRepository extends JpaRepository<RubricCriterion, Long> {
    List<RubricCriterion> findByQuestionIdOrderByCriterionOrderAsc(Long questionId);
    long countByQuestionId(Long questionId);
}
