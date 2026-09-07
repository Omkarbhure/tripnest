package com.tripnest.tripnest_backend;

import com.tripnest.tripnest_backend.dto.ExpenseRequest;
import com.tripnest.tripnest_backend.dto.TripRequest;
import com.tripnest.tripnest_backend.dto.TripResponse;
import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.repository.*;
import com.tripnest.tripnest_backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class ScheduledRemindersAndAlertsIntegrationTest {

    @Autowired
    private ReminderSchedulerService reminderSchedulerService;

    @Autowired
    private TripService tripService;

    @Autowired
    private TripMemberService tripMemberService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    private User owner;
    private User member;
    private Destination destination1;
    private Destination destination2;

    @BeforeEach
    void setUp() {
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

        owner = userRepository.findByEmail("reminders_owner@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setName("Owner User");
                    u.setEmail("reminders_owner@test.com");
                    u.setPasswordHash("password123");
                    u.setRole(userRole);
                    return userRepository.save(u);
                });

        member = userRepository.findByEmail("reminders_member@test.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setName("Member User");
                    u.setEmail("reminders_member@test.com");
                    u.setPasswordHash("password123");
                    u.setRole(userRole);
                    return userRepository.save(u);
                });


        destination1 = destinationRepository.findById(1).orElseGet(() -> {
            Destination d = new Destination(1, "Goa", "India", "Goa", "Beach paradise", null);
            return destinationRepository.save(d);
        });

        destination2 = destinationRepository.findById(2).orElseGet(() -> {
            Destination d = new Destination(2, "Manali", "India", "Manali", "Mountain paradise", null);
            return destinationRepository.save(d);
        });
    }

    @Test
    void testTripReminders_SentToOwnerAndMembers_AndDeduplicated() {
        // Given: a trip starting in 2 days
        Trip trip = new Trip();
        trip.setTitle("Goa Beach Trip");
        trip.setUser(owner);
        trip.setStartDate(LocalDate.now().plusDays(2));
        trip.setEndDate(LocalDate.now().plusDays(6));
        trip.setStatus("PLANNED");
        trip = tripRepository.save(trip);

        // Add member
        TripMember tm = new TripMember();
        tm.setTrip(trip);
        tm.setUser(member);
        tm.setRole(TripMemberRole.MEMBER);
        tripMemberRepository.save(tm);

        // When: run reminder scheduler
        int sentFirstRun = reminderSchedulerService.sendTripReminders();
        assertThat(sentFirstRun).isGreaterThanOrEqualTo(2);

        // Verify notifications created
        var ownerNotifs = notificationService.getUserNotifications(owner.getEmail());
        assertThat(ownerNotifs).anyMatch(n ->
                n.getType().equals("TRIP_REMINDER") &&
                n.getTitle().contains("Upcoming Trip Reminder") &&
                n.getMessage().contains("Goa Beach Trip")
        );

        var memberNotifs = notificationService.getUserNotifications(member.getEmail());
        assertThat(memberNotifs).anyMatch(n ->
                n.getType().equals("TRIP_REMINDER") &&
                n.getTitle().contains("Upcoming Trip Reminder") &&
                n.getMessage().contains("Goa Beach Trip")
        );

        // When run again today: deduplication prevents duplicate notifications
        int sentSecondRun = reminderSchedulerService.sendTripReminders();
        assertThat(sentSecondRun).isEqualTo(0);
    }

    @Test
    void testActivityReminders_SentForTomorrow_AndAvoidsDuplicates() {
        // Given: trip with itinerary for tomorrow and an activity
        Trip trip = new Trip();
        trip.setTitle("Himalayan Trek");
        trip.setUser(owner);
        trip.setStartDate(LocalDate.now().plusDays(1));
        trip.setEndDate(LocalDate.now().plusDays(5));
        trip.setStatus("PLANNED");
        trip = tripRepository.save(trip);

        TripMember tm = new TripMember();
        tm.setTrip(trip);
        tm.setUser(member);
        tm.setRole(TripMemberRole.MEMBER);
        tripMemberRepository.save(tm);

        Itinerary itinerary = new Itinerary();
        itinerary.setTrip(trip);
        itinerary.setDayDate(LocalDate.now().plusDays(1));
        itinerary = itineraryRepository.save(itinerary);

        Activity activity = new Activity();
        activity.setItinerary(itinerary);
        activity.setTitle("Sunrise Valley Hike");
        activity.setStartTime(LocalTime.of(6, 30));
        activity.setLocation("Base Camp");
        activity.setType("ADVENTURE");
        Activity savedActivity = activityRepository.save(activity);

        // When: send activity reminders
        int sent = reminderSchedulerService.sendActivityReminders();
        assertThat(sent).isGreaterThanOrEqualTo(2);

        // Verify notifications received
        var ownerNotifs = notificationService.getUserNotifications(owner.getEmail());
        assertThat(ownerNotifs).anyMatch(n ->
                n.getType().equals("ACTIVITY_REMINDER") &&
                n.getTitle().contains("Sunrise Valley Hike") &&
                n.getMessage().contains("[Activity #" + savedActivity.getId() + "]")
        );

        // When run again: duplicate reminder avoided
        int sentSecondRun = reminderSchedulerService.sendActivityReminders();
        assertThat(sentSecondRun).isEqualTo(0);
    }

    @Test
    void testBudgetAlerts_80And100Thresholds_WithoutDuplicates() {
        // Given: trip with budget 1000 INR
        Trip trip = new Trip();
        trip.setTitle("Budget Tour");
        trip.setUser(owner);
        trip.setStartDate(LocalDate.now().plusDays(5));
        trip.setEndDate(LocalDate.now().plusDays(10));
        trip.setStatus("PLANNED");
        trip = tripRepository.save(trip);

        TripMember tm = new TripMember();
        tm.setTrip(trip);
        tm.setUser(member);
        tm.setRole(TripMemberRole.MEMBER);
        tripMemberRepository.save(tm);

        Budget budget = new Budget();
        budget.setTrip(trip);
        budget.setTotalBudget(new BigDecimal("1000.00"));
        budget.setSpentAmount(BigDecimal.ZERO);
        budget.setCurrency("INR");
        budgetRepository.save(budget);

        // Expense 1: 500 (50%) -> no alert
        ExpenseRequest exp1 = new ExpenseRequest();
        exp1.setCategory("FOOD");
        exp1.setAmount(new BigDecimal("500.00"));
        exp1.setExpenseDate(LocalDate.now());
        exp1.setDescription("Lunch");
        expenseService.createExpense(trip.getId(), exp1, owner.getEmail());

        var notifs1 = notificationService.getUserNotifications(owner.getEmail());
        assertThat(notifs1).noneMatch(n -> n.getType().equals("BUDGET_ALERT"));

        // Expense 2: 350 (total 850 -> 85%, crosses 80%)
        ExpenseRequest exp2 = new ExpenseRequest();
        exp2.setCategory("HOTEL");
        exp2.setAmount(new BigDecimal("350.00"));
        exp2.setExpenseDate(LocalDate.now());
        exp2.setDescription("Hotel advance");
        expenseService.createExpense(trip.getId(), exp2, member.getEmail());

        var notifs2 = notificationService.getUserNotifications(owner.getEmail());
        assertThat(notifs2).anyMatch(n ->
                n.getType().equals("BUDGET_ALERT") &&
                n.getTitle().contains("80% Reached")
        );

        long count80Owner1 = notificationService.getUserNotifications(owner.getEmail()).stream()
                .filter(n -> n.getType().equals("BUDGET_ALERT") && n.getTitle().contains("80%"))
                .count();
        assertThat(count80Owner1).isEqualTo(1);

        // Expense 3: 50 (total 900 -> 90%) -> 80% should NOT alert again
        ExpenseRequest exp3 = new ExpenseRequest();
        exp3.setCategory("FOOD");
        exp3.setAmount(new BigDecimal("50.00"));
        exp3.setExpenseDate(LocalDate.now());
        exp3.setDescription("Snacks");
        expenseService.createExpense(trip.getId(), exp3, owner.getEmail());

        long count80Owner2 = notificationService.getUserNotifications(owner.getEmail()).stream()
                .filter(n -> n.getType().equals("BUDGET_ALERT") && n.getTitle().contains("80%"))
                .count();
        assertThat(count80Owner2).isEqualTo(1);


        // Expense 4: 150 (total 1050 -> 105%, crosses 100%)
        ExpenseRequest exp4 = new ExpenseRequest();
        exp4.setCategory("TRANSPORTATION");
        exp4.setAmount(new BigDecimal("150.00"));
        exp4.setExpenseDate(LocalDate.now());
        exp4.setDescription("Cab");
        expenseService.createExpense(trip.getId(), exp4, member.getEmail());

        var notifs4 = notificationService.getUserNotifications(owner.getEmail());
        assertThat(notifs4).anyMatch(n ->
                n.getType().equals("BUDGET_ALERT") &&
                n.getTitle().contains("100% Reached")
        );
    }

    @Test
    void testTravelUpdates_TriggeredWhenCoreDetailsChange_ExcludesModifier() {
        // Given: trip owned by owner, member is GROUP_ADMIN
        Trip trip = new Trip();
        trip.setTitle("Kerala Backwaters");
        trip.setUser(owner);
        trip.setStartDate(LocalDate.now().plusDays(20));
        trip.setEndDate(LocalDate.now().plusDays(25));
        trip.setDestination(destination1);
        trip.setStatus("PLANNED");
        trip = tripRepository.save(trip);

        TripMember tm = new TripMember();
        tm.setTrip(trip);
        tm.setUser(member);
        tm.setRole(TripMemberRole.GROUP_ADMIN);
        tripMemberRepository.save(tm);

        // Member updates trip dates and destination
        TripRequest updateReq = new TripRequest();
        updateReq.setTitle("Kerala Backwaters");
        updateReq.setStartDate(LocalDate.now().plusDays(22));
        updateReq.setEndDate(LocalDate.now().plusDays(27));
        updateReq.setDestinationId(destination2.getId());

        tripService.update(trip.getId(), updateReq, member.getEmail());

        // Verify: Owner received TRAVEL_UPDATE notification
        var ownerNotifs = notificationService.getUserNotifications(owner.getEmail());
        assertThat(ownerNotifs).anyMatch(n ->
                n.getType().equals("TRAVEL_UPDATE") &&
                n.getTitle().contains("Travel Update: Kerala Backwaters") &&
                n.getMessage().contains("Member User") &&
                n.getMessage().contains("travel dates and destination")
        );

        // Verify: Modifier (member) did NOT receive a notification for their own update
        var memberNotifs = notificationService.getUserNotifications(member.getEmail());
        assertThat(memberNotifs).noneMatch(n ->
                n.getType().equals("TRAVEL_UPDATE") &&
                n.getTitle().contains("Travel Update: Kerala Backwaters")
        );
    }
}
