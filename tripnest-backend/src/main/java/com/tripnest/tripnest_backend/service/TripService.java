package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Itinerary;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final ItineraryRepository itineraryRepository;
    private final ActivityRepository activityRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripJoinRequestRepository joinRequestRepository;
    private final NotificationService notificationService;
    private final TripAccessService tripAccessService;

    @Transactional
    public TripResponse create(TripRequest request, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = new Trip();

        trip.setTitle(request.getTitle());
        trip.setUser(user);
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDescription(request.getDescription());
        trip.setBudget(request.getBudget());
        trip.setStatus(
                request.getStatus() != null
                        ? request.getStatus()
                        : "PLANNED"
        );

        if (request.getDestinationId() != null) {

            Destination dest = destinationRepository
                    .findById(request.getDestinationId())
                    .orElseThrow(() ->
                            new RuntimeException("Destination not found"));

            trip.setDestination(dest);
        }

        Trip savedTrip = tripRepository.save(trip);
        return toResponse(savedTrip);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> listMyTrips(String email) {
        return tripRepository.findAllAccessibleByUserEmail(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TripResponse getById(Long id, String email) {
        Trip trip = tripAccessService.checkTripAccess(id, email);
        return toResponse(trip);
    }

    @Transactional
    public TripResponse update(
            Long id,
            TripRequest request,
            String email
    ) {
        Trip trip = tripAccessService.checkGroupAdminOrOwnerAccess(id, email);

        LocalDate oldStartDate = trip.getStartDate();
        LocalDate oldEndDate = trip.getEndDate();
        Integer oldDestId = trip.getDestination() != null ? trip.getDestination().getId() : null;

        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setDescription(request.getDescription());
        trip.setBudget(request.getBudget());

        if (request.getStatus() != null) {
            trip.setStatus(request.getStatus());
        }

        if (request.getDestinationId() != null) {
            Destination dest = destinationRepository
                    .findById(request.getDestinationId())
                    .orElseThrow(() ->
                            new RuntimeException("Destination not found"));

            trip.setDestination(dest);
        } else {
            trip.setDestination(null);
        }

        Trip savedTrip = tripRepository.save(trip);

        boolean datesChanged = !Objects.equals(oldStartDate, savedTrip.getStartDate())
                || !Objects.equals(oldEndDate, savedTrip.getEndDate());
        Integer newDestId = savedTrip.getDestination() != null ? savedTrip.getDestination().getId() : null;
        boolean destChanged = !Objects.equals(oldDestId, newDestId);

        if (datesChanged || destChanged) {
            notifyTripMembersOfUpdate(savedTrip, email, datesChanged, destChanged);
        }

        return toResponse(savedTrip);

    }


    @Transactional
    public void delete(Long id, String email) {
        Trip trip = tripAccessService.checkGroupAdminOrOwnerAccess(id, email);

        // Delete all related records
        joinRequestRepository.deleteByTripId(id);
        tripMemberRepository.deleteByTripId(id);
        expenseRepository.deleteByTripId(id);
        budgetRepository.deleteByTripId(id);

        List<Itinerary> itineraries = itineraryRepository.findByTripIdOrderByDayDateAsc(id);
        for (Itinerary itinerary : itineraries) {
            activityRepository.deleteByItineraryId(itinerary.getId());
        }
        itineraryRepository.deleteByTripId(id);

        tripRepository.delete(trip);
    }

    private void notifyTripMembersOfUpdate(Trip trip, String modifierEmail, boolean datesChanged, boolean destChanged) {
        User modifier = userRepository.findByEmail(modifierEmail).orElse(null);
        String modifierName = modifier != null ? modifier.getName() : "A trip manager";

        String changeSummary;
        if (datesChanged && destChanged) {
            changeSummary = "travel dates and destination";
        } else if (datesChanged) {
            changeSummary = "travel dates (" + trip.getStartDate() + " to " + trip.getEndDate() + ")";
        } else {
            changeSummary = "destination (" + (trip.getDestination() != null ? trip.getDestination().getName() : "updated") + ")";
        }

        String title = "Travel Update: " + trip.getTitle();
        String message = modifierName + " updated the " + changeSummary + " for trip \"" + trip.getTitle() + "\".";

        // Collect other members + owner (excluding modifier)
        Set<User> recipients = new HashSet<>();
        if (trip.getUser() != null && !trip.getUser().getEmail().equalsIgnoreCase(modifierEmail)) {
            recipients.add(trip.getUser());
        }

        List<TripMember> members = tripMemberRepository.findByTripIdWithUser(trip.getId());
        for (TripMember member : members) {
            if (member.getUser() != null && !member.getUser().getEmail().equalsIgnoreCase(modifierEmail)) {
                recipients.add(member.getUser());
            }
        }

        for (User recipient : recipients) {
            notificationService.createNotification(
                    recipient,
                    title,
                    message,
                    "TRAVEL_UPDATE",
                    trip.getId()
            );
        }
    }

    private TripResponse toResponse(Trip t) {
        return new TripResponse(
                t.getId(),
                t.getTitle(),
                t.getDestination() != null
                        ? t.getDestination().getName()
                        : null,
                t.getUser().getName(),
                t.getStartDate(),
                t.getEndDate(),
                t.getDescription(),
                t.getBudget(),
                t.getStatus(),
                t.getCreatedAt()
        );
    }
}