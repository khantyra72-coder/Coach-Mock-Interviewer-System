package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);

    Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndStatus(Long userId, String status);
}
