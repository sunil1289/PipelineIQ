package com.pipelineiq.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.pipelineiq.backend.model.Pipeline;

public interface PipelineRepository extends MongoRepository<Pipeline, String> {

    List<Pipeline> findByStatus(String status);

    long countByStatus(String status);

    Optional<Pipeline> findByJobNameAndBuildNumber(String jobName, int buildNumber);


    List<Pipeline> findByJobNameOrderByTimestampDesc(String jobName);


    List<Pipeline> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

 
    List<Pipeline> findTop50ByOrderByTimestampDesc();

   
    @Query(value = "{}", fields = "{'jobName': 1}")
    List<Pipeline> findAllJobNames();

  
    long countByStatusAndTimestampAfter(String status, LocalDateTime after);
}