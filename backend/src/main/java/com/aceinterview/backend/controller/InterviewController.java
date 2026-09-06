package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.InterviewDtos;
import com.aceinterview.backend.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping
    public ResponseEntity<InterviewDtos.StartResponse> startInterview(
            Authentication authentication,
            @Valid @RequestBody InterviewDtos.StartRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(interviewService.startInterview(userId(authentication), request));
    }

    @GetMapping
    public List<InterviewDtos.SessionResponse> getInterviewHistory(
            Authentication authentication
    ) {
        return interviewService.getInterviewHistory(userId(authentication));
    }

    @GetMapping("/questions")
    public List<InterviewDtos.QuestionResponse> getQuestions() {
        return interviewService.getQuestions();
    }

    @PostMapping("/{sessionId}/answers")
    public ResponseEntity<InterviewDtos.AnswerResponse> submitAnswer(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody InterviewDtos.SubmitAnswerRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(interviewService.submitAnswer(
                        userId(authentication), sessionId, request
                ));
    }

    @PostMapping("/{sessionId}/complete")
    public InterviewDtos.ResultResponse completeInterview(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody InterviewDtos.CompleteRequest request
    ) {
        return interviewService.completeInterview(
                userId(authentication), sessionId, request
        );
    }

    @GetMapping("/{sessionId}")
    public InterviewDtos.DetailsResponse getInterviewDetails(
            Authentication authentication,
            @PathVariable Long sessionId
    ) {
        return interviewService.getInterviewDetails(
                userId(authentication), sessionId
        );
    }

    private Long userId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
