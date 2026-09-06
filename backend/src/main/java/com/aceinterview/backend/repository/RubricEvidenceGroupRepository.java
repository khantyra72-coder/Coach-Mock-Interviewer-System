package com.aceinterview.backend.repository;
import com.aceinterview.backend.entity.RubricEvidenceGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RubricEvidenceGroupRepository extends JpaRepository<RubricEvidenceGroup,Long>{List<RubricEvidenceGroup> findByRubricCriterionIdOrderByGroupOrderAsc(Long criterionId);void deleteByRubricCriterionId(Long criterionId);}
