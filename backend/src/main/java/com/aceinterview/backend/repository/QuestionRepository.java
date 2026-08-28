package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByActiveTrue();
}