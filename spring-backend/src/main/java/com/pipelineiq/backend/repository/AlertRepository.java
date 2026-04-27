package com.pipelineiq.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.pipelineiq.backend.model.Alert;

public interface AlertRepository extends MongoRepository<Alert, String> {

    List<Alert> findByAcknowledgedFalseOrderByCreatedAtDesc();

    List<Alert> findByJobName(String jobName);

    long countByAcknowledgedFalse();
}