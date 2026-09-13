package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.AuthResponse;
import com.aceinterview.backend.dto.ErrorResponse;
import com.aceinterview.backend.dto.LoginRequest;
import com.aceinterview.backend.dto.RegisterRequest;
import com.aceinterview.backend.dto.UserResponse;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.repository.UserRepository;
import com.aceinterview.backend.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

        User saved = userRepository.save(user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(UserResponse.from(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return authenticate(request, "USER");
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody LoginRequest request) {
        // Admin presentation bypass
        if ("admin@aceinterview.local".equalsIgnoreCase(request.email().trim())
                && ("Aceadmin".equals(request.password()) || "Admin@Ace2026!".equals(request.password()))) {

            User adminUser = userRepository.findByEmail(request.email().trim())
                    .orElseGet(() -> {
                        User u = new User();
                        u.setEmail("admin@aceinterview.local");
                        u.setName("System Admin");
                        u.setPasswordHash(passwordEncoder.encode(request.password()));
                        return u;
                    });

            adminUser.setRole("ADMIN");
            adminUser.setLastLoginAt(LocalDateTime.now());
            userRepository.save(adminUser);

            String token = jwtService.generateToken(adminUser);
            return ResponseEntity.ok(AuthResponse.from(adminUser, token));
        }

        return authenticate(request, "ADMIN");
    }

    private ResponseEntity<?> authenticate(LoginRequest request, String requiredRole) {
        Optional<User> user = userRepository.findByEmail(request.email());

        boolean passwordMatches = user.isPresent()
                && requiredRole.equalsIgnoreCase(user.get().getRole())
                && passwordEncoder.matches(request.password(), user.get().getPasswordHash());

        if (!passwordMatches) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }

        user.get().setLastLoginAt(LocalDateTime.now());
        userRepository.save(user.get());
        String token = jwtService.generateToken(user.get());
        return ResponseEntity.ok(AuthResponse.from(user.get(), token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = Long.valueOf((String) auth.getPrincipal());

        return userRepository.findById(userId)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("User not found")));
    }

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