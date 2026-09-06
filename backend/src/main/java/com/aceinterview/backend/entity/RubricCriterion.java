package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "rubric_criteria", uniqueConstraints = @UniqueConstraint(columnNames = {"question_id", "criterion_order"}))
@Getter @Setter @NoArgsConstructor
public class RubricCriterion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    @Column(name = "criterion_order", nullable = false)
    private Integer criterionOrder;
    @Column(name = "criterion_name", nullable = false, length = 150)
    private String criterionName;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    @Column(name = "expected_evidence", nullable = false, columnDefinition = "TEXT")
    private String expectedEvidence;
    @Column(name = "acceptable_alternatives", columnDefinition = "TEXT")
    private String acceptableAlternatives;
    @Column(columnDefinition = "TEXT")
    private String keywords;
    @Column(nullable = false)
    private Integer weight;
    @Column(nullable=false,length=20) private String importance="SUPPORTING";
    @Column(name="rubric_version",nullable=false) private Integer rubricVersion=1;
    @Column(name="evidence_status",nullable=false,length=20) private String evidenceStatus="DRAFT";
    @Column(name="semantic_description",columnDefinition="TEXT") private String semanticDescription;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    @PreUpdate void touch() { updatedAt = LocalDateTime.now(); }
}
