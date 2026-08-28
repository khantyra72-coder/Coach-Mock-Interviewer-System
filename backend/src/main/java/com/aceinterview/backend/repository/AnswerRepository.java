package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByInterviewSessionIdOrderByAnsweredAtAsc(Long interviewSessionId);
}