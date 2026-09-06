package com.aceinterview.backend.config;

import com.aceinterview.backend.service.ScoringDryRunService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component @Order(100)
@ConditionalOnProperty(name="app.scoring.dry-run-session-id")
public class ScoringDryRunRunner implements CommandLineRunner {
    private final ScoringDryRunService service;
    public ScoringDryRunRunner(ScoringDryRunService service){this.service=service;}
    @Override public void run(String...args){
        String configured=System.getProperty("app.scoring.dry-run-session-id",System.getenv("SCORING_DRY_RUN_SESSION_ID"));
        if(configured==null)configured=java.util.Arrays.stream(args).filter(v->v.startsWith("--app.scoring.dry-run-session-id=")).map(v->v.substring(v.indexOf('=')+1)).findFirst().orElseThrow();
        ScoringDryRunService.SessionReport report=service.evaluate(Long.parseLong(configured));
        System.out.println("SCORING_DRY_RUN session="+report.sessionId()+" old="+report.oldAverage()+" new="+report.newAverage());
        report.answers().forEach(a->System.out.printf("DRY_RUN answer=%d question=%d old=%d new=%d F/P/M=%d/%d/%d relevant=%s incorrect=%s topic=%s%n",a.answerId(),a.questionId(),a.oldScore(),a.newScore(),a.full(),a.partial(),a.missing(),a.relevant(),a.incorrect(),a.topic()));
    }
}
