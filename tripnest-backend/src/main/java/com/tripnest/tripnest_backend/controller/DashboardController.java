package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.TravelerDashboardResponse;
import com.tripnest.tripnest_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public TravelerDashboardResponse getTravelerDashboard(Authentication authentication) {
        return dashboardService.getTravelerDashboard(authentication.getName());
    }

    @GetMapping("/traveler")
    public TravelerDashboardResponse getTravelerDashboardExplicit(Authentication authentication) {
        return dashboardService.getTravelerDashboard(authentication.getName());
    }
}
