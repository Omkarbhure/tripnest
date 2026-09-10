package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailOrderByCreatedAtDesc(String email);

    Optional<PasswordResetOtp> findTopByEmailAndOtpOrderByCreatedAtDesc(String email, String otp);

    void deleteByEmail(String email);
}
