package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_history", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}))
@Getter @Setter @NoArgsConstructor
public class QuestionHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
    @Column(name = "shown_count", nullable = false)
    private Integer shownCount = 0;
    @Column(name = "answered_count", nullable = false)
    private Integer answeredCount = 0;
    @Column(name = "first_shown_at", nullable = false, updatable = false)
    private LocalDateTime firstShownAt = LocalDateTime.now();
    @Column(name = "last_shown_at", nullable = false)
    private LocalDateTime lastShownAt = LocalDateTime.now();
    @Column(name = "last_answered_at")
    private LocalDateTime lastAnsweredAt;
}
