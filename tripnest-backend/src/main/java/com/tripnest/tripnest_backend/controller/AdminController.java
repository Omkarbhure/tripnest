package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.*;
import com.tripnest.tripnest_backend.service.AdminService;
import com.tripnest.tripnest_backend.service.AttractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {

    private final AdminService adminService;
    private final AttractionService attractionService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse adminDashboard() {
        return adminService.getAdminDashboard();
    }

    @GetMapping("/dashboard/analytics")
    public AdminDashboardResponse getAdminDashboardAnalytics() {
        return adminService.getAdminDashboard();
    }

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getAdminStats();
    }

    @GetMapping("/users")
    public List<UserSummaryResponse> listUsers() {
        return adminService.listUsers();
    }

    @PutMapping("/users/{id}/role")
    public UserSummaryResponse updateUserRole(@PathVariable Integer id, @Valid @RequestBody UpdateRoleRequest request) {
        return adminService.updateUserRole(id, request.getRoleName());
    }

    @PostMapping("/destinations/{destinationId}/attractions")
    @ResponseStatus(HttpStatus.CREATED)
    public AttractionResponse createAttraction(
            @PathVariable Integer destinationId,
            @Valid @RequestBody AttractionRequest request
    ) {
        return attractionService.createAttraction(destinationId, request);
    }
}