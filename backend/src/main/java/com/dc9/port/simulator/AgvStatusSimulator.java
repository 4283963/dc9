package com.dc9.port.simulator;

import com.dc9.port.model.AgvStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AgvStatusSimulator {
    private final AgvStatusBroadcaster broadcaster;
    private final Random random = new Random();

    @Value("${agv.simulation.vehicle-count:10}")
    private int vehicleCount;

    private static final double TERMINAL_WIDTH = 80;
    private static final double TERMINAL_DEPTH = 60;
    private static final double Y_GROUND = 0.3;
    private static final String[] CONTAINER_COLORS = {
            "#ff9f43", "#ee5a24", "#f39c12", "#d35400", "#e67e22", "#c0392b", "#27ae60", "#2980b9"
    };

    private static AgvStatusSimulator instance;

    private final Map<String, VehicleState> vehicleStates = new ConcurrentHashMap<>();

    public AgvStatusSimulator(AgvStatusBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
        instance = this;
    }

    @PostConstruct
    public void init() {
        for (int i = 1; i <= vehicleCount; i++) {
            String id = String.format("AGV-%03d", i);
            VehicleState state = new VehicleState();
            state.id = id;
            state.x = (random.nextDouble() - 0.5) * TERMINAL_WIDTH * 0.8;
            state.z = (random.nextDouble() - 0.5) * TERMINAL_DEPTH * 0.8;
            state.targetX = (random.nextDouble() - 0.5) * TERMINAL_WIDTH * 0.8;
            state.targetZ = (random.nextDouble() - 0.5) * TERMINAL_DEPTH * 0.8;
            state.speed = 1.5 + random.nextDouble() * 2.0;
            state.battery = 40 + random.nextDouble() * 60;
            state.status = "RUNNING";
            state.hasContainer = random.nextDouble() < 0.6;
            state.containerColor = CONTAINER_COLORS[random.nextInt(CONTAINER_COLORS.length)];
            state.containerId = String.format("CTN-%05d", random.nextInt(90000) + 10000);
            state.loadingTimer = 0;
            vehicleStates.put(id, state);
            broadcaster.updateStatus(id, toAgvStatus(state));
        }
    }

    @Scheduled(fixedRateString = "${agv.simulation.broadcast-interval-ms:100}")
    public void broadcastStatus() {
        broadcaster.broadcast();
    }

    @Scheduled(fixedRateString = "${agv.simulation.move-interval-ms:200}")
    public void moveVehicles() {
        double dt = 0.2;
        for (VehicleState state : vehicleStates.values()) {
            double dx = state.targetX - state.x;
            double dz = state.targetZ - state.z;
            double dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 0.5) {
                state.targetX = (random.nextDouble() - 0.5) * TERMINAL_WIDTH * 0.8;
                state.targetZ = (random.nextDouble() - 0.5) * TERMINAL_DEPTH * 0.8;
                if (random.nextDouble() < 0.3) {
                    state.status = "IDLE";
                    state.loadingTimer = 3 + random.nextDouble() * 3;
                } else if (random.nextDouble() < 0.15) {
                    state.status = "CHARGING";
                    state.idleTime = 4 + random.nextInt(6);
                }
                continue;
            }
            if (state.loadingTimer > 0) {
                state.loadingTimer -= dt;
                if (state.loadingTimer <= 0 && state.status.equals("IDLE")) {
                    state.hasContainer = !state.hasContainer;
                    if (state.hasContainer) {
                        state.containerColor = CONTAINER_COLORS[random.nextInt(CONTAINER_COLORS.length)];
                        state.containerId = String.format("CTN-%05d", random.nextInt(90000) + 10000);
                    }
                    state.status = "RUNNING";
                }
                broadcaster.updateStatus(state.id, toAgvStatus(state));
                continue;
            }
            if (state.idleTime > 0) {
                state.idleTime -= dt;
                if (state.status.equals("CHARGING")) {
                    state.battery = Math.min(100, state.battery + dt * 15);
                }
                if (state.idleTime <= 0) {
                    state.status = "RUNNING";
                }
                broadcaster.updateStatus(state.id, toAgvStatus(state));
                continue;
            }
            double moveDist = state.speed * dt;
            if (moveDist > dist) moveDist = dist;
            double ratio = moveDist / dist;
            state.x += dx * ratio;
            state.z += dz * ratio;
            state.heading = Math.atan2(dx, dz);
            state.battery = Math.max(0, state.battery - dt * 0.15);
            if (state.battery < 20) {
                state.status = state.battery < 5 ? "ERROR" : "RUNNING";
            }
            broadcaster.updateStatus(state.id, toAgvStatus(state));
        }
    }

    private AgvStatus toAgvStatus(VehicleState state) {
        AgvStatus status = new AgvStatus();
        status.setId(state.id);
        status.setTimestamp(System.currentTimeMillis());
        status.setPosition(new AgvStatus.Position(
                Math.round(state.x * 100.0) / 100.0,
                Y_GROUND,
                Math.round(state.z * 100.0) / 100.0
        ));
        status.setRotation(new AgvStatus.Rotation(
                0,
                Math.round(state.heading * 1000.0) / 1000.0,
                0
        ));
        status.setSpeed(state.status.equals("RUNNING") ? Math.round(state.speed * 100.0) / 100.0 : 0);
        status.setBattery(Math.round(state.battery * 10.0) / 10.0);
        status.setStatus(state.status);
        status.setHasContainer(state.hasContainer);
        status.setContainerColor(state.containerColor);
        status.setContainerId(state.containerId);
        return status;
    }

    private static class VehicleState {
        String id;
        double x, z;
        double targetX, targetZ;
        double heading;
        double speed;
        double battery;
        String status;
        double idleTime;
        boolean hasContainer;
        String containerColor;
        String containerId;
        double loadingTimer;
    }
}
