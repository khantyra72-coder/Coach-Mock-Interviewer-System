package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.QuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuestionHistoryRepository extends JpaRepository<QuestionHistory, Long> {
    Optional<QuestionHistory> findByUserIdAndQuestionId(Long userId, Long questionId);
}
