package com.tripnest.tripnest_backend;

import com.tripnest.tripnest_backend.dto.AdminDashboardResponse;
import com.tripnest.tripnest_backend.dto.TravelerDashboardResponse;
import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.service.AdminService;
import com.tripnest.tripnest_backend.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class DashboardIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User testUser;
    private Destination destinationParis;
    private Destination destinationGoa;

    @BeforeEach
    void setUp() {
        Role role = roleRepository.findByName("TRAVELER")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("TRAVELER");
                    return roleRepository.save(r);
                });

        destinationParis = destinationRepository.save(new Destination(null, "Paris", "France", "Paris", "City of Lights", "paris.jpg", 48.8566, 2.3522));
        destinationGoa = destinationRepository.save(new Destination(null, "Goa", "India", "Panaji", "Beaches and sun", "goa.jpg", 15.2993, 74.1240));

        testUser = new User();
        testUser.setName("Alice Traveler");
        testUser.setEmail("alice.dashboard@test.com");
        testUser.setPasswordHash("hashed123");
        testUser.setRole(role);
        testUser.setFavoriteDestination(destinationParis);
        testUser = userRepository.save(testUser);
    }

    @Test
    void testTravelerDashboard_AllFiveComponents() {
        // Create upcoming trip (starts in 5 days)
        Trip upcomingTrip = new Trip();
        upcomingTrip.setTitle("Paris Spring Tour");
        upcomingTrip.setUser(testUser);
        upcomingTrip.setDestination(destinationParis);
        upcomingTrip.setStartDate(LocalDate.now().plusDays(5));
        upcomingTrip.setEndDate(LocalDate.now().plusDays(10));
        upcomingTrip.setBudget(2500.0);
        upcomingTrip.setStatus("PLANNED");
        upcomingTrip = tripRepository.save(upcomingTrip);

        // Create past/completed trip
        Trip pastTrip = new Trip();
        pastTrip.setTitle("Goa Beach Holiday");
        pastTrip.setUser(testUser);
        pastTrip.setDestination(destinationGoa);
        pastTrip.setStartDate(LocalDate.now().minusDays(20));
        pastTrip.setEndDate(LocalDate.now().minusDays(15));
        pastTrip.setBudget(1000.0);
        pastTrip.setStatus("COMPLETED");
        pastTrip = tripRepository.save(pastTrip);

        // Add expenses
        Expense expense1 = new Expense();
        expense1.setTrip(upcomingTrip);
        expense1.setPayer(testUser);
        expense1.setCategory("HOTEL");
        expense1.setAmount(new BigDecimal("500.00"));
        expense1.setExpenseDate(LocalDate.now());
        expenseRepository.save(expense1);

        Expense expense2 = new Expense();
        expense2.setTrip(pastTrip);
        expense2.setPayer(testUser);
        expense2.setCategory("FOOD");
        expense2.setAmount(new BigDecimal("150.00"));
        expense2.setExpenseDate(LocalDate.now().minusDays(18));
        expenseRepository.save(expense2);

        // Retrieve Traveler Dashboard
        TravelerDashboardResponse response = dashboardService.getTravelerDashboard(testUser.getEmail());

        // Component 1: Upcoming Trips
        assertThat(response.getUpcomingTrips()).hasSize(1);
        assertThat(response.getUpcomingTrips().get(0).getTitle()).isEqualTo("Paris Spring Tour");

        // Component 2: Budget Overview
        assertThat(response.getBudgetOverview()).isNotNull();
        assertThat(response.getBudgetOverview().getTotalBudgeted()).isEqualByComparingTo(new BigDecimal("3500.00"));
        assertThat(response.getBudgetOverview().getTotalSpent()).isEqualByComparingTo(new BigDecimal("650.00"));
        assertThat(response.getBudgetOverview().getRemainingBudget()).isEqualByComparingTo(new BigDecimal("2850.00"));
        assertThat(response.getBudgetOverview().isOverBudget()).isFalse();

        // Component 3: Expense Summary
        assertThat(response.getExpenseSummary()).hasSize(2);

        // Component 4: Favorite and Most Visited Destinations
        assertThat(response.getDestinationStats().getFavoriteDestination()).isNotNull();
        assertThat(response.getDestinationStats().getFavoriteDestination().getName()).isEqualTo("Paris");
        assertThat(response.getDestinationStats().getMostVisitedDestinations()).isNotEmpty();

        // Component 5: Basic Travel Stats
        assertThat(response.getTravelStats().getTotalTripsTaken()).isEqualTo(2);
        assertThat(response.getTravelStats().getTotalDestinationsVisited()).isEqualTo(2);
        assertThat(response.getTravelStats().getTotalCountriesVisited()).isEqualTo(2);
        assertThat(response.getTravelStats().getTotalAmountSpent()).isEqualByComparingTo(new BigDecimal("650.00"));
    }

    @Test
    void testAdminDashboard_AllFourComponents() {
        // Create trip
        Trip trip = new Trip();
        trip.setTitle("Admin Tracked Trip");
        trip.setUser(testUser);
        trip.setDestination(destinationParis);
        trip.setStartDate(LocalDate.now());
        trip.setEndDate(LocalDate.now().plusDays(2));
        trip.setStatus("ONGOING");
        tripRepository.save(trip);

        // Create notification
        Notification notification = new Notification();
        notification.setUser(testUser);
        notification.setTitle("Welcome");
        notification.setMessage("Welcome to TripNest");
        notification.setType("INFO");
        notificationRepository.save(notification);

        // Retrieve Admin Dashboard
        AdminDashboardResponse adminResp = adminService.getAdminDashboard();

        // Component 1: User Analytics
        assertThat(adminResp.getUserAnalytics().getTotalUsers()).isGreaterThanOrEqualTo(1);
        assertThat(adminResp.getUserAnalytics().getUsersByRole()).isNotEmpty();

        // Component 2: Trip Analytics
        assertThat(adminResp.getTripAnalytics().getTotalTrips()).isGreaterThanOrEqualTo(1);
        assertThat(adminResp.getTripAnalytics().getActiveTrips()).isGreaterThanOrEqualTo(1);

        // Component 3: Destination Analytics
        assertThat(adminResp.getDestinationAnalytics().getTotalDestinations()).isGreaterThanOrEqualTo(2);
        assertThat(adminResp.getDestinationAnalytics().getPopularDestinations()).isNotEmpty();

        // Component 4: Platform Stats
        assertThat(adminResp.getPlatformStats().getTotalNotificationsSent()).isGreaterThanOrEqualTo(1);
    }
}
