package com.dc9.port.simulator;

import com.dc9.port.model.AgvStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AgvStatusBroadcaster {
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final Map<String, AgvStatus> latestStatus = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void addSession(WebSocketSession session) {
        sessions.add(session);
    }

    public void removeSession(WebSocketSession session) {
        sessions.remove(session);
    }

    public void updateStatus(String id, AgvStatus status) {
        latestStatus.put(id, status);
    }

    public void removeStatus(String id) {
        latestStatus.remove(id);
    }

    public Map<String, AgvStatus> getAllStatus() {
        return Collections.unmodifiableMap(latestStatus);
    }

    public void broadcast() {
        List<AgvStatus> statusList = new ArrayList<>(latestStatus.values());
        if (statusList.isEmpty()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(statusList);
            TextMessage message = new TextMessage(json);
            List<WebSocketSession> closedSessions = new ArrayList<>();
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        closedSessions.add(session);
                    }
                } else {
                    closedSessions.add(session);
                }
            }
            sessions.removeAll(closedSessions);
        } catch (Exception e) {
            // ignore
        }
    }
}
