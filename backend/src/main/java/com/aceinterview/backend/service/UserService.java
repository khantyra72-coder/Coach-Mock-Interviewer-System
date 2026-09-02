package com.aceinterview.backend.service;

import com.aceinterview.backend.dto.ChangePasswordRequest;
import com.aceinterview.backend.dto.UpdateProfileRequest;
import com.aceinterview.backend.entity.User;
import com.aceinterview.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        if (!request.email().equals(user.getEmail())) {
            Optional<User> existing = userRepository.findByEmail(request.email());
            if (existing.isPresent() && !existing.get().getId().equals(userId)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Email already in use"
                );
            }
        }

        user.setName(request.name());
        user.setEmail(request.email());

        return userRepository.save(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Current password is incorrect"
            );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
