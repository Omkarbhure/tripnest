package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByUserEmail(String email);

    @Query("SELECT DISTINCT t FROM Trip t WHERE t.user.email = :email OR t.id IN (SELECT tm.trip.id FROM TripMember tm WHERE tm.user.email = :email)")
    List<Trip> findAllAccessibleByUserEmail(@Param("email") String email);

    List<Trip> findByTitleContainingIgnoreCase(String title);

    @Query("SELECT DISTINCT t FROM Trip t WHERE (t.user.email = :email OR t.id IN (SELECT tm.trip.id FROM TripMember tm WHERE tm.user.email = :email)) AND t.startDate >= :today ORDER BY t.startDate ASC")
    List<Trip> findUpcomingTripsForUser(@Param("email") String email, @Param("today") java.time.LocalDate today);

    @Query("SELECT t.destination, COUNT(t) FROM Trip t WHERE (t.user.email = :email OR t.id IN (SELECT tm.trip.id FROM TripMember tm WHERE tm.user.email = :email)) AND t.destination IS NOT NULL GROUP BY t.destination ORDER BY COUNT(t) DESC")
    List<Object[]> findMostVisitedDestinationsForUser(@Param("email") String email);

    @Query("SELECT t.destination, COUNT(t) FROM Trip t WHERE t.destination IS NOT NULL GROUP BY t.destination ORDER BY COUNT(t) DESC")
    List<Object[]> findMostPopularDestinationsPlatform();

    long countByStatusIgnoreCase(String status);

    List<Trip> findByStartDate(java.time.LocalDate startDate);

    List<Trip> findByStartDateBetween(java.time.LocalDate start, java.time.LocalDate end);
}