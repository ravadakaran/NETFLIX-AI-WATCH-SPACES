package com.netflix.ai.watchspaces;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WatchSpacesApplication {

	public static void main(String[] args) {
		SpringApplication.run(WatchSpacesApplication.class, args);
	}

}
