package com.aceinterview.backend.service;

import com.aceinterview.backend.dto.InterviewDtos;
import com.aceinterview.backend.entity.Answer;
import com.aceinterview.backend.entity.InterviewResult;
import com.aceinterview.backend.entity.InterviewSession;
import com.aceinterview.backend.entity.Question;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.repository.AnswerRepository;
import com.aceinterview.backend.repository.InterviewResultRepository;
import com.aceinterview.backend.repository.InterviewSessionRepository;
import com.aceinterview.backend.repository.QuestionRepository;
import com.aceinterview.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InterviewService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final InterviewResultRepository resultRepository;

    public InterviewService(
            UserRepository userRepository,
            InterviewSessionRepository sessionRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            InterviewResultRepository resultRepository
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.resultRepository = resultRepository;
    }

    public InterviewDtos.SessionResponse startInterview(
            Long userId,
            InterviewDtos.StartRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setRole(request.role().trim());
        session.setInterviewType(request.interviewType().trim());
        session.setCompany(cleanOptionalText(request.company()));

        return InterviewDtos.SessionResponse.from(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<InterviewDtos.SessionResponse> getInterviewHistory(Long userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(InterviewDtos.SessionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewDtos.QuestionResponse> getQuestions() {
        return questionRepository.findByActiveTrue()
                .stream()
                .map(InterviewDtos.QuestionResponse::from)
                .toList();
    }

    public InterviewDtos.AnswerResponse submitAnswer(
            Long userId,
            Long sessionId,
            InterviewDtos.SubmitAnswerRequest request
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This interview is already completed"
            );
        }

        Question question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Question not found"
                ));

        Answer answer = new Answer();
        answer.setInterviewSession(session);
        answer.setQuestion(question);
        answer.setAnswerText(request.answerText().trim());

        return InterviewDtos.AnswerResponse.from(answerRepository.save(answer));
    }

    public InterviewDtos.ResultResponse completeInterview(
            Long userId,
            Long sessionId,
            InterviewDtos.CompleteRequest request
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);

        InterviewResult result = resultRepository
                .findByInterviewSessionId(sessionId)
                .orElseGet(InterviewResult::new);

        if (result.getId() == null) {
            result.setInterviewSession(session);
        }

        result.setOverallScore(request.overallScore());
        result.setStrengths(cleanOptionalText(request.strengths()));
        result.setImprovements(cleanOptionalText(request.improvements()));
        result.setSummaryFeedback(cleanOptionalText(request.summaryFeedback()));

        session.setStatus("COMPLETED");
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(LocalDateTime.now());
        }

        sessionRepository.save(session);
        return InterviewDtos.ResultResponse.from(resultRepository.save(result));
    }

    @Transactional(readOnly = true)
    public InterviewDtos.DetailsResponse getInterviewDetails(
            Long userId,
            Long sessionId
    ) {
        InterviewSession session = findOwnedSession(userId, sessionId);

        List<InterviewDtos.AnswerResponse> answers =
                answerRepository.findByInterviewSessionIdOrderByAnsweredAtAsc(sessionId)
                        .stream()
                        .map(InterviewDtos.AnswerResponse::from)
                        .toList();

        InterviewDtos.ResultResponse result = resultRepository
                .findByInterviewSessionId(sessionId)
                .map(InterviewDtos.ResultResponse::from)
                .orElse(null);

        return new InterviewDtos.DetailsResponse(
                InterviewDtos.SessionResponse.from(session),
                answers,
                result
        );
    }

    private InterviewSession findOwnedSession(Long userId, Long sessionId) {
        return sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Interview session not found"
                ));
    }

    private String cleanOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}