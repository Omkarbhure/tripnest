package com.tripnest.tripnest_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@tripnest.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        log.info("=================================================");
        log.info("🔑 [TRIPNEST PASSWORD RESET OTP]");
        log.info("📧 To: {}", toEmail);
        log.info("🔢 OTP Code: {}", otp);
        log.info("⏰ Valid for: 10 minutes");
        log.info("=================================================");

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("TripNest Password Reset - Your 6-Digit OTP");
                message.setText(
                    "Hello,\n\n" +
                    "We received a request to reset your password for your TripNest account.\n\n" +
                    "Your 6-digit OTP is: " + otp + "\n\n" +
                    "This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.\n\n" +
                    "— The TripNest Team"
                );
                mailSender.send(message);
                log.info("✅ OTP email sent successfully via SMTP to {}", toEmail);
            } catch (Exception e) {
                log.warn("⚠️ Could not send email via SMTP (using console fallback): {}", e.getMessage());
            }
        } else {
            log.info("ℹ️ JavaMailSender not active. OTP logged to console above.");
        }
    }
}
