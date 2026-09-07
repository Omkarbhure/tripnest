package com.tripnest.tripnest_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttractionRequest {

    @NotBlank(message = "Attraction name is required")
    private String name;

    private String shortDescription;

    private String imageUrl;

    private Double latitude;

    private Double longitude;
}
