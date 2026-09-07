package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.entity.Activity;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.TripMemberRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderSchedulerService {

    private final TripRepository tripRepository;
    private final ActivityRepository activityRepository;
    private final TripMemberRepository tripMemberRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Value("${app.scheduling.trip-reminders.days-ahead:3}")
    private int tripDaysAhead = 3;

    /**
     * Daily scheduled check for trips starting within the configured number of days.
     * Creates a TRIP_REMINDER notification for owner and members if not already sent today.
     */
    @Scheduled(cron = "${app.scheduling.trip-reminders.cron:0 0 8 * * *}")
    @Transactional
    public int sendTripReminders() {
        LocalDate today = LocalDate.now();
        LocalDate targetEnd = today.plusDays(tripDaysAhead);

        log.info("[TripReminders] Scanning trips starting between {} and {}", today, targetEnd);
        List<Trip> upcomingTrips = tripRepository.findByStartDateBetween(today, targetEnd);

        int sentCount = 0;

        for (Trip trip : upcomingTrips) {
            long daysUntil = ChronoUnit.DAYS.between(today, trip.getStartDate());
            if (daysUntil < 0) {
                continue;
            }

            String title = (daysUntil == 0)
                    ? "Trip Starting Today: " + trip.getTitle()
                    : "Upcoming Trip Reminder: " + trip.getTitle();

            String message = (daysUntil == 0)
                    ? "Your trip \"" + trip.getTitle() + "\" starts today! Have an amazing trip!"
                    : "Your trip \"" + trip.getTitle() + "\" starts in " + daysUntil + (daysUntil == 1 ? " day" : " days") + " (on " + trip.getStartDate() + "). Get ready!";

            // Collect all recipients (owner + members) without duplicates
            Set<User> recipients = new HashSet<>();
            if (trip.getUser() != null) {
                recipients.add(trip.getUser());
            }

            List<TripMember> members = tripMemberRepository.findByTripIdWithUser(trip.getId());
            for (TripMember member : members) {
                if (member.getUser() != null) {
                    recipients.add(member.getUser());
                }
            }

            for (User recipient : recipients) {
                // Deduplicate: avoid sending multiple trip reminders on the same day for the same trip
                boolean alreadySentToday = notificationRepository.existsByUserIdAndTypeAndRelatedTripIdAndCreatedAtAfter(
                        recipient.getId(),
                        "TRIP_REMINDER",
                        trip.getId(),
                        today.atStartOfDay()
                );

                if (!alreadySentToday) {
                    notificationService.createNotification(
                            recipient,
                            title,
                            message,
                            "TRIP_REMINDER",
                            trip.getId()
                    );
                    sentCount++;
                }
            }
        }

        log.info("[TripReminders] Sent {} trip reminder notification(s)", sentCount);
        return sentCount;
    }

    /**
     * Scheduled check for activities starting within the next day (today or tomorrow).
     * Avoids sending the same activity reminder more than once per user.
     */
    @Scheduled(cron = "${app.scheduling.activity-reminders.cron:0 0 8 * * *}")
    @Transactional
    public int sendActivityReminders() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        log.info("[ActivityReminders] Scanning activities scheduled between {} and {}", today, tomorrow);
        List<Activity> upcomingActivities = activityRepository.findActivitiesByDayDateBetween(today, tomorrow);

        int sentCount = 0;

        for (Activity activity : upcomingActivities) {
            if (activity.getItinerary() == null || activity.getItinerary().getTrip() == null) {
                continue;
            }

            Trip trip = activity.getItinerary().getTrip();
            LocalDate activityDate = activity.getItinerary().getDayDate();
            String dateLabel = activityDate.isEqual(today) ? "today" : "tomorrow (" + activityDate + ")";

            String timePart = activity.getStartTime() != null ? " at " + activity.getStartTime() : "";
            String locationPart = (activity.getLocation() != null && !activity.getLocation().isBlank())
                    ? " (" + activity.getLocation() + ")"
                    : "";

            String title = "Activity Reminder: " + activity.getTitle();
            String uniqueTag = "[Activity #" + activity.getId() + "]";
            String message = uniqueTag + " Reminder: Upcoming activity \"" + activity.getTitle()
                    + "\" for trip \"" + trip.getTitle() + "\" is scheduled for "
                    + dateLabel + timePart + locationPart + ".";

            // Collect all recipients (owner + members)
            Set<User> recipients = new HashSet<>();
            if (trip.getUser() != null) {
                recipients.add(trip.getUser());
            }

            List<TripMember> members = tripMemberRepository.findByTripIdWithUser(trip.getId());
            for (TripMember member : members) {
                if (member.getUser() != null) {
                    recipients.add(member.getUser());
                }
            }

            for (User recipient : recipients) {
                // Deduplicate: ensure reminder for this specific activity is sent at most once
                boolean alreadySent = notificationRepository.existsByUserIdAndTypeAndRelatedTripIdAndMessageContaining(
                        recipient.getId(),
                        "ACTIVITY_REMINDER",
                        trip.getId(),
                        uniqueTag
                );

                if (!alreadySent) {
                    notificationService.createNotification(
                            recipient,
                            title,
                            message,
                            "ACTIVITY_REMINDER",
                            trip.getId()
                    );
                    sentCount++;
                }
            }
        }

        log.info("[ActivityReminders] Sent {} activity reminder notification(s)", sentCount);
        return sentCount;
    }
}
