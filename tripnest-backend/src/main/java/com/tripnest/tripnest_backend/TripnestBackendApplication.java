package com.tripnest.tripnest_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TripnestBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TripnestBackendApplication.class, args);
	}

}

