package com.pipelineiq.backend.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "pipelines")
@CompoundIndex(def = "{'jobName': 1, 'buildNumber': 1}", unique = true)
public class Pipeline {

    @Id
    private String id;
    private String jobName;
    private String status;
    private String branch;
    private long duration;
    private LocalDateTime timestamp;
    private int buildNumber;
    private String triggeredBy;
    private String failureReason;
    private List<String> errorLogs;
    private String environment;
    private int testsPassed;
    private int testsFailed;
    private long artifactSize;

  

    public String getId() {
        return id;
    }

    public String getJobName() {
        return jobName;
    }

    public String getStatus() {
        return status;
    }

    public String getBranch() {
        return branch;
    }

    public long getDuration() {
        return duration;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public int getBuildNumber() {
        return buildNumber;
    }

    public String getTriggeredBy() {
        return triggeredBy;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public List<String> getErrorLogs() {
        return errorLogs;
    }

    public String getEnvironment() {
        return environment;
    }

    public int getTestsPassed() {
        return testsPassed;
    }

    public int getTestsFailed() {
        return testsFailed;
    }

    public long getArtifactSize() {
        return artifactSize;
    }
    public void setId(String id) {
        this.id = id;
    }

    public void setJobName(String jobName) {
        this.jobName = jobName;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public void setDuration(long duration) {
        this.duration = duration;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public void setBuildNumber(int buildNumber) {
        this.buildNumber = buildNumber;
    }

    public void setTriggeredBy(String triggeredBy) {
        this.triggeredBy = triggeredBy;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public void setErrorLogs(List<String> errorLogs) {
        this.errorLogs = errorLogs;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public void setTestsPassed(int testsPassed) {
        this.testsPassed = testsPassed;
    }

    public void setTestsFailed(int testsFailed) {
        this.testsFailed = testsFailed;
    }

    public void setArtifactSize(long artifactSize) {
        this.artifactSize = artifactSize;
    }
}