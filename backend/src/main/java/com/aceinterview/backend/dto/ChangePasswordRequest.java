package com.aceinterview.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
        String currentPassword,

        // Same five rules as RegisterRequest's password field — keep both in
        // sync: at least 8 characters, one uppercase letter, one lowercase
        // letter, one number, one special character from !@#$%^&*()?_-
        @NotBlank(message = "New password is required")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()?_-]).{8,}$",
                message = "Password must be at least 8 characters and include an uppercase letter, "
                        + "a lowercase letter, a number, and a special character (e.g. !@#$%^&*()?_-)."
        )
        String newPassword
) {
}
