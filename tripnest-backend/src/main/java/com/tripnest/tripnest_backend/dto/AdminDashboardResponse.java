package com.tripnest.tripnest_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    // Component 1: User Analytics
    private UserAnalytics userAnalytics;

    // Component 2: Trip Analytics
    private TripAnalytics tripAnalytics;

    // Component 3: Destination Analytics
    private DestinationAnalytics destinationAnalytics;

    // Component 4: Platform Stats
    private PlatformStats platformStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserAnalytics {
        private long totalUsers;
        private Map<String, Long> usersByRole;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripAnalytics {
        private long totalTrips;
        private long activeTrips;
        private long completedTrips;
        private long plannedTrips;
        private long cancelledTrips;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationAnalytics {
        private long totalDestinations;
        private List<PopularDestination> popularDestinations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularDestination {
        private Integer destinationId;
        private String destinationName;
        private String country;
        private String city;
        private String imageUrl;
        private Long tripCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlatformStats {
        private long totalExpensesLogged;
        private BigDecimal totalExpenseAmount;
        private long totalNotificationsSent;
    }
}
