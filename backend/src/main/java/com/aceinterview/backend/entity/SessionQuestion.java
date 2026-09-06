package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_questions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"interview_session_id", "question_id"}),
        @UniqueConstraint(columnNames = {"interview_session_id", "question_order"})
})
@Getter @Setter @NoArgsConstructor
public class SessionQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_session_id", nullable = false)
    private InterviewSession interviewSession;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;
    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();
}
