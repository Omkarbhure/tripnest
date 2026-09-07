package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.entity.Attraction;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttractionService {

    private final AttractionRepository attractionRepository;
    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public List<AttractionResponse> getAttractionsByDestination(Integer destinationId) {
        // Ensure destination exists
        destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + destinationId));

        return attractionRepository.findByDestinationIdOrderByNameAsc(destinationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AttractionResponse createAttraction(Integer destinationId, AttractionRequest request) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found with id: " + destinationId));

        Attraction attraction = new Attraction();
        attraction.setDestination(destination);
        attraction.setName(request.getName().trim());
        attraction.setShortDescription(request.getShortDescription());
        attraction.setImageUrl(request.getImageUrl());
        attraction.setLatitude(request.getLatitude());
        attraction.setLongitude(request.getLongitude());

        Attraction saved = attractionRepository.save(attraction);
        return toResponse(saved);
    }

    private AttractionResponse toResponse(Attraction a) {
        return new AttractionResponse(
                a.getId(),
                a.getDestination() != null ? a.getDestination().getId() : null,
                a.getDestination() != null ? a.getDestination().getName() : null,
                a.getName(),
                a.getShortDescription(),
                a.getImageUrl(),
                a.getLatitude(),
                a.getLongitude(),
                a.getCreatedAt()
        );
    }
}
