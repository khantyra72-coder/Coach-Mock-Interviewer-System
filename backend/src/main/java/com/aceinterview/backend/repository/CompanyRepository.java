package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByName(String name);
    List<Company> findByActiveTrueOrderByDisplayOrderAsc();
}
