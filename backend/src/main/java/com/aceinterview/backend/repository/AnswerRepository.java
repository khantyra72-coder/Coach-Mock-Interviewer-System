package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByInterviewSessionIdOrderByAnsweredAtAsc(Long interviewSessionId);
    boolean existsByInterviewSessionIdAndQuestionId(Long interviewSessionId, Long questionId);
    Optional<Answer> findByInterviewSessionIdAndQuestionId(Long interviewSessionId, Long questionId);
}
