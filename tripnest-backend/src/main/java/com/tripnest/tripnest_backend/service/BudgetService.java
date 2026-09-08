package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.BudgetRequest;
import com.tripnest.tripnest_backend.dto.BudgetResponse;
import com.tripnest.tripnest_backend.entity.Budget;
import com.tripnest.tripnest_backend.entity.Trip;
import com.tripnest.tripnest_backend.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TripAccessService tripAccessService;
    // CREATE — POST /api/trips/{tripId}/budget
    @Transactional
    public BudgetResponse createBudget(Long tripId, BudgetRequest request, String email) {

        Trip trip = tripAccessService.checkTripAccess(tripId, email);

        // Business rule: each trip can only have one budget record
        if (budgetRepository.existsByTripId(tripId)) {
            throw new IllegalStateException(
                    "A budget already exists for trip #" + tripId
                    + ". Use PUT to update it."
            );
        }

        // Validation: spentAmount must not exceed totalBudget on creation
        BigDecimal spent = request.getSpentAmount() != null
                ? request.getSpentAmount()
                : BigDecimal.ZERO;

        if (spent.compareTo(request.getTotalBudget()) > 0) {
            throw new IllegalArgumentException(
                    "Spent amount (" + spent + ") cannot exceed total budget ("
                    + request.getTotalBudget() + ") on creation."
            );
        }

        Budget budget = new Budget();
        budget.setTrip(trip);
        budget.setTotalBudget(request.getTotalBudget());
        budget.setSpentAmount(spent);
        budget.setCurrency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "INR");
        budget.setNotes(request.getNotes());

        return toResponse(budgetRepository.save(budget));
    }
    // UPDATE — PUT /api/trips/{tripId}/budget
    @Transactional
    public BudgetResponse updateBudget(Long tripId, BudgetRequest request, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException(
                        "No budget found for trip #" + tripId
                        + ". Use POST to create one first."
                ));

        BigDecimal spent = request.getSpentAmount() != null
                ? request.getSpentAmount()
                : budget.getSpentAmount();

        if (spent.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Spent amount cannot be negative.");
        }

        budget.setTotalBudget(request.getTotalBudget());
        budget.setSpentAmount(spent);
        if (request.getCurrency() != null) {
            budget.setCurrency(request.getCurrency().toUpperCase());
        }
        if (request.getNotes() != null) {
            budget.setNotes(request.getNotes());
        }

        return toResponse(budgetRepository.save(budget));
    }
    // GET — GET /api/trips/{tripId}/budget
    @Transactional(readOnly = true)
    public BudgetResponse getBudget(Long tripId, String email) {

        tripAccessService.checkTripAccess(tripId, email);

        Budget budget = budgetRepository.findByTripId(tripId)
                .orElseThrow(() -> new RuntimeException(
                        "No budget found for trip #" + tripId
                ));

        return toResponse(budget);
    }


    private BudgetResponse toResponse(Budget b) {

        return new BudgetResponse(
                b.getId(),
                b.getTrip().getId(),
                b.getTrip().getTitle(),
                b.getTotalBudget(),
                b.getSpentAmount(),
                b.getRemainingBudget(),
                b.isOverBudget(),
                b.getCurrency(),
                b.getNotes(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
