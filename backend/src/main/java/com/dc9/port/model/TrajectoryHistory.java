package com.dc9.port.model;

import java.util.List;

public class TrajectoryHistory {
    private String agvId;
    private long startTime;
    private long endTime;
    private int pointCount;
    private double totalArcLength;
    private List<double[]> points;
    private List<Long> timestamps;
    private List<double[]> batterySeries;

    public TrajectoryHistory() {}

    public TrajectoryHistory(String agvId, long startTime, long endTime, int pointCount,
                             double totalArcLength, List<double[]> points, List<Long> timestamps,
                             List<double[]> batterySeries) {
        this.agvId = agvId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.pointCount = pointCount;
        this.totalArcLength = totalArcLength;
        this.points = points;
        this.timestamps = timestamps;
        this.batterySeries = batterySeries;
    }

    public String getAgvId() { return agvId; }
    public void setAgvId(String agvId) { this.agvId = agvId; }
    public long getStartTime() { return startTime; }
    public void setStartTime(long startTime) { this.startTime = startTime; }
    public long getEndTime() { return endTime; }
    public void setEndTime(long endTime) { this.endTime = endTime; }
    public int getPointCount() { return pointCount; }
    public void setPointCount(int pointCount) { this.pointCount = pointCount; }
    public double getTotalArcLength() { return totalArcLength; }
    public void setTotalArcLength(double totalArcLength) { this.totalArcLength = totalArcLength; }
    public List<double[]> getPoints() { return points; }
    public void setPoints(List<double[]> points) { this.points = points; }
    public List<Long> getTimestamps() { return timestamps; }
    public void setTimestamps(List<Long> timestamps) { this.timestamps = timestamps; }
    public List<double[]> getBatterySeries() { return batterySeries; }
    public void setBatterySeries(List<double[]> batterySeries) { this.batterySeries = batterySeries; }
}
