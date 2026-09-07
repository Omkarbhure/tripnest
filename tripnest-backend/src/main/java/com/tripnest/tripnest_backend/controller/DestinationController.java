package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.dto.DestinationResponse;
import com.tripnest.tripnest_backend.service.AttractionService;
import com.tripnest.tripnest_backend.service.DestinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;
    private final AttractionService attractionService;

    @GetMapping
    public List<DestinationResponse> listAll() {
        return destinationService.listAll();
    }

    @GetMapping("/popular")
    public List<DestinationResponse> getPopular() {
        return destinationService.getPopular();
    }

    @GetMapping("/search")
    public List<Map<String, Object>> searchDestinations(
            @RequestParam String query
    ) {
        return destinationService.searchDestinations(query);
    }

    @PostMapping("/from-search")
    public DestinationResponse saveFromSearch(
            @RequestBody Map<String, Object> data
    ) {
        return destinationService.saveFromSearch(data);
    }

    @GetMapping("/weather")
    public Map<String, Object> getWeatherByCoordinates(
            @RequestParam double lat,
            @RequestParam double lon
    ) {
        return destinationService.getWeatherByCoordinates(lat, lon);
    }

    @GetMapping("/{id}")
    public DestinationResponse getById(
            @PathVariable Integer id
    ) {
        return destinationService.getById(id);
    }

    @GetMapping("/{id}/weather")
    public Map<String, Object> getWeather(
            @PathVariable Integer id
    ) {
        return destinationService.getWeather(id);
    }

    @GetMapping("/{id}/attractions")
    public List<AttractionResponse> getAttractions(
            @PathVariable Integer id
    ) {
        return attractionService.getAttractionsByDestination(id);
    }

    @PostMapping("/{id}/attractions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public AttractionResponse createAttraction(
            @PathVariable Integer id,
            @Valid @RequestBody AttractionRequest request
    ) {
        return attractionService.createAttraction(id, request);
    }
}