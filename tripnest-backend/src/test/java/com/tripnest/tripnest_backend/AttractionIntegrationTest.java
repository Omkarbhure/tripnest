package com.tripnest.tripnest_backend;

import com.tripnest.tripnest_backend.dto.AttractionRequest;
import com.tripnest.tripnest_backend.dto.AttractionResponse;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.AttractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
public class AttractionIntegrationTest {

    @Autowired
    private AttractionService attractionService;

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private Destination destination;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ADMINISTRATOR")
                .orElseGet(() -> roleRepository.save(new Role(null, "ADMINISTRATOR")));

        Role travelerRole = roleRepository.findByName("TRAVELER")
                .orElseGet(() -> roleRepository.save(new Role(null, "TRAVELER")));

        userRepository.findByEmail("admin_attr@test.com").orElseGet(() -> {
            User u = new User();
            u.setName("Admin User");
            u.setEmail("admin_attr@test.com");
            u.setPasswordHash("password");
            u.setRole(adminRole);
            return userRepository.save(u);
        });

        userRepository.findByEmail("traveler_attr@test.com").orElseGet(() -> {
            User u = new User();
            u.setName("Traveler User");
            u.setEmail("traveler_attr@test.com");
            u.setPasswordHash("password");
            u.setRole(travelerRole);
            return userRepository.save(u);
        });

        destination = destinationRepository.findFirstByNameOrderByIdAsc("Goa").orElseGet(() -> {
            Destination d = new Destination(null, "Goa", "India", "Panaji", "Beach paradise", null);
            return destinationRepository.save(d);
        });
    }

    @Test
    void testCreateAndListAttractions() {
        AttractionRequest req1 = new AttractionRequest(
                "Calangute Beach",
                "Famous bustling beach with water sports and shacks",
                "https://example.com/calangute.jpg",
                15.5439,
                73.7554
        );
        AttractionResponse created1 = attractionService.createAttraction(destination.getId(), req1);

        assertThat(created1.getId()).isNotNull();
        assertThat(created1.getName()).isEqualTo("Calangute Beach");
        assertThat(created1.getDestinationId()).isEqualTo(destination.getId());
        assertThat(created1.getDestinationName()).isEqualTo("Goa");

        AttractionRequest req2 = new AttractionRequest(
                "Aguada Fort",
                "17th-century Portuguese fort and lighthouse overlooking the Arabian Sea",
                "https://example.com/aguada.jpg",
                15.4925,
                73.7738
        );
        attractionService.createAttraction(destination.getId(), req2);

        List<AttractionResponse> attractions = attractionService.getAttractionsByDestination(destination.getId());
        assertThat(attractions).hasSizeGreaterThanOrEqualTo(2);
        assertThat(attractions).extracting(AttractionResponse::getName)
                .contains("Aguada Fort", "Calangute Beach");
    }
}
