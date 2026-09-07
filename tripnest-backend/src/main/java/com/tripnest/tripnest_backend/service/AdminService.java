package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.AdminStatsResponse;
import com.tripnest.tripnest_backend.dto.UserSummaryResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.ExpenseRepository;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DestinationRepository destinationRepository;
    private final TripRepository tripRepository;
    private final ExpenseRepository expenseRepository;
    private final NotificationRepository notificationRepository;

    public List<UserSummaryResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummaryResponse(u.getId(), u.getName(), u.getEmail(),
                        u.getRole() != null ? u.getRole().getName() : "TRAVELER"))
                .toList();
    }

    public UserSummaryResponse updateUserRole(Integer userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        Role newRole = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role does not exist: " + roleName));
        user.setRole(newRole);
        User savedUser = userRepository.save(user);
        return new UserSummaryResponse(savedUser.getId(), savedUser.getName(),
                savedUser.getEmail(), savedUser.getRole().getName());
    }

    public AdminDashboardResponse getAdminDashboard() {
        // Component 1: User Analytics
        long totalUsers = userRepository.count();
        Map<String, Long> usersByRole = userRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        u -> u.getRole() != null ? u.getRole().getName() : "TRAVELER",
                        Collectors.counting()
                ));
        AdminDashboardResponse.UserAnalytics userAnalytics =
                new AdminDashboardResponse.UserAnalytics(totalUsers, usersByRole);

        // Component 2: Trip Analytics
        long totalTrips = tripRepository.count();
        long activeTrips = tripRepository.countByStatusIgnoreCase("ONGOING");
        long completedTrips = tripRepository.countByStatusIgnoreCase("COMPLETED");
        long plannedTrips = tripRepository.countByStatusIgnoreCase("PLANNED");
        long cancelledTrips = tripRepository.countByStatusIgnoreCase("CANCELLED");
        AdminDashboardResponse.TripAnalytics tripAnalytics =
                new AdminDashboardResponse.TripAnalytics(
                        totalTrips,
                        activeTrips,
                        completedTrips,
                        plannedTrips,
                        cancelledTrips
                );

        // Component 3: Destination Analytics
        long totalDestinations = destinationRepository.count();
        List<Object[]> popularRows = tripRepository.findMostPopularDestinationsPlatform();
        List<AdminDashboardResponse.PopularDestination> popularDestinations = popularRows.stream()
                .map(row -> {
                    Destination d = (Destination) row[0];
                    Long count = (Long) row[1];
                    return new AdminDashboardResponse.PopularDestination(
                            d.getId(),
                            d.getName(),
                            d.getCountry(),
                            d.getCity(),
                            d.getImageUrl(),
                            count
                    );
                })
                .toList();
        AdminDashboardResponse.DestinationAnalytics destinationAnalytics =
                new AdminDashboardResponse.DestinationAnalytics(totalDestinations, popularDestinations);

        // Component 4: Platform Stats
        long totalExpenses = expenseRepository.count();
        BigDecimal totalSpent = expenseRepository.sumTotalSpentPlatform();
        long totalNotifications = notificationRepository.count();
        AdminDashboardResponse.PlatformStats platformStats =
                new AdminDashboardResponse.PlatformStats(
                        totalExpenses,
                        totalSpent != null ? totalSpent : BigDecimal.ZERO,
                        totalNotifications
                );

        return new AdminDashboardResponse(
                userAnalytics,
                tripAnalytics,
                destinationAnalytics,
                platformStats
        );
    }

    public AdminStatsResponse getAdminStats() {
        long totalUsers = userRepository.count();
        long totalTrips = tripRepository.count();
        long totalDestinations = destinationRepository.count();
        long totalExpenses = expenseRepository.count();

        BigDecimal totalSpent = expenseRepository.sumTotalSpentPlatform();

        Map<String, Long> usersByRole = userRepository.findAll().stream()
                .collect(Collectors.groupingBy(
                        u -> u.getRole() != null ? u.getRole().getName() : "TRAVELER",
                        Collectors.counting()
                ));

        return new AdminStatsResponse(
                totalUsers,
                totalTrips,
                totalDestinations,
                totalExpenses,
                totalSpent != null ? totalSpent.doubleValue() : 0.0,
                usersByRole
        );
    }
}