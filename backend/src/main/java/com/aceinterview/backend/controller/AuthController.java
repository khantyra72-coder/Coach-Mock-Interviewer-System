package com.aceinterview.backend.controller;

import com.aceinterview.backend.dto.AuthResponse;
import com.aceinterview.backend.dto.LoginRequest;
import com.aceinterview.backend.dto.RegisterRequest;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.repository.UserRepository;
import com.aceinterview.backend.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return handleAuthentication(request, "USER");
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody LoginRequest request) {
        // Presentation Admin Bypass
        if ("admin@aceinterview.local".equalsIgnoreCase(request.email().trim())
                && ("Aceadmin".equals(request.password()) || "Admin@Ace2026!".equals(request.password()))) {

            User adminUser = userRepository.findByEmail(request.email().trim())
                    .orElseGet(() -> {
                        User u = new User();
                        u.setEmail("admin@aceinterview.local");
                        u.setName("System Admin");
                        u.setPasswordHash(passwordEncoder.encode(request.password()));
                        u.setCreatedAt(LocalDateTime.now());
                        return u;
                    });

            adminUser.setRole("ADMIN");
            adminUser.setLastLoginAt(LocalDateTime.now());
            userRepository.save(adminUser);

            String token = jwtService.generateToken(adminUser);
            return ResponseEntity.ok(AuthResponse.from(adminUser, token));
        }

        return handleAuthentication(request, "ADMIN");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(user, token));
    }

    private ResponseEntity<?> handleAuthentication(LoginRequest request, String requiredRole) {
        Optional<User> userOpt = userRepository.findByEmail(request.email().trim());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (requiredRole.equalsIgnoreCase(user.getRole())
                    && passwordEncoder.matches(request.password(), user.getPasswordHash())) {
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
                String token = jwtService.generateToken(user);
                return ResponseEntity.ok(AuthResponse.from(user, token));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
    }
}