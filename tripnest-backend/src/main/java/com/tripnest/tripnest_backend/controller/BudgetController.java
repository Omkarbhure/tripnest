package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.BudgetRequest;
import com.tripnest.tripnest_backend.dto.BudgetResponse;
import com.tripnest.tripnest_backend.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips/{tripId}/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    // POST /api/trips/{tripId}/budget
    // Create a budget for a trip (one per trip)
    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @PathVariable Long tripId,
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {

        BudgetResponse response = budgetService.createBudget(
                tripId,
                request,
                authentication.getName()
        );

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    // PUT /api/trips/{tripId}/budget
    // Update an existing budget
    @PutMapping
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long tripId,
            @Valid @RequestBody BudgetRequest request,
            Authentication authentication) {

        BudgetResponse response = budgetService.updateBudget(
                tripId,
                request,
                authentication.getName()
        );

        return ResponseEntity.ok(response);
    }
    // GET /api/trips/{tripId}/budget
    // Retrieve the budget for a trip
    @GetMapping
    public ResponseEntity<BudgetResponse> getBudget(
            @PathVariable Long tripId,
            Authentication authentication) {

        BudgetResponse response = budgetService.getBudget(
                tripId,
                authentication.getName()
        );

        return ResponseEntity.ok(response);
    }
}
