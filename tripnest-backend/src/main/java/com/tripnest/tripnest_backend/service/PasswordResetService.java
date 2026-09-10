package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.MessageResponse;
import com.tripnest.tripnest_backend.entity.PasswordResetOtp;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.PasswordResetOtpRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public MessageResponse sendOtp(String email) {
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No account registered with email: " + cleanEmail));

        // Generate 6-digit numeric OTP
        int otpNumber = secureRandom.nextInt(900000) + 100000; // 100000 to 999999
        String otp = String.valueOf(otpNumber);

        // Remove previous OTPs for this email
        otpRepository.deleteByEmail(cleanEmail);

        // Save new OTP valid for 10 minutes
        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(cleanEmail)
                .otp(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .verified(false)
                .createdAt(LocalDateTime.now())
                .build();

        otpRepository.save(resetOtp);

        // Send email (and log to console)
        emailService.sendOtpEmail(user.getEmail(), otp);

        return new MessageResponse("A 6-digit verification code has been sent to " + cleanEmail);
    }

    @Transactional
    public MessageResponse verifyOtp(String email, String otp) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otp.trim();

        PasswordResetOtp resetOtp = otpRepository.findTopByEmailAndOtpOrderByCreatedAtDesc(cleanEmail, cleanOtp)
                .orElseThrow(() -> new RuntimeException("Invalid verification code. Please check and try again."));

        if (resetOtp.isExpired()) {
            throw new RuntimeException("This verification code has expired. Please request a new one.");
        }

        resetOtp.setVerified(true);
        otpRepository.save(resetOtp);

        return new MessageResponse("Verification code confirmed successfully. Please enter your new password.");
    }

    @Transactional
    public MessageResponse resetPasswordWithOtp(String email, String otp, String newPassword) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otp.trim();

        PasswordResetOtp resetOtp = otpRepository.findTopByEmailAndOtpOrderByCreatedAtDesc(cleanEmail, cleanOtp)
                .orElseThrow(() -> new RuntimeException("Invalid or missing verification code."));

        if (resetOtp.isExpired()) {
            throw new RuntimeException("This verification code has expired. Please request a new one.");
        }

        if (!resetOtp.isVerified()) {
            throw new RuntimeException("Please verify your 6-digit code first before setting a new password.");
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("User account not found: " + cleanEmail));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clean up OTPs
        otpRepository.deleteByEmail(cleanEmail);

        log.info("🔐 Password successfully reset for user: {}", cleanEmail);
        return new MessageResponse("Password has been reset successfully. You can now log in with your new password.");
    }
}
