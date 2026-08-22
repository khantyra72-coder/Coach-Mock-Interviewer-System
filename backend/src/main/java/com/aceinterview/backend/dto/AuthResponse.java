package com.aceinterview.backend.dto;

import com.aceinterview.backend.entity.User;

/**
 * What /api/login returns on success: the user info (still no password
 * anywhere) plus the signed JWT the frontend should send back as
 * "Authorization: Bearer <token>" on subsequent requests.
 */
public record AuthResponse(
        Long id,
        String name,
        String email,
        String role,
        String token
) {
    public static AuthResponse from(User user, String token) {
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), token);
    }
}
