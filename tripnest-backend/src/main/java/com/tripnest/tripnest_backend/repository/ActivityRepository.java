package com.tripnest.tripnest_backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tripnest.tripnest_backend.entity.Activity;

public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    List<Activity> findByItineraryIdOrderByStartTimeAsc(Integer itineraryId);

    void deleteByItineraryId(Integer itineraryId);

    @Query("SELECT a FROM Activity a JOIN FETCH a.itinerary i JOIN FETCH i.trip t JOIN FETCH t.user u WHERE i.dayDate = :dayDate")
    List<Activity> findActivitiesByDayDate(@Param("dayDate") LocalDate dayDate);

    @Query("SELECT a FROM Activity a JOIN FETCH a.itinerary i JOIN FETCH i.trip t JOIN FETCH t.user u WHERE i.dayDate BETWEEN :startDate AND :endDate")
    List<Activity> findActivitiesByDayDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}

