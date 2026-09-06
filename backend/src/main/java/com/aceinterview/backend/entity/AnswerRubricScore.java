package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name="answer_rubric_scores", uniqueConstraints=@UniqueConstraint(columnNames={"answer_id","rubric_criterion_id"}))
@Getter @Setter @NoArgsConstructor
public class AnswerRubricScore {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="answer_id",nullable=false) private Answer answer;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="rubric_criterion_id",nullable=false) private RubricCriterion rubricCriterion;
    @Column(nullable=false,length=20) private String status;
    @Column(name="awarded_points",nullable=false) private Integer awardedPoints;
    @Column(name="maximum_points",nullable=false) private Integer maximumPoints;
    @Column(name="matched_evidence",columnDefinition="TEXT") private String matchedEvidence;
    @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt=LocalDateTime.now();
}
