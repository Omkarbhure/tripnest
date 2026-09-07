package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.*;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import com.tripnest.tripnest_backend.repository.ExpenseRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;

    @Transactional(readOnly = true)
    public TravelerDashboardResponse getTravelerDashboard(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        LocalDate today = LocalDate.now();

        // 1. Upcoming Trips (future start dates, ordered soonest first)
        List<Trip> upcomingTripEntities = tripRepository.findUpcomingTripsForUser(email, today);
        List<TripResponse> upcomingTrips = upcomingTripEntities.stream()
                .map(this::toTripResponse)
                .toList();

        // 2. All user trips for stats & budget aggregation
        List<Trip> allUserTrips = tripRepository.findAllAccessibleByUserEmail(email);

        // Calculate total budgeted amount across all trips
        BigDecimal totalBudgeted = allUserTrips.stream()
                .map(t -> {
                    if (t.getBudget() != null) {
                        return BigDecimal.valueOf(t.getBudget());
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total amount actually spent across all trips
        BigDecimal totalSpent = expenseRepository.sumTotalSpentForUser(email);
        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        BigDecimal remainingBudget = totalBudgeted.subtract(totalSpent);
        boolean isOverBudget = totalSpent.compareTo(totalBudgeted) > 0;

        TravelerDashboardResponse.BudgetOverview budgetOverview =
                new TravelerDashboardResponse.BudgetOverview(
                        totalBudgeted,
                        totalSpent,
                        remainingBudget,
                        "INR",
                        isOverBudget
                );

        // 3. Expense Summary across all user's trips combined
        List<Object[]> categoryRows = expenseRepository.sumByCategoryForUser(email);
        List<CategorySummary> expenseSummary = categoryRows.stream()
                .map(row -> new CategorySummary(
                        (String) row[0],
                        (BigDecimal) row[1]
                ))
                .toList();

        // 4. Favorite / Most-Visited Destinations
        Destination favDest = user.getFavoriteDestination();
        DestinationResponse favDestResponse = null;
        if (favDest != null) {
            favDestResponse = new DestinationResponse(
                    favDest.getId(),
                    favDest.getName(),
                    favDest.getCountry(),
                    favDest.getCity(),
                    favDest.getDescription(),
                    favDest.getImageUrl(),
                    favDest.getLatitude(),
                    favDest.getLongitude()
            );
        }

        List<Object[]> mostVisitedRows = tripRepository.findMostVisitedDestinationsForUser(email);
        List<TravelerDashboardResponse.DestinationVisitCount> mostVisitedDestinations = mostVisitedRows.stream()
                .map(row -> {
                    Destination d = (Destination) row[0];
                    Long count = (Long) row[1];
                    return new TravelerDashboardResponse.DestinationVisitCount(
                            d.getId(),
                            d.getName(),
                            d.getCountry(),
                            d.getCity(),
                            d.getImageUrl(),
                            count
                    );
                })
                .toList();

        TravelerDashboardResponse.DestinationStats destinationStats =
                new TravelerDashboardResponse.DestinationStats(
                        favDestResponse,
                        mostVisitedDestinations
                );

        // 5. Basic Travel Stats
        long totalTripsTaken = allUserTrips.size();

        Set<Integer> uniqueDestinationIds = new HashSet<>();
        Set<String> uniqueCountries = new HashSet<>();
        for (Trip trip : allUserTrips) {
            if (trip.getDestination() != null) {
                uniqueDestinationIds.add(trip.getDestination().getId());
                if (trip.getDestination().getCountry() != null && !trip.getDestination().getCountry().isBlank()) {
                    uniqueCountries.add(trip.getDestination().getCountry().trim().toLowerCase());
                }
            }
        }

        TravelerDashboardResponse.TravelStats travelStats =
                new TravelerDashboardResponse.TravelStats(
                        totalTripsTaken,
                        uniqueDestinationIds.size(),
                        uniqueCountries.size(),
                        totalSpent
                );

        return new TravelerDashboardResponse(
                upcomingTrips,
                budgetOverview,
                expenseSummary,
                destinationStats,
                travelStats
        );
    }

    private TripResponse toTripResponse(Trip t) {
        return new TripResponse(
                t.getId(),
                t.getTitle(),
                t.getDestination() != null ? t.getDestination().getName() : null,
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
