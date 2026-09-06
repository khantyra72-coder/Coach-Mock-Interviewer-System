package com.aceinterview.backend.repository;
import com.aceinterview.backend.entity.EvidenceTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface EvidenceTermRepository extends JpaRepository<EvidenceTerm,Long>{List<EvidenceTerm> findByEvidenceGroupId(Long groupId);void deleteByEvidenceGroupId(Long groupId);}
