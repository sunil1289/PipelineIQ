package com.pipelineiq.backend.controller;

import com.pipelineiq.backend.model.Alert;
import com.pipelineiq.backend.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAlerts() {
        return alertService.getUnacknowledgedAlerts();
    }

    @GetMapping("/count")
    public Map<String, Long> getAlertCount() {
        return Map.of("count", alertService.getUnacknowledgedCount());
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<Alert> acknowledgeAlert(@PathVariable String id) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(id));
    }

    @PutMapping("/acknowledge-all")
    public ResponseEntity<Void> acknowledgeAll() {
        alertService.acknowledgeAllAlerts();
        return ResponseEntity.ok().build();
    }
}