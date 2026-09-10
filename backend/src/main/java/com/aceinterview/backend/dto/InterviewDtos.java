package com.aceinterview.backend.dto;

import com.aceinterview.backend.entity.Answer;
import com.aceinterview.backend.entity.InterviewResult;
import com.aceinterview.backend.entity.InterviewSession;
import com.aceinterview.backend.entity.Question;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;

import java.time.LocalDateTime;
import java.util.List;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    public record StartRequest(
            @NotBlank(message = "Role is required")
            String role,

            String interviewType,

            List<String> interviewTypes,

            String company,
            String difficulty,
            String experienceLevel,
            List<String> topics,
            @NotNull(message = "Question count is required")
            @Min(5) @Max(15) Integer questionCount
    ) {
        @AssertTrue(message = "Question count must be 5, 10, or 15")
        public boolean isSupportedQuestionCount() {
            return questionCount != null && List.of(5, 10, 15).contains(questionCount);
        }
    }

    public record StartResponse(SessionResponse session, List<QuestionResponse> questions) {}

    public record SubmitAnswerRequest(
            @NotNull(message = "Question ID is required")
            Long questionId,

            @NotNull(message = "Answer is required")
            String answerText,

            @Min(0) @Max(100) Integer score,
            String feedback,
            String coveredConcepts,
            String missingConcepts
    ) {
    }

    public record CompleteRequest(
            @NotNull(message = "Overall score is required")
            @Min(value = 0, message = "Score cannot be below 0")
            @Max(value = 100, message = "Score cannot be above 100")
            Integer overallScore,

            @Min(0) @Max(100) Integer technicalScore,
            @Min(0) @Max(100) Integer behavioralScore,
            @Min(0) @Max(100) Integer conceptScore,
            @Min(0) @Max(100) Integer algorithmScore,
            @Min(0) @Max(100) Integer communicationScore,
            @Min(0) @Max(100) Integer problemSolvingScore,
            @Min(0) @Max(100) Integer systemDesignScore,

            String strengths,
            String improvements,
            String summaryFeedback,
            String resultDetails
    ) {
    }

    public record SessionResponse(
            Long id,
            String role,
            String interviewType,
            String company,
            String experienceLevel,
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
                    session.getExperienceLevel(),
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
            String difficulty,
            String topic,
            String sourceType
    ) {
        public static QuestionResponse from(Question question) {
            return new QuestionResponse(
                    question.getId(),
                    question.getQuestionText(),
                    question.getCategory(),
                    question.getDifficulty(),
                    question.getTopic(),
                    question.getSourceType()
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
            String coveredConcepts,
            String missingConcepts,
            LocalDateTime answeredAt,
            List<RubricScoreResponse> rubricScores
    ) {
        public static AnswerResponse from(Answer answer) {
            return new AnswerResponse(
                    answer.getId(),
                    answer.getQuestion().getId(),
                    answer.getQuestion().getQuestionText(),
                    answer.getAnswerText(),
                    answer.getScore(),
                    answer.getFeedback(),
                    answer.getCoveredConcepts(),
                    answer.getMissingConcepts(),
                    answer.getAnsweredAt(),
                    List.of()
            );
        }
    }

    public record RubricScoreResponse(String criterion,String status,Integer awardedPoints,Integer maximumPoints) {}

    public record ResultResponse(
            Long id,
            Integer overallScore,
            Integer technicalScore,
            Integer behavioralScore,
            Integer conceptScore,
            Integer algorithmScore,
            Integer communicationScore,
            Integer problemSolvingScore,
            Integer systemDesignScore,
            String strengths,
            String improvements,
            String summaryFeedback,
            String resultDetails,
            LocalDateTime createdAt
    ) {
        public static ResultResponse from(InterviewResult result) {
            return new ResultResponse(
                    result.getId(),
                    result.getOverallScore(),
                    result.getTechnicalScore(),
                    result.getBehavioralScore(),
                    result.getConceptScore(),
                    result.getAlgorithmScore(),
                    result.getCommunicationScore(),
                    result.getProblemSolvingScore(),
                    result.getSystemDesignScore(),
                    result.getStrengths(),
                    result.getImprovements(),
                    result.getSummaryFeedback(),
                    result.getResultDetails(),
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
