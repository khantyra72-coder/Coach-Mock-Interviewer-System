package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.SessionQuestion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface SessionQuestionRepository extends JpaRepository<SessionQuestion, Long> {
    List<SessionQuestion> findByInterviewSessionIdOrderByQuestionOrderAsc(Long sessionId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SessionQuestion> findByInterviewSessionIdAndQuestionId(Long sessionId, Long questionId);
    void deleteByInterviewSessionId(Long sessionId);
}
