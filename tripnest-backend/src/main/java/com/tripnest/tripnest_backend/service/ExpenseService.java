package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.*;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Expense;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.entity.TripMember;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "TRANSPORTATION", "HOTEL", "FOOD", "SHOPPING", "ENTERTAINMENT", "MISCELLANEOUS"
    );

    private final ExpenseRepository expenseRepository;
    private final UserRepository    userRepository;
    private final BudgetRepository  budgetRepository;
    private final TripMemberRepository tripMemberRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final TripAccessService tripAccessService;

    // ============================================================
    // CREATE  POST /api/trips/{tripId}/expenses
    // ============================================================
    @Transactional
    public ExpenseResponse createExpense(Long tripId, ExpenseRequest req, String payerEmail) {

        Trip trip = tripAccessService.checkTripAccess(tripId, payerEmail);
        User payer = findUser(payerEmail);

        validateCategory(req.getCategory());
        validateAmount(req.getAmount());

        BigDecimal spentBefore = expenseRepository.sumAmountByTripId(tripId);
        if (spentBefore == null) {
            spentBefore = BigDecimal.ZERO;
        }

        Expense expense = new Expense();
        expense.setTrip(trip);
        expense.setPayer(payer);
        expense.setCategory(req.getCategory().toUpperCase());
        expense.setAmount(req.getAmount());
        expense.setExpenseDate(req.getExpenseDate());
        expense.setDescription(req.getDescription());
        expense.setReceiptUrl(req.getReceiptUrl());

        // Link to budget if one exists for this trip
        budgetRepository.findByTripId(tripId).ifPresent(expense::setBudget);

        Expense saved = expenseRepository.save(expense);
        BigDecimal spentAfter = spentBefore.add(saved.getAmount());

        checkAndTriggerBudgetAlerts(trip, spentBefore, spentAfter);

        return toResponse(saved);
    }


    // ============================================================
    // LIST  GET /api/trips/{tripId}/expenses
    // ============================================================
    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(Long tripId, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        return expenseRepository.findByTripIdOrderByExpenseDateDesc(tripId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ============================================================
    // UPDATE  PUT /api/trips/{tripId}/expenses/{expenseId}
    // ============================================================
    @Transactional
    public ExpenseResponse updateExpense(Long tripId, Long expenseId, ExpenseRequest req, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        Expense expense = findExpenseBelongingToTrip(expenseId, tripId);

        // Allow update if caller is the payer OR Group Admin / Trip Owner
        boolean isPayer = expense.getPayer().getEmail().equalsIgnoreCase(email);
        boolean isAdmin = tripAccessService.isGroupAdminOrOwner(tripId, email);

        if (!isPayer && !isAdmin) {
            throw new RuntimeException("Access denied: You can only edit your own expenses unless you are a Group Admin or Owner.");
        }

        validateCategory(req.getCategory());
        validateAmount(req.getAmount());

        BigDecimal oldAmount = expense.getAmount();
        BigDecimal currentTotal = expenseRepository.sumAmountByTripId(tripId);
        if (currentTotal == null) {
            currentTotal = BigDecimal.ZERO;
        }
        BigDecimal spentBefore = currentTotal.subtract(oldAmount);
        if (spentBefore.compareTo(BigDecimal.ZERO) < 0) {
            spentBefore = BigDecimal.ZERO;
        }

        expense.setCategory(req.getCategory().toUpperCase());
        expense.setAmount(req.getAmount());
        expense.setExpenseDate(req.getExpenseDate());
        expense.setDescription(req.getDescription());
        expense.setReceiptUrl(req.getReceiptUrl());

        Expense saved = expenseRepository.save(expense);
        BigDecimal spentAfter = spentBefore.add(saved.getAmount());

        checkAndTriggerBudgetAlerts(expense.getTrip(), spentBefore, spentAfter);

        return toResponse(saved);
    }

    // ============================================================
    // DELETE  DELETE /api/trips/{tripId}/expenses/{expenseId}
    // ============================================================
    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        Expense expense = findExpenseBelongingToTrip(expenseId, tripId);

        boolean isPayer = expense.getPayer().getEmail().equalsIgnoreCase(email);
        boolean isAdmin = tripAccessService.isGroupAdminOrOwner(tripId, email);

        if (!isPayer && !isAdmin) {
            throw new RuntimeException("Access denied: You can only delete your own expenses unless you are a Group Admin or Owner.");
        }

        expenseRepository.delete(expense);
    }

    // ============================================================
    // CATEGORY SUMMARY  GET /api/trips/{tripId}/expenses/summary
    // ============================================================
    @Transactional(readOnly = true)
    public List<CategorySummary> getCategorySummary(Long tripId, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        return expenseRepository.sumByCategory(tripId)
                .stream()
                .map(row -> new CategorySummary(
                        (String) row[0],
                        (BigDecimal) row[1]
                ))
                .toList();
    }

    // ============================================================
    // REMAINING BUDGET  GET /api/trips/{tripId}/expenses/remaining
    // ============================================================
    @Transactional(readOnly = true)
    public RemainingBudgetResponse getRemainingBudget(Long tripId, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException(
                        "No budget set for trip #" + tripId + ". Create a budget first."
                ));

        BigDecimal totalExpenses = expenseRepository.sumAmountByTripId(tripId);
        BigDecimal remaining     = budget.getTotalBudget().subtract(totalExpenses);

        return new RemainingBudgetResponse(
                tripId,
                budget.getTotalBudget(),
                totalExpenses,
                remaining,
                budget.getCurrency(),
                totalExpenses.compareTo(budget.getTotalBudget()) > 0
        );
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private void checkAndTriggerBudgetAlerts(Trip trip, BigDecimal spentBefore, BigDecimal spentAfter) {
        if (trip == null) {
            return;
        }

        budgetRepository.findByTripId(trip.getId()).ifPresent(budget -> {
            BigDecimal totalBudget = budget.getTotalBudget();
            if (totalBudget == null || totalBudget.compareTo(BigDecimal.ZERO) <= 0) {
                return;
            }

            BigDecimal threshold80 = totalBudget.multiply(new BigDecimal("0.80"));
            BigDecimal threshold100 = totalBudget;
            String currency = budget.getCurrency() != null ? budget.getCurrency() : "INR";

            // Check 80% threshold crossing
            if (spentBefore.compareTo(threshold80) < 0 && spentAfter.compareTo(threshold80) >= 0) {
                sendBudgetAlert(trip, "80%", "80% of its budget (Spent: " + currency + " " + spentAfter + " of " + currency + " " + totalBudget + ")");
            }

            // Check 100% threshold crossing
            if (spentBefore.compareTo(threshold100) < 0 && spentAfter.compareTo(threshold100) >= 0) {
                sendBudgetAlert(trip, "100%", "100% of its budget (Spent: " + currency + " " + spentAfter + " of " + currency + " " + totalBudget + ")");
            }
        });
    }

    private void sendBudgetAlert(Trip trip, String thresholdTag, String detailMsg) {
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

        String title = "Budget Alert: " + thresholdTag + " Reached for " + trip.getTitle();
        String message = "Trip \"" + trip.getTitle() + "\" has reached " + detailMsg + ".";

        for (User recipient : recipients) {
            boolean alreadySent = notificationRepository.existsByUserIdAndTypeAndRelatedTripIdAndMessageContaining(
                    recipient.getId(),
                    "BUDGET_ALERT",
                    trip.getId(),
                    thresholdTag
            );

            if (!alreadySent) {
                notificationService.createNotification(
                        recipient,
                        title,
                        message,
                        "BUDGET_ALERT",
                        trip.getId()
                );
            }
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Expense findExpenseBelongingToTrip(Long expenseId, Long tripId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found: " + expenseId));
        if (!expense.getTrip().getId().equals(tripId)) {
            throw new RuntimeException("Expense does not belong to trip #" + tripId);
        }
        return expense;
    }

    private void validateCategory(String category) {
        if (category == null || !VALID_CATEGORIES.contains(category.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid category '" + category + "'. Must be one of: " + VALID_CATEGORIES
            );
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero.");
        }
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getId(),
                e.getTrip().getId(),
                e.getCategory(),
                e.getAmount(),
                e.getExpenseDate(),
                e.getDescription(),
                e.getReceiptUrl(),
                e.getPayer().getName(),
                e.getPayer().getEmail(),
                e.getCreatedAt()
        );
    }
}

