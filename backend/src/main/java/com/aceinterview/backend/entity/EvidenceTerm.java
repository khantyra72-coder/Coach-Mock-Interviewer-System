package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="evidence_terms",uniqueConstraints=@UniqueConstraint(columnNames={"evidence_group_id","term_type","term_value"}))
@Getter @Setter @NoArgsConstructor
public class EvidenceTerm {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="evidence_group_id",nullable=false) private RubricEvidenceGroup evidenceGroup;
    @Column(name="term_type",nullable=false,length=20) private String termType;
    @Column(name="term_value",nullable=false,length=500) private String value;
    @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt=LocalDateTime.now();
}
