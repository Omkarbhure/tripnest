package com.tripnest.tripnest_backend.config;

import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DestinationRepository destinationRepository;

    private static final List<String> DEFAULT_ROLES = List.of("TRAVELER", "GROUP_ADMIN", "ADMINISTRATOR");
    private static final String DEFAULT_ADMIN_EMAIL = "admin@tripnest.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    @Override
    public void run(String... args) {
        try {
            // ── Seed roles ──────────────────────────────────────────
            DEFAULT_ROLES.forEach(roleName -> {
                if (roleRepository.findByName(roleName).isEmpty()) {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                }
            });

        // ── Seed admin user (runs only once) ────────────────────
        if (!userRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            Role adminRole = roleRepository.findByName("ADMINISTRATOR")
                    .orElseThrow(() -> new RuntimeException("ADMINISTRATOR role missing after seeding"));
            User admin = new User();
            admin.setName("Default Administrator");
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            admin.setRole(adminRole);
            admin.setOauthGoogle(false);
            userRepository.save(admin);
        }

        // ── Seed/update curated destinations ────────────────────
        List<Destination> destinations = List.of(
                new Destination(null, "Goa", "India", "Panaji",
                    "India's beach paradise famous for its golden sandy shores, vibrant nightlife, Portuguese heritage, water sports, and laid-back Konkani culture.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Baga_beach_Goa.jpg/1280px-Baga_beach_Goa.jpg"),

                new Destination(null, "Manali", "India", "Manali",
                    "A stunning Himalayan hill station known for snow-capped peaks, adventure sports, Rohtang Pass, Solang Valley, and the ancient Hadimba Temple.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Manali_-_panoramio.jpg/1280px-Manali_-_panoramio.jpg"),

                new Destination(null, "Jaipur", "India", "Jaipur",
                    "The Pink City of Rajasthan, home to the majestic Amber Fort, Hawa Mahal, City Palace, and vibrant bazaars overflowing with gems and textiles.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Hawa_Mahal_Jaipur.jpg/1024px-Hawa_Mahal_Jaipur.jpg"),

                new Destination(null, "Kerala Backwaters", "India", "Alleppey",
                    "A tranquil network of lagoons, lakes, and canals lined with coconut palms. Explore on traditional houseboats and experience authentic Kerala village life.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Kerala_backwaters.jpg/1280px-Kerala_backwaters.jpg"),

                new Destination(null, "Varanasi", "India", "Varanasi",
                    "One of the world's oldest cities, situated on the sacred Ganges River. Famous for its ghats, morning aarti ceremonies, temples, and spiritual significance.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Ghats_in_Varanasi_2013.jpg/1280px-Ghats_in_Varanasi_2013.jpg"),

                new Destination(null, "Agra", "India", "Agra",
                    "Home to the iconic Taj Mahal, one of the Seven Wonders of the World. Also features the magnificent Agra Fort and Fatehpur Sikri.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg"),

                new Destination(null, "Darjeeling", "India", "Darjeeling",
                    "A charming hill station in West Bengal famous for its tea gardens, the Toy Train UNESCO heritage railway, Tiger Hill sunrise views, and Himalayan panoramas.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Darjeeling_-_Tea_Garden.jpg/1280px-Darjeeling_-_Tea_Garden.jpg"),

                new Destination(null, "Udaipur", "India", "Udaipur",
                    "The City of Lakes in Rajasthan, known for its romantic lake palaces, City Palace complex, Pichola Lake boat rides, and rich Mewar royal heritage.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Lake_Palace_Udaipur.jpg/1280px-Lake_Palace_Udaipur.jpg"),

                new Destination(null, "Andaman Islands", "India", "Port Blair",
                    "A pristine archipelago in the Bay of Bengal with crystal-clear turquoise waters, coral reefs, Radhanagar Beach, and the historic Cellular Jail.",
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Radhanagar_Beach_Andaman.jpg/1280px-Radhanagar_Beach_Andaman.jpg"),

                new Destination(null, "Leh Ladakh", "India", "Leh",
                    "A remote high-altitude desert region with dramatic landscapes, ancient Buddhist monasteries, Pangong Lake, Nubra Valley, and thrilling mountain passes.",
                    "https://images.unsplash.com/photo-1626014303757-63616a3c5b55?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Paris", "France", "Paris",
                    "The City of Light blends iconic landmarks, celebrated art museums, elegant cafés, and timeless streets along the Seine.",
                    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Kyoto", "Japan", "Kyoto",
                    "Japan's cultural heart, known for serene temples, bamboo groves, traditional tea houses, and seasonal cherry blossoms.",
                    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "New York City", "United States", "New York",
                    "A fast-paced city of world-class museums, Broadway, landmark architecture, diverse neighborhoods, and unforgettable skyline views.",
                    "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Dubai", "United Arab Emirates", "Dubai",
                    "A modern desert metropolis where landmark towers, golden dunes, waterfront dining, and traditional souks meet.",
                    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "London", "United Kingdom", "London",
                    "A historic and cosmopolitan capital with royal landmarks, vibrant markets, acclaimed theatre, and museums for every interest.",
                    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Rome", "Italy", "Rome",
                    "An open-air museum of ancient ruins, lively piazzas, remarkable cuisine, and centuries of art and architecture.",
                    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Bali", "Indonesia", "Denpasar",
                    "A tropical escape celebrated for lush rice terraces, Hindu temples, surf beaches, wellness retreats, and warm hospitality.",
                    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85"),

                new Destination(null, "Machu Picchu", "Peru", "Cusco",
                    "A breathtaking Incan citadel high in the Andes, surrounded by dramatic mountain landscapes and rich archaeological heritage.",
                    "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=85")
        );

        destinations.forEach(template -> destinationRepository.findFirstByNameOrderByIdAsc(template.getName())
                .ifPresentOrElse(existing -> {
                    existing.setCountry(template.getCountry());
                    existing.setCity(template.getCity());
                    existing.setDescription(template.getDescription());
                    existing.setImageUrl(template.getImageUrl());
                    destinationRepository.save(existing);
                }, () -> destinationRepository.save(template)));

        Map<String, double[]> coordinates = Map.ofEntries(
                Map.entry("Goa", new double[] { 15.4909, 73.8278 }),
                Map.entry("Manali", new double[] { 32.2432, 77.1892 }),
                Map.entry("Jaipur", new double[] { 26.9124, 75.7873 }),
                Map.entry("Kerala Backwaters", new double[] { 9.4981, 76.3388 }),
                Map.entry("Varanasi", new double[] { 25.3176, 82.9739 }),
                Map.entry("Agra", new double[] { 27.1767, 78.0081 }),
                Map.entry("Darjeeling", new double[] { 27.0410, 88.2663 }),
                Map.entry("Udaipur", new double[] { 24.5854, 73.7125 }),
                Map.entry("Andaman Islands", new double[] { 11.6234, 92.7265 }),
                Map.entry("Leh Ladakh", new double[] { 34.1526, 77.5771 }),
                Map.entry("Paris", new double[] { 48.8566, 2.3522 }),
                Map.entry("Kyoto", new double[] { 35.0116, 135.7681 }),
                Map.entry("New York City", new double[] { 40.7128, -74.0060 }),
                Map.entry("Dubai", new double[] { 25.2048, 55.2708 }),
                Map.entry("London", new double[] { 51.5072, -0.1276 }),
                Map.entry("Rome", new double[] { 41.9028, 12.4964 }),
                Map.entry("Bali", new double[] { -8.6500, 115.2167 }),
                Map.entry("Machu Picchu", new double[] { -13.1631, -72.5450 })
        );

            destinationRepository.findAll().forEach(destination -> {
                double[] location = coordinates.get(destination.getName());
                if (location != null && (destination.getLatitude() == null || destination.getLongitude() == null)) {
                    destination.setLatitude(location[0]);
                    destination.setLongitude(location[1]);
                }
                destination.setImageUrl("/destinations/" + destination.getId() + ".jpg");
                destinationRepository.save(destination);
            });
        } catch (Exception e) {
            System.err.println("[DataSeeder] Notice: Seeding will be retried on next startup: " + e.getMessage());
        }
    }
}
