package com.aceinterview.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tech_role_id", nullable = false)
    private TechRole techRole;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_type_id", nullable = false)
    private InterviewType interviewType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "normalized_text", nullable = false, unique = true, length = 768)
    private String normalizedText;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, length = 150)
    private String topic;

    @Column(nullable = false)
    private String difficulty;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "expected_answer_summary", nullable = false, columnDefinition = "LONGTEXT")
    private String expectedAnswerSummary;

    @Column(name = "review_status", nullable = false, length = 30)
    private String reviewStatus = "Draft";

    @Column(nullable = false)
    private boolean active = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    void prepareForSave() {
        if (questionText != null) {
            normalizedText = questionText.toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9]+", " ")
                    .trim();
        }
        updatedAt = LocalDateTime.now();
    }
}
