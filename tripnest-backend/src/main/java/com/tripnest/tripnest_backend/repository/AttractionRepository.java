package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttractionRepository extends JpaRepository<Attraction, Long> {

    List<Attraction> findByDestinationIdOrderByNameAsc(Integer destinationId);

    List<Attraction> findByDestinationId(Integer destinationId);
}
