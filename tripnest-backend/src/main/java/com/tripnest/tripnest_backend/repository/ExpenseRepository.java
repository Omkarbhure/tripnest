package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // All expenses for a trip, newest first
    List<Expense> findByTripIdOrderByExpenseDateDesc(Long tripId);

    // Sum of all expense amounts for a trip — used for remaining budget calculation
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId")
    BigDecimal sumAmountByTripId(@Param("tripId") Long tripId);

    // Group expenses by category for a trip and return [category, totalAmount] pairs
    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.trip.id = :tripId GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> sumByCategory(@Param("tripId") Long tripId);

    // Group expenses by category across all trips accessible to the user
    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.trip.id IN (SELECT t.id FROM Trip t WHERE t.user.email = :email OR t.id IN (SELECT tm.trip.id FROM TripMember tm WHERE tm.user.email = :email)) GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<Object[]> sumByCategoryForUser(@Param("email") String email);

    // Sum of all expenses across all trips accessible to the user
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id IN (SELECT t.id FROM Trip t WHERE t.user.email = :email OR t.id IN (SELECT tm.trip.id FROM TripMember tm WHERE tm.user.email = :email))")
    BigDecimal sumTotalSpentForUser(@Param("email") String email);

    // Platform-level total amount spent across all expenses
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal sumTotalSpentPlatform();

    void deleteByTripId(Long tripId);
}
