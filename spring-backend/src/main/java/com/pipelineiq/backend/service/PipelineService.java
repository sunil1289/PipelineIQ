package com.pipelineiq.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pipelineiq.backend.model.Pipeline;
import com.pipelineiq.backend.repository.PipelineRepository;

@Service
public class PipelineService {

    @Autowired
    private PipelineRepository repository;

  

    public List<Pipeline> getAllPipelines() {
        return repository.findTop50ByOrderByTimestampDesc();
    }

    public List<Pipeline> getFailedPipelines() {
        return repository.findByStatus("FAILED");
    }

    public Optional<Pipeline> getPipelineById(String id) {
        return repository.findById(id);
    }

    public List<Pipeline> getPipelinesByJob(String jobName) {
        return repository.findByJobNameOrderByTimestampDesc(jobName);
    }

    public List<String> getJobNames() {
        return repository.findAll().stream()
                .map(Pipeline::getJobName)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        long total   = repository.count();
        long failed  = repository.countByStatus("FAILED");
        long success = repository.countByStatus("SUCCESS");
        long running = repository.countByStatus("RUNNING");

        long recentFailures = repository.countByStatusAndTimestampAfter(
                "FAILED", LocalDateTime.now().minusHours(24)
        );

        double avgDuration = repository.findByStatus("SUCCESS").stream()
                .mapToLong(Pipeline::getDuration)
                .average()
                .orElse(0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",              total);
        stats.put("failed",             failed);
        stats.put("success",            success);
        stats.put("running",            running);
        stats.put("recentFailures",     recentFailures);
        stats.put("avgDurationSeconds", Math.round(avgDuration / 1000));
        stats.put("successRate",        total > 0 ? Math.round((success * 100.0) / total) : 0);
        return stats;
    }

    public List<Map<String, Object>> getTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = LocalDateTime.now().minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd   = dayStart.plusDays(1);

            List<Pipeline> dayBuilds = repository.findByTimestampBetween(dayStart, dayEnd);
            long daySuccess = dayBuilds.stream().filter(p -> "SUCCESS".equals(p.getStatus())).count();
            long dayFailed  = dayBuilds.stream().filter(p -> "FAILED".equals(p.getStatus())).count();

            Map<String, Object> day = new HashMap<>();
            day.put("date",    dayStart.toLocalDate().toString());
            day.put("success", daySuccess);
            day.put("failed",  dayFailed);
            day.put("total",   dayBuilds.size());
            trend.add(day);
        }

        return trend;
    }


    public Pipeline updatePipeline(String id, Pipeline updated) {
        return repository.findById(id).map(existing -> {
            existing.setStatus(updated.getStatus());
            existing.setBranch(updated.getBranch());
            existing.setFailureReason(updated.getFailureReason());
            existing.setEnvironment(updated.getEnvironment());
            return repository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Pipeline not found: " + id));
    }

    public void deletePipeline(String id) {
        repository.deleteById(id);
    }

    public void deleteAllByJob(String jobName) {
        List<Pipeline> toDelete = repository.findByJobNameOrderByTimestampDesc(jobName);
        repository.deleteAll(toDelete);
    }
}