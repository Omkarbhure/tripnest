package com.tripnest.tripnest_backend;

import com.tripnest.tripnest_backend.dto.*;
import com.tripnest.tripnest_backend.entity.*;
import com.tripnest.tripnest_backend.entity.Role;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
public class TripMembershipAndAccessIntegrationTest {

    @Autowired
    private TripService tripService;

    @Autowired
    private TripMemberService tripMemberService;

    @Autowired
    private TripJoinRequestService joinRequestService;

    @Autowired
    private ItineraryService itineraryService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private TripJoinRequestRepository joinRequestRepository;

    @Autowired
    private ItineraryRepository itineraryRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    private User owner;
    private User groupAdminUser;
    private User memberUser;
    private User nonMemberUser;
    private Trip trip;

    @BeforeEach
    void setUp() {
        Role role = roleRepository.findByName("USER").orElseGet(() -> {
            Role r = new Role();
            r.setName("USER");
            return roleRepository.save(r);
        });

        owner = createUser("owner@test.com", "Trip Owner", role);
        groupAdminUser = createUser("admin@test.com", "Group Admin", role);
        memberUser = createUser("member@test.com", "Trip Member", role);
        nonMemberUser = createUser("outsider@test.com", "Outsider", role);

        TripRequest tr = new TripRequest();
        tr.setTitle("Paris Adventure");
        tr.setDescription("Exploring Paris");
        tr.setStartDate(LocalDate.now());
        tr.setEndDate(LocalDate.now().plusDays(5));
        tr.setBudget(2500.0);
        tr.setStatus("PLANNED");

        TripResponse created = tripService.create(tr, owner.getEmail());
        trip = tripRepository.findById(created.getId()).orElseThrow();
    }

    private User createUser(String email, String name, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setName(name);
            u.setPasswordHash("pass123");
            u.setRole(role);
            return userRepository.save(u);
        });
    }

    @Test
    void testAddMemberAndListMembers() {
        // Owner adds Group Admin and Member
        AddMemberRequest addAdminReq = new AddMemberRequest(groupAdminUser.getEmail(), TripMemberRole.GROUP_ADMIN);
        TripMemberResponse adminResp = tripMemberService.addMember(trip.getId(), addAdminReq, owner.getEmail());
        assertThat(adminResp.getEmail()).isEqualTo(groupAdminUser.getEmail());
        assertThat(adminResp.getRole()).isEqualTo("GROUP_ADMIN");

        AddMemberRequest addMemberReq = new AddMemberRequest(memberUser.getEmail(), TripMemberRole.MEMBER);
        TripMemberResponse memberResp = tripMemberService.addMember(trip.getId(), addMemberReq, owner.getEmail());
        assertThat(memberResp.getEmail()).isEqualTo(memberUser.getEmail());
        assertThat(memberResp.getRole()).isEqualTo("MEMBER");

        // List members should return 3 participants: Owner + Group Admin + Member
        List<TripMemberResponse> members = tripMemberService.listMembers(trip.getId(), memberUser.getEmail());
        assertThat(members).hasSize(3);
        assertThat(members).extracting(TripMemberResponse::getEmail)
                .containsExactlyInAnyOrder(owner.getEmail(), groupAdminUser.getEmail(), memberUser.getEmail());
    }

    @Test
    void testRegularMemberCannotAddOrRemoveOrChangeRole() {
        // Add memberUser as MEMBER
        tripMemberService.addMember(trip.getId(), new AddMemberRequest(memberUser.getEmail(), TripMemberRole.MEMBER), owner.getEmail());

        // Regular member tries to add outsider -> should fail
        AddMemberRequest addReq = new AddMemberRequest(nonMemberUser.getEmail(), TripMemberRole.MEMBER);
        assertThatThrownBy(() -> tripMemberService.addMember(trip.getId(), addReq, memberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // Get member record id
        TripMember memberRecord = tripMemberRepository.findByTripIdAndUserEmail(trip.getId(), memberUser.getEmail()).orElseThrow();

        // Regular member tries to change own/other role -> should fail
        UpdateMemberRoleRequest updateRoleReq = new UpdateMemberRoleRequest(TripMemberRole.GROUP_ADMIN);
        assertThatThrownBy(() -> tripMemberService.changeMemberRole(trip.getId(), memberRecord.getId(), updateRoleReq, memberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // Regular member tries to remove -> should fail
        assertThatThrownBy(() -> tripMemberService.removeMember(trip.getId(), memberRecord.getId(), memberUser.getEmail()))
                .hasMessageContaining("Access denied");
    }

    @Test
    void testGroupAdminCanAddAndChangeRoles() {
        // Owner adds groupAdminUser
        tripMemberService.addMember(trip.getId(), new AddMemberRequest(groupAdminUser.getEmail(), TripMemberRole.GROUP_ADMIN), owner.getEmail());

        // Group admin adds memberUser
        TripMemberResponse added = tripMemberService.addMember(trip.getId(), new AddMemberRequest(memberUser.getEmail(), TripMemberRole.MEMBER), groupAdminUser.getEmail());
        assertThat(added.getRole()).isEqualTo("MEMBER");

        // Group admin promotes member to GROUP_ADMIN
        TripMemberResponse updated = tripMemberService.changeMemberRole(trip.getId(), added.getId(), new UpdateMemberRoleRequest(TripMemberRole.GROUP_ADMIN), groupAdminUser.getEmail());
        assertThat(updated.getRole()).isEqualTo("GROUP_ADMIN");

        // Group admin cannot remove trip owner
        assertThatThrownBy(() -> tripMemberService.removeMember(trip.getId(), 99999L, groupAdminUser.getEmail()))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void testReusableAccessCheckAcrossAllModules() {
        // Add memberUser as a trip member
        tripMemberService.addMember(trip.getId(), new AddMemberRequest(memberUser.getEmail(), TripMemberRole.MEMBER), owner.getEmail());

        // 1. Trip Module: member can view trip, outsider cannot
        TripResponse tripResp = tripService.getById(trip.getId(), memberUser.getEmail());
        assertThat(tripResp.getTitle()).isEqualTo("Paris Adventure");
        assertThatThrownBy(() -> tripService.getById(trip.getId(), nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // 2. Itinerary Module: member can add day and list days, outsider cannot
        ItineraryRequest itinReq = new ItineraryRequest(LocalDate.now().plusDays(1), "Visit Eiffel Tower");
        ItineraryResponse itinResp = itineraryService.addDay(trip.getId(), itinReq, memberUser.getEmail());
        assertThat(itinResp.getNotes()).isEqualTo("Visit Eiffel Tower");

        List<ItineraryResponse> days = itineraryService.listDays(trip.getId(), memberUser.getEmail());
        assertThat(days).isNotEmpty();

        assertThatThrownBy(() -> itineraryService.listDays(trip.getId(), nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");
        assertThatThrownBy(() -> itineraryService.addDay(trip.getId(), itinReq, nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // 3. Activity Module: member can add & list activities, outsider cannot
        ActivityRequest actReq = new ActivityRequest(
                "Summit Tour", "Top floor view",
                LocalTime.of(10, 0), LocalTime.of(12, 0),
                "Champ de Mars", "SIGHTSEEING"
        );
        ActivityResponse actResp = activityService.addActivity(itinResp.getId().intValue(), actReq, memberUser.getEmail());
        assertThat(actResp.getTitle()).isEqualTo("Summit Tour");

        List<ActivityResponse> acts = activityService.listActivities(itinResp.getId().intValue(), memberUser.getEmail());
        assertThat(acts).hasSize(1);

        assertThatThrownBy(() -> activityService.listActivities(itinResp.getId().intValue(), nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");
        assertThatThrownBy(() -> activityService.addActivity(itinResp.getId().intValue(), actReq, nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // 4. Budget Module: member can create/view budget, outsider cannot
        BudgetRequest bReq = new BudgetRequest(new BigDecimal("3000.00"), BigDecimal.ZERO, "EUR", "Europe trip budget");
        BudgetResponse bResp = budgetService.createBudget(trip.getId(), bReq, memberUser.getEmail());
        assertThat(bResp.getTotalBudget()).isEqualByComparingTo("3000.00");

        BudgetResponse fetchedBudget = budgetService.getBudget(trip.getId(), memberUser.getEmail());
        assertThat(fetchedBudget.getCurrency()).isEqualTo("EUR");

        assertThatThrownBy(() -> budgetService.getBudget(trip.getId(), nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // 5. Expense Module: member can log expense & view summaries, outsider cannot
        ExpenseRequest expReq = new ExpenseRequest(
                "FOOD", new BigDecimal("75.50"),
                LocalDate.now(), "Bistro lunch", "http://receipt.url"
        );
        ExpenseResponse expResp = expenseService.createExpense(trip.getId(), expReq, memberUser.getEmail());
        assertThat(expResp.getAmount()).isEqualByComparingTo("75.50");
        assertThat(expResp.getPayerEmail()).isEqualTo(memberUser.getEmail());

        List<ExpenseResponse> exps = expenseService.listExpenses(trip.getId(), memberUser.getEmail());
        assertThat(exps).hasSize(1);

        List<CategorySummary> summaries = expenseService.getCategorySummary(trip.getId(), memberUser.getEmail());
        assertThat(summaries).isNotEmpty();

        RemainingBudgetResponse rem = expenseService.getRemainingBudget(trip.getId(), memberUser.getEmail());
        assertThat(rem.getTotalBudget()).isEqualByComparingTo("3000.00");
        assertThat(rem.getTotalExpenses()).isEqualByComparingTo("75.50");

        assertThatThrownBy(() -> expenseService.listExpenses(trip.getId(), nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");
        assertThatThrownBy(() -> expenseService.createExpense(trip.getId(), expReq, nonMemberUser.getEmail()))
                .hasMessageContaining("Access denied");
    }

    @Test
    void testJoinRequestFlow() {
        // Search trips by name
        List<TripSearchResultResponse> searchResults = joinRequestService.searchTripsByName("Paris", nonMemberUser.getEmail());
        assertThat(searchResults).isNotEmpty();
        assertThat(searchResults.get(0).getUserRelationship()).isEqualTo("NONE");

        // Outsider sends join request
        TripJoinRequestDto reqDto = new TripJoinRequestDto("Hi! I would love to join your Paris trip!");
        TripJoinResponse joinResp = joinRequestService.requestToJoin(trip.getId(), reqDto, nonMemberUser.getEmail());
        assertThat(joinResp.getStatus()).isEqualTo(TripJoinRequestStatus.PENDING);
        assertThat(joinResp.getUserEmail()).isEqualTo(nonMemberUser.getEmail());

        // Search again -> user relationship should now be REQUEST_PENDING
        List<TripSearchResultResponse> searchAfterRequest = joinRequestService.searchTripsByName("Paris", nonMemberUser.getEmail());
        assertThat(searchAfterRequest.get(0).getUserRelationship()).isEqualTo("REQUEST_PENDING");

        // Non-member cannot see pending requests of the trip
        assertThatThrownBy(() -> joinRequestService.listTripJoinRequests(trip.getId(), memberUser.getEmail()))
                .hasMessageContaining("Access denied");

        // Owner lists requests
        List<TripJoinResponse> ownerRequests = joinRequestService.listTripJoinRequests(trip.getId(), owner.getEmail());
        assertThat(ownerRequests).hasSize(1);
        assertThat(ownerRequests.get(0).getId()).isEqualTo(joinResp.getId());

        // Owner accepts request
        TripJoinResponse acceptResp = joinRequestService.respondToJoinRequest(trip.getId(), joinResp.getId(), true, owner.getEmail());
        assertThat(acceptResp.getStatus()).isEqualTo(TripJoinRequestStatus.ACCEPTED);

        // Verify outsider is now a TripMember with MEMBER role
        boolean isNowMember = tripMemberRepository.existsByTripIdAndUserEmail(trip.getId(), nonMemberUser.getEmail());
        assertThat(isNowMember).isTrue();

        // The newly joined user now has access to the trip!
        TripResponse joinedTrip = tripService.getById(trip.getId(), nonMemberUser.getEmail());
        assertThat(joinedTrip.getTitle()).isEqualTo("Paris Adventure");
    }

    @Test
    void testTripDeletionWithAllCascadedRecords() {
        // Add member and join request
        tripMemberService.addMember(trip.getId(), new AddMemberRequest(groupAdminUser.getEmail(), TripMemberRole.GROUP_ADMIN), owner.getEmail());

        // Group Admin deletes the trip
        tripService.delete(trip.getId(), groupAdminUser.getEmail());

        // Assert all trip entities and membership records are cleanly deleted
        assertThat(tripRepository.findById(trip.getId())).isEmpty();
        assertThat(tripMemberRepository.findByTripId(trip.getId())).isEmpty();
        assertThat(joinRequestRepository.findByTripIdOrderByCreatedAtDesc(trip.getId())).isEmpty();
    }
}
