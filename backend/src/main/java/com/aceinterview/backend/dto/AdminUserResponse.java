package com.aceinterview.backend.dto;

import com.aceinterview.backend.entity.User;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        String role,
        long interviews,
        LocalDateTime joinedAt
) {
    public static AdminUserResponse from(User user, long interviews) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                interviews,
                user.getCreatedAt()
        );
    }
}
