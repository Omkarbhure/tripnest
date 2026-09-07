package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);

    long countByUserIdAndReadFalse(Integer userId);

    boolean existsByUserIdAndTypeAndRelatedTripId(Integer userId, String type, Long relatedTripId);

    boolean existsByUserIdAndTypeAndRelatedTripIdAndCreatedAtAfter(
            Integer userId,
            String type,
            Long relatedTripId,
            LocalDateTime createdAt
    );

    boolean existsByUserIdAndTypeAndRelatedTripIdAndMessageContaining(
            Integer userId,
            String type,
            Long relatedTripId,
            String substring
    );
}

