package com.pipelineiq.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pipelineiq.backend.model.Pipeline;
import com.pipelineiq.backend.service.PipelineService;

@RestController
@RequestMapping("/api/pipelines")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class PipelineController {

    @Autowired
    private PipelineService pipelineService;

    @GetMapping
    public List<Pipeline> getAllPipelines() {
        return pipelineService.getAllPipelines();
    }


    @GetMapping("/{id}")
    public ResponseEntity<Pipeline> getPipelineById(@PathVariable String id) {
        return pipelineService.getPipelineById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/failed")
    public List<Pipeline> getFailedPipelines() {
        return pipelineService.getFailedPipelines();
    }

 
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return pipelineService.getStats();
    }

   
    @GetMapping("/trend")
    public List<Map<String, Object>> getTrend() {
        return pipelineService.getTrend();
    }

   
    @GetMapping("/jobs")
    public List<String> getJobNames() {
        return pipelineService.getJobNames();
    }

    @GetMapping("/job/{jobName}")
    public List<Pipeline> getPipelinesByJob(@PathVariable String jobName) {
        return pipelineService.getPipelinesByJob(jobName);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pipeline> updatePipeline(
            @PathVariable String id,
            @RequestBody Pipeline pipeline) {
        try {
            return ResponseEntity.ok(pipelineService.updatePipeline(id, pipeline));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePipeline(@PathVariable String id) {
        pipelineService.deletePipeline(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/job/{jobName}")
    public ResponseEntity<Void> deleteAllByJob(@PathVariable String jobName) {
        pipelineService.deleteAllByJob(jobName);
        return ResponseEntity.ok().build();
    }
}