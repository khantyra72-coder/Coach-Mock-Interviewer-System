package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.InterviewResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InterviewResultRepository extends JpaRepository<InterviewResult, Long> {

    Optional<InterviewResult> findByInterviewSessionId(Long interviewSessionId);
}