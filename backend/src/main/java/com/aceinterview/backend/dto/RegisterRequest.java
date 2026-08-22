package com.aceinterview.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email,

        // Same five rules as the frontend's live checklist (Register.jsx,
        // PASSWORD_RULES / SPECIAL_CHAR_RE) — keep both in sync: at least 8
        // characters, one uppercase letter, one lowercase letter, one
        // number, one special character from !@#$%^&*()?_-
        @NotBlank(message = "Password is required")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()?_-]).{8,}$",
                message = "Password must be at least 8 characters and include an uppercase letter, "
                        + "a lowercase letter, a number, and a special character (e.g. !@#$%^&*()?_-)."
        )
        String password
) {
}
