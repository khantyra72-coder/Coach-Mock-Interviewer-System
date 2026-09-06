package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.InterviewType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewTypeRepository extends JpaRepository<InterviewType, Long> {
    Optional<InterviewType> findByName(String name);
    List<InterviewType> findByActiveTrueOrderByDisplayOrderAsc();
}
