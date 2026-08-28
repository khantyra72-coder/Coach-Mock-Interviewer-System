package com.aceinterview.backend.dto;

import com.aceinterview.backend.entity.Answer;
import com.aceinterview.backend.entity.InterviewResult;
import com.aceinterview.backend.entity.InterviewSession;
import com.aceinterview.backend.entity.Question;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    public record StartRequest(
            @NotBlank(message = "Role is required")
            String role,

            @NotBlank(message = "Interview type is required")
            String interviewType,

            String company
    ) {
    }

    public record SubmitAnswerRequest(
            @NotNull(message = "Question ID is required")
            Long questionId,

            @NotBlank(message = "Answer is required")
            String answerText
    ) {
    }

    public record CompleteRequest(
            @NotNull(message = "Overall score is required")
            @Min(value = 0, message = "Score cannot be below 0")
            @Max(value = 100, message = "Score cannot be above 100")
            Integer overallScore,

            String strengths,
            String improvements,
            String summaryFeedback
    ) {
    }

    public record SessionResponse(
            Long id,
            String role,
            String interviewType,
            String company,
            String status,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {
        public static SessionResponse from(InterviewSession session) {
            return new SessionResponse(
                    session.getId(),
                    session.getRole(),
                    session.getInterviewType(),
                    session.getCompany(),
                    session.getStatus(),
                    session.getStartedAt(),
                    session.getCompletedAt()
            );
        }
    }

    public record QuestionResponse(
            Long id,
            String questionText,
            String category,
            String difficulty
    ) {
        public static QuestionResponse from(Question question) {
            return new QuestionResponse(
                    question.getId(),
                    question.getQuestionText(),
                    question.getCategory(),
                    question.getDifficulty()
            );
        }
    }

    public record AnswerResponse(
            Long id,
            Long questionId,
            String questionText,
            String answerText,
            Integer score,
            String feedback,
            LocalDateTime answeredAt
    ) {
        public static AnswerResponse from(Answer answer) {
            return new AnswerResponse(
                    answer.getId(),
                    answer.getQuestion().getId(),
                    answer.getQuestion().getQuestionText(),
                    answer.getAnswerText(),
                    answer.getScore(),
                    answer.getFeedback(),
                    answer.getAnsweredAt()
            );
        }
    }

    public record ResultResponse(
            Long id,
            Integer overallScore,
            String strengths,
            String improvements,
            String summaryFeedback,
            LocalDateTime createdAt
    ) {
        public static ResultResponse from(InterviewResult result) {
            return new ResultResponse(
                    result.getId(),
                    result.getOverallScore(),
                    result.getStrengths(),
                    result.getImprovements(),
                    result.getSummaryFeedback(),
                    result.getCreatedAt()
            );
        }
    }

    public record DetailsResponse(
            SessionResponse session,
            List<AnswerResponse> answers,
            ResultResponse result
    ) {
    }
}