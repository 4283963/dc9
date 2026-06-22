package com.dc9.port.model;

public class AgvStatus {
    private String id;
    private long timestamp;
    private Position position;
    private Rotation rotation;
    private double speed;
    private double battery;
    private String status;

    public AgvStatus() {}

    public AgvStatus(String id, long timestamp, Position position, Rotation rotation,
                     double speed, double battery, String status) {
        this.id = id;
        this.timestamp = timestamp;
        this.position = position;
        this.rotation = rotation;
        this.speed = speed;
        this.battery = battery;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public Position getPosition() { return position; }
    public void setPosition(Position position) { this.position = position; }
    public Rotation getRotation() { return rotation; }
    public void setRotation(Rotation rotation) { this.rotation = rotation; }
    public double getSpeed() { return speed; }
    public void setSpeed(double speed) { this.speed = speed; }
    public double getBattery() { return battery; }
    public void setBattery(double battery) { this.battery = battery; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static class Position {
        private double x;
        private double y;
        private double z;

        public Position() {}

        public Position(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public double getX() { return x; }
        public void setX(double x) { this.x = x; }
        public double getY() { return y; }
        public void setY(double y) { this.y = y; }
        public double getZ() { return z; }
        public void setZ(double z) { this.z = z; }
    }

    public static class Rotation {
        private double x;
        private double y;
        private double z;

        public Rotation() {}

        public Rotation(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public double getX() { return x; }
        public void setX(double x) { this.x = x; }
        public double getY() { return y; }
        public void setY(double y) { this.y = y; }
        public double getZ() { return z; }
        public void setZ(double z) { this.z = z; }
    }
}
