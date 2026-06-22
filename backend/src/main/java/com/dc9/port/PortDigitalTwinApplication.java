package com.dc9.port;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PortDigitalTwinApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortDigitalTwinApplication.class, args);
    }
}
