package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.ErrorResponse;
import com.aceinterview.backend.dto.LoginRequest;
import com.aceinterview.backend.dto.RegisterRequest;
import com.aceinterview.backend.dto.UserResponse;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("An account with this email already exists."));
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        // role keeps the entity's default of "USER"

        User saved = userRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(UserResponse.from(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> user = userRepository.findByEmail(request.email());

        boolean passwordMatches = user.isPresent()
                && passwordEncoder.matches(request.password(), user.get().getPasswordHash());

        if (!passwordMatches) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }

        return ResponseEntity.ok(UserResponse.from(user.get()));
    }

    // Turns @Valid failures (e.g. a password that doesn't meet the rules)
    // into the same { "message": ... } shape the frontend already expects
    // from the 409/401 responses above, instead of Spring's default body.
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
