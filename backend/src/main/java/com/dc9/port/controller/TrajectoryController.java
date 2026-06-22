package com.dc9.port.controller;

import com.dc9.port.model.TrajectoryHistory;
import com.dc9.port.service.TrajectoryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trajectory")
@CrossOrigin(origins = "*")
public class TrajectoryController {
    private final TrajectoryService trajectoryService;

    public TrajectoryController(TrajectoryService trajectoryService) {
        this.trajectoryService = trajectoryService;
    }

    @GetMapping("/history")
    public TrajectoryHistory queryHistory(
            @RequestParam String agvId,
            @RequestParam long startTime,
            @RequestParam long endTime) {
        return trajectoryService.queryTrajectory(agvId, startTime, endTime);
    }
}
