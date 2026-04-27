package com.pipelineiq.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.pipelineiq.backend.model.Alert;
import com.pipelineiq.backend.model.Pipeline;
import com.pipelineiq.backend.repository.AlertRepository;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${alert.email.to:}")
    private String alertEmail;


    public void createAlert(Pipeline pipeline) {
        Alert alert = new Alert();
        alert.setJobName(pipeline.getJobName());
        alert.setSeverity("CRITICAL");
        alert.setMessage("Build #" + pipeline.getBuildNumber() + " FAILED for job: " + pipeline.getJobName());
        alert.setAcknowledged(false);
        alert.setCreatedAt(LocalDateTime.now());
        alertRepository.save(alert);
        sendEmailAlert(alert.getMessage(), pipeline);
    }

    public List<Alert> getUnacknowledgedAlerts() {
        return alertRepository.findByAcknowledgedFalseOrderByCreatedAtDesc();
    }

    public long getUnacknowledgedCount() {
        return alertRepository.countByAcknowledgedFalse();
    }

    public Alert acknowledgeAlert(String id) {
        return alertRepository.findById(id)
                .map(alert -> {
                    alert.setAcknowledged(true);
                    alert.setResolvedAt(LocalDateTime.now());
                    return alertRepository.save(alert);
                })
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));
    }

    public void acknowledgeAllAlerts() {
        List<Alert> alerts = alertRepository.findByAcknowledgedFalseOrderByCreatedAtDesc();
        LocalDateTime now = LocalDateTime.now();
        for (Alert alert : alerts) {
            alert.setAcknowledged(true);
            alert.setResolvedAt(now);
        }
        alertRepository.saveAll(alerts);
    }


    private void sendEmailAlert(String message, Pipeline pipeline) {
        if (mailSender == null || alertEmail == null || alertEmail.isEmpty()) {
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(alertEmail);
            mail.setSubject("PipelineIQ Alert: " + pipeline.getJobName() + " FAILED");
            mail.setText(message);
            mailSender.send(mail);
        } catch (Exception e) {
            System.err.println("Email notification failed: " + e.getMessage());
        }
    }
}