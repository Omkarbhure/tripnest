package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.DestinationResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final RestTemplate restTemplate;
    // OPENWEATHER CONFIGURATION

    @Value("${openweather.api.key}")
    private String weatherApiKey;

    @Value("${openweather.api.url}")
    private String weatherApiUrl;
    // OPENSTREETMAP / NOMINATIM

    @Value("${nominatim.api.url}")
    private String nominatimApiUrl;
public List<DestinationResponse> listAll() {

        return destinationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }
public DestinationResponse getById(Integer id) {

        Destination destination =
                destinationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Destination not found with id: " + id
                                )
                        );

        return toResponse(destination);
    }
public List<DestinationResponse> getPopular() {

        return destinationRepository.findAll()
                .stream()
                .limit(5)
                .map(this::toResponse)
                .toList();
    }
@SuppressWarnings("unchecked")
    public Map<String, Object> getWeather(Integer id) {

        Destination destination =
                destinationRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Destination not found with id: " + id
                                )
                        );

        /*
         * Use latitude and longitude stored with the destination.
         * This is more reliable than searching by city name,
         * especially for smaller places such as Dwaraka Tirumala.
         */

        if (destination.getLatitude() == null
                || destination.getLongitude() == null) {

            throw new RuntimeException(
                    "Weather coordinates are not available for: "
                            + destination.getName()
            );
        }

        String url = UriComponentsBuilder
                .fromUriString(weatherApiUrl)
                .queryParam("lat", destination.getLatitude())
                .queryParam("lon", destination.getLongitude())
                .queryParam("appid", weatherApiKey)
                .queryParam("units", "metric")
                .toUriString();

        try {

            return restTemplate.getForObject(
                    url,
                    Map.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Could not fetch weather for: "
                            + destination.getName()
                            + ". "
                            + e.getMessage()
            );
        }
    }
// SEARCH RESULT

    @SuppressWarnings("unchecked")
    public Map<String, Object> getWeatherByCoordinates(
            double lat,
            double lon
    ) {

        String url = UriComponentsBuilder
                .fromUriString(weatherApiUrl)
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("appid", weatherApiKey)
                .queryParam("units", "metric")
                .toUriString();

        try {

            return restTemplate.getForObject(
                    url,
                    Map.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Could not fetch weather for coordinates: "
                            + lat
                            + ", "
                            + lon
                            + ". "
                            + e.getMessage()
            );
        }
    }
    // OPENSTREETMAP / NOMINATIM SEARCH

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchDestinations(
            String query
    ) {

        String url = UriComponentsBuilder
                .fromUriString(nominatimApiUrl)
                .queryParam("q", query)
                .queryParam("format", "json")
                .queryParam("limit", 5)
                .queryParam("addressdetails", 1)
                .toUriString();

        try {

            HttpHeaders headers = new HttpHeaders();

            // Required by Nominatim
            headers.set(
                    "User-Agent",
                    "TripNest Student Project"
            );

            HttpEntity<Void> entity =
                    new HttpEntity<>(headers);

            ResponseEntity<List> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            entity,
                            List.class
                    );

            return response.getBody();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Could not search destinations: "
                            + e.getMessage()
            );
        }
    }
    // SAVE DESTINATION FROM SEARCH

    public DestinationResponse saveFromSearch(
            Map<String, Object> data
    ) {

        String name =
                (String) data.get("name");

        String city =
                (String) data.get("city");

        String country =
                (String) data.get("country");

        String description =
                (String) data.get("description");

        String imageUrl =
                (String) data.get("imageUrl");


        // Get coordinates from the frontend
        // OpenStreetMap search result
        Double latitude = null;
        Double longitude = null;

        Object latitudeValue = data.get("latitude");
        Object longitudeValue = data.get("longitude");

        if (latitudeValue instanceof Number) {
            latitude = ((Number) latitudeValue).doubleValue();
        }

        if (longitudeValue instanceof Number) {
            longitude = ((Number) longitudeValue).doubleValue();
        }


        Destination destination =
                new Destination();

        destination.setName(name);
        destination.setCity(city);
        destination.setCountry(country);
        destination.setDescription(description);
        destination.setImageUrl(imageUrl);

        // Save geographic coordinates
        destination.setLatitude(latitude);
        destination.setLongitude(longitude);


        Destination saved =
                destinationRepository.save(destination);

        return toResponse(saved);
    }
    // ENTITY → RESPONSE DTO

    private DestinationResponse toResponse(
            Destination d
    ) {

        return new DestinationResponse(
                d.getId(),
                d.getName(),
                d.getCountry(),
                d.getCity(),
                d.getDescription(),
                d.getImageUrl(),
                d.getLatitude(),
                d.getLongitude()
        );
    }
}