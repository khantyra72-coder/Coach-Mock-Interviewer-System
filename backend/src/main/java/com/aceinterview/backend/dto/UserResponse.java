package com.aceinterview.backend.dto;

import com.aceinterview.backend.entity.User;

/**
 * What we send back to the frontend after register/login.
 * Deliberately has no password field, so the hash can never leak out.
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
