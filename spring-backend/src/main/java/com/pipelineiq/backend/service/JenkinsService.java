package com.pipelineiq.backend.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.pipelineiq.backend.model.Pipeline;
import com.pipelineiq.backend.repository.PipelineRepository;

@Service
public class JenkinsService {

    @Value("${jenkins.url}")
    private String jenkinsUrl;

    @Value("${jenkins.username}")
    private String jenkinsUsername;

    @Value("${jenkins.token}")
    private String jenkinsToken;

    @Autowired
    private PipelineRepository repository;

    @Autowired
    private AlertService alertService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Scheduled(fixedRateString = "${jenkins.sync.interval:30000}")
    public void syncJenkinsJobs() {
        try {
            String url = jenkinsUrl + "/api/json?tree=jobs[name,builds[number,result,duration,timestamp,builtOn]]";

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(jenkinsUsername, jenkinsToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map body = response.getBody();
            if (body == null) return;

            List<Map> jobs = (List<Map>) body.get("jobs");
            if (jobs == null) return;

            int newBuilds = 0;

            for (Map job : jobs) {
                String jobName = (String) job.get("name");
                List<Map> builds = (List<Map>) job.get("builds");
                if (builds == null) continue;

                for (Map build : builds) {
                    Integer buildNumber = (Integer) build.get("number");
                    String result = (String) build.get("result");
                    Object durationObj = build.get("duration");
                    Object timestampObj = build.get("timestamp");

                    if (result == null) result = "RUNNING";

                    boolean exists = repository.findByJobNameAndBuildNumber(jobName, buildNumber).isPresent();
                    if (exists) continue;

                    long duration = durationObj != null ? ((Number) durationObj).longValue() : 0L;
                    long timestamp = timestampObj != null ? ((Number) timestampObj).longValue() : 0L;

                    Pipeline pipeline = new Pipeline();
                    pipeline.setJobName(jobName);
                    pipeline.setStatus(result);
                    pipeline.setBranch(detectBranch(jobName));
                    pipeline.setDuration(duration);
                    pipeline.setBuildNumber(buildNumber);
                    pipeline.setTimestamp(
                            LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault())
                    );
                    pipeline.setEnvironment(detectEnvironment(jobName));

                    repository.save(pipeline);
                    newBuilds++;

                    if ("FAILED".equals(result) || "FAILURE".equals(result)) {
                        alertService.createAlert(pipeline);
                    }
                }
            }

            System.out.println("Jenkins sync complete at " + LocalDateTime.now() + " | New builds: " + newBuilds);

        } catch (Exception e) {
            System.err.println("Jenkins sync failed (Jenkins may be offline): " + e.getMessage());
        }
    }

  

    private String detectBranch(String jobName) {
        if (jobName.contains("main"))    return "main";
        if (jobName.contains("master"))  return "master";
        if (jobName.contains("dev"))     return "dev";
        if (jobName.contains("staging")) return "staging";
        if (jobName.contains("feature")) return "feature";
        return "main";
    }

    private String detectEnvironment(String jobName) {
        if (jobName.contains("prod"))    return "production";
        if (jobName.contains("staging")) return "staging";
        if (jobName.contains("dev"))     return "development";
        return "development";
    }
}