package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.ChangePasswordRequest;
import com.aceinterview.backend.dto.ErrorResponse;
import com.aceinterview.backend.dto.UpdateProfileRequest;
import com.aceinterview.backend.dto.UserResponse;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(currentUserId(), request);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ErrorResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUserId(), request);
        return ResponseEntity.ok(new ErrorResponse("Password updated"));
    }

    // Same pattern AuthController.me() uses to identify the logged-in user
    // from the JWT-derived principal JwtAuthFilter puts in the security
    // context (the user's id, as a String).
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return Long.valueOf((String) auth.getPrincipal());
    }

    // UserService reports business errors (not found / email in use / wrong
    // current password) as ResponseStatusException. Spring's default
    // handling for that returns a ProblemDetail body (a "detail" field), not
    // the { "message": ... } shape the frontend's apiRequest() reads — so
    // this translates it, the same way handleValidationError below already
    // does for AuthController.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        return ResponseEntity
                .status(ex.getStatusCode())
                .body(new ErrorResponse(ex.getReason()));
    }

    // Turns @Valid failures (e.g. an invalid email, or a new password that
    // doesn't meet the rules) into the same { "message": ... } shape —
    // identical to AuthController's own handler for the same exception.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationError(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Invalid input.");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(message));
    }
}
