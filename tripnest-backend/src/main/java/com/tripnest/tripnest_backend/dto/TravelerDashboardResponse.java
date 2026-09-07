package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelerDashboardResponse {

    // Component 1: Upcoming Trips
    private List<TripResponse> upcomingTrips;

    // Component 2: Budget Overview
    private BudgetOverview budgetOverview;

    // Component 3: Expense Summary across all user's trips
    private List<CategorySummary> expenseSummary;

    // Component 4: Favorite & Most-Visited Destinations
    private DestinationStats destinationStats;

    // Component 5: Basic Travel Stats
    private TravelStats travelStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetOverview {
        private BigDecimal totalBudgeted;
        private BigDecimal totalSpent;
        private BigDecimal remainingBudget;
        private String currency;
        private boolean isOverBudget;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationStats {
        private DestinationResponse favoriteDestination;
        private List<DestinationVisitCount> mostVisitedDestinations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationVisitCount {
        private Integer destinationId;
        private String destinationName;
        private String country;
        private String city;
        private String imageUrl;
        private Long visitCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TravelStats {
        private long totalTripsTaken;
        private long totalDestinationsVisited;
        private long totalCountriesVisited;
        private BigDecimal totalAmountSpent;
    }
}
