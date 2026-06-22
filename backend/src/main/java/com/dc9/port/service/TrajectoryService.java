package com.dc9.port.service;

import com.dc9.port.model.TrajectoryHistory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TrajectoryService {
    private static final double TERMINAL_WIDTH = 80;
    private static final double TERMINAL_DEPTH = 60;
    private static final double Y_GROUND = 0.3;
    private final Map<String, List<double[]>> cachedTracks = new ConcurrentHashMap<>();

    public TrajectoryHistory queryTrajectory(String agvId, long startTime, long endTime) {
        long durationMs = endTime - startTime;
        if (durationMs <= 0) durationMs = 3600000L;
        int targetPoints = (int) Math.min(50000, Math.max(2000, durationMs / 20));
        Random rng = new Random((agvId + startTime).hashCode());
        List<double[]> track = buildTrack(agvId, targetPoints, rng);
        double totalArcLength = computeArcLength(track);
        List<Long> timestamps = new ArrayList<>(track.size());
        for (int i = 0; i < track.size(); i++) {
            timestamps.add(startTime + (long) (i * (double) durationMs / track.size()));
        }
        List<double[]> batterySeries = new ArrayList<>(track.size());
        double battery = 95.0;
        for (int i = 0; i < track.size(); i++) {
            double dischargeRate = 0.0008 + rng.nextDouble() * 0.0012;
            battery = Math.max(10, 95 - i * dischargeRate);
            batterySeries.add(new double[] { Math.round(battery * 10.0) / 10.0 });
        }
        return new TrajectoryHistory(
                agvId,
                startTime,
                endTime,
                track.size(),
                totalArcLength,
                track,
                timestamps,
                batterySeries
        );
    }

    private List<double[]> buildTrack(String agvId, int n, Random rng) {
        List<double[]> pts = new ArrayList<>(n);
        double x = (rng.nextDouble() - 0.5) * TERMINAL_WIDTH * 0.7;
        double z = (rng.nextDouble() - 0.5) * TERMINAL_DEPTH * 0.7;
        double heading = rng.nextDouble() * Math.PI * 2;
        double speed = 1.5 + rng.nextDouble() * 2;
        double stepX = Math.sin(heading) * speed * 0.05;
        double stepZ = Math.cos(heading) * speed * 0.05;
        for (int i = 0; i < n; i++) {
            if (i % (200 + rng.nextInt(500)) == 0) {
                double targetX = (rng.nextDouble() - 0.5) * TERMINAL_WIDTH * 0.75;
                double targetZ = (rng.nextDouble() - 0.5) * TERMINAL_DEPTH * 0.75;
                double dx = targetX - x;
                double dz = targetZ - z;
                heading = Math.atan2(dx, dz);
                speed = 1.2 + rng.nextDouble() * 2.5;
                stepX = Math.sin(heading) * speed * 0.05;
                stepZ = Math.cos(heading) * speed * 0.05;
            }
            double wobble = (rng.nextDouble() - 0.5) * 0.03;
            x += stepX + wobble;
            z += stepZ - wobble;
            x = Math.max(-TERMINAL_WIDTH * 0.45, Math.min(TERMINAL_WIDTH * 0.45, x));
            z = Math.max(-TERMINAL_DEPTH * 0.45, Math.min(TERMINAL_DEPTH * 0.45, z));
            pts.add(new double[] {
                    Math.round(x * 1000.0) / 1000.0,
                    Y_GROUND,
                    Math.round(z * 1000.0) / 1000.0,
                    Math.round(heading * 1000.0) / 1000.0
            });
        }
        return pts;
    }

    private double computeArcLength(List<double[]> pts) {
        double total = 0;
        for (int i = 1; i < pts.size(); i++) {
            double[] a = pts.get(i - 1);
            double[] b = pts.get(i);
            double dx = b[0] - a[0];
            double dz = b[2] - a[2];
            total += Math.sqrt(dx * dx + dz * dz);
        }
        return Math.round(total * 100.0) / 100.0;
    }
}
