package com.dc9.port.handler;

import com.dc9.port.simulator.AgvStatusBroadcaster;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.PongMessage;

@Component
public class AgvWebSocketHandler implements WebSocketHandler {
    private final AgvStatusBroadcaster broadcaster;

    public AgvWebSocketHandler(AgvStatusBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        broadcaster.addSession(session);
    }

    @Override
    public void handleMessage(WebSocketSession session, org.springframework.web.socket.WebSocketMessage<?> message) {
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        broadcaster.removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        broadcaster.removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}
