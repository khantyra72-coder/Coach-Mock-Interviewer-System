package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.SessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessionQuestionRepository extends JpaRepository<SessionQuestion, Long> {
    List<SessionQuestion> findByInterviewSessionIdOrderByQuestionOrderAsc(Long sessionId);
    Optional<SessionQuestion> findByInterviewSessionIdAndQuestionId(Long sessionId, Long questionId);
}
