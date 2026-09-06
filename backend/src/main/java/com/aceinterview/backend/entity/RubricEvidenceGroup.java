package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="rubric_evidence_groups",uniqueConstraints=@UniqueConstraint(columnNames={"rubric_criterion_id","group_order"}))
@Getter @Setter @NoArgsConstructor
public class RubricEvidenceGroup {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="rubric_criterion_id",nullable=false) private RubricCriterion rubricCriterion;
    @Column(name="group_order",nullable=false) private Integer groupOrder;
    @Column(nullable=false,length=200) private String concept;
    @Column(nullable=false,columnDefinition="TEXT") private String description;
    @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt=LocalDateTime.now();
}
