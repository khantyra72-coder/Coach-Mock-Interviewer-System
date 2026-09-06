package com.aceinterview.backend.repository;

import com.aceinterview.backend.entity.TechRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TechRoleRepository extends JpaRepository<TechRole, Long> {
    Optional<TechRole> findByName(String name);
    List<TechRole> findByActiveTrueOrderByDisplayOrderAsc();
}
