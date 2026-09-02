package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.AdminUserResponse;
import com.aceinterview.backend.repository.InterviewSessionRepository;
import com.aceinterview.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    public AdminController(UserRepository userRepository, InterviewSessionRepository interviewSessionRepository) {
        this.userRepository = userRepository;
        this.interviewSessionRepository = interviewSessionRepository;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(user -> AdminUserResponse.from(
                        user,
                        interviewSessionRepository.countByUserIdAndStatus(user.getId(), "COMPLETED")
                ))
                .toList();
    }
}
