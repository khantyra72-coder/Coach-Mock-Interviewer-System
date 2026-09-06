package com.aceinterview.backend.service;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
public class EvidenceAwareScoringService {
    private static final Pattern QUANTIFIED_RESULT=Pattern.compile("(?:\\$\\s*\\d|\\d+(?:\\.\\d+)?\\s*(?:%|percent|hours?|days?|seconds?|ms|thousand|million)\\b|\\bp(?:95|99)\\b|\\bzero\\b)");
    private static final Pattern UNSAFE_BYPASS=Pattern.compile("(?:bypass(?:es|ing)?|skip(?:s|ping)?|disable[sd]?|suppress(?:es|ing)?).{0,45}(?:validat|compiler|security|authentication|authorization|type.?check|warning|error|test|release.?gate)|(?:raw|unparsed|unchecked).{0,35}(?:css|json|string|input|payload)|hardcod(?:e|ed|ing).{0,30}(?:credential|secret|token|fallback|value)");
    private static final Pattern CRITICAL_UNSAFE=Pattern.compile(
            "(?:disable|turn\\s+off|remove|bypass).{0,35}(?:firewalls?|authentication|authorization|encryption|security\\s+controls?|monitoring|audit(?:ing)?|backups?|antivirus)"+
            "|grant.{0,80}(?:global|full|admin(?:istrator)?|root|read\\s*/?\\s*write|wildcard|\\*\\s*[:.]\\s*\\*)"+
            "|(?:make|set|expose).{0,35}(?:buckets?|databases?|services?|endpoints?|ports?).{0,25}public"+
            "|(?:open|allow).{0,25}(?:all|every|any).{0,20}(?:ports?|traffic|users?|addresses?)"+
            "|(?:store|log|send).{0,35}(?:passwords?|secrets?|credentials?|tokens?).{0,25}(?:plain|unencrypt)"+
            "|(?:delete|drop|truncate).{0,35}(?:production|databases?|tables?|backups?)");
    private static final Pattern SAFETY_NEGATION=Pattern.compile("(?:do\\s+not|don't|never|avoid|must\\s+not|should\\s+not|instead\\s+of|prevent)\\s*.{0,28}$");
    private final RubricEvidenceGroupRepository groups;private final EvidenceTermRepository terms;
    public EvidenceAwareScoringService(RubricEvidenceGroupRepository groups,EvidenceTermRepository terms){this.groups=groups;this.terms=terms;}
    public boolean supports(List<RubricCriterion> criteria){return criteria.size()==5&&criteria.stream().allMatch(c->c.getRubricVersion()!=null&&c.getRubricVersion()>=2&&!groups.findByRubricCriterionIdOrderByGroupOrderAsc(c.getId()).isEmpty());}
    public ScoreResult score(Question question,List<RubricCriterion> criteria,String answer){
        String naturalText=answer==null?"":answer.toLowerCase(Locale.ROOT);boolean unsafeClaim=UNSAFE_BYPASS.matcher(naturalText).find();boolean criticalUnsafe=isCriticalUnsafeRecommendation(naturalText);
        String text=normalize(answer);boolean behavioral="Behavioral".equalsIgnoreCase(question.getCategory());boolean technical="Technical".equalsIgnoreCase(question.getCategory());boolean systemDesign="System Design".equalsIgnoreCase(question.getCategory());List<CriterionScore> scores=new ArrayList<>();boolean incorrect=false;
        for(RubricCriterion criterion:criteria){
            LinkedHashSet<String> matched=new LinkedHashSet<>();LinkedHashSet<String> incorrectMatched=new LinkedHashSet<>();
            for(RubricEvidenceGroup group:groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId()))for(EvidenceTerm term:terms.findByEvidenceGroupId(group.getId())){
                if(matches(text,term.getValue())){if("INCORRECT".equals(term.getTermType()))incorrectMatched.add(term.getValue());else matched.add(term.getValue());}
            }
            incorrect|=!incorrectMatched.isEmpty();String status;
            if(behavioral){
                BehavioralEvaluation evaluation=evaluateBehavioral(criterion.getCriterionName(),naturalText);
                status=evaluation.status();matched.addAll(evaluation.evidence());
            }else if(technical){
                ConceptEvaluation evaluation=evaluateTechnical(criterion.getCriterionName(),naturalText);
                if(evaluation.recognized()){status=evaluation.status();matched.addAll(evaluation.evidence());}
                else status=matched.size()>=2?"FULL":matched.size()==1?"PARTIAL":"MISSING";
            }else if(systemDesign){
                ConceptEvaluation evaluation=evaluateSystemDesign(criterion.getCriterionName(),naturalText);
                if(evaluation.recognized()){status=evaluation.status();matched.addAll(evaluation.evidence());}
                else status=matched.size()>=2?"FULL":matched.size()==1?"PARTIAL":"MISSING";
            }else status=matched.size()>=2?"FULL":matched.size()==1?"PARTIAL":"MISSING";
            if((technical||systemDesign)&&(unsafeClaim||criticalUnsafe)){
                String criterionName=criterion.getCriterionName().toLowerCase(Locale.ROOT);
                if(criticalUnsafe&&criterionName.matches(".*(correction|solution|implement|fix|safety|security|failure|rollback|recovery|contain|proof|correct|verif|validation).*"))status="MISSING";
                else if(criterionName.matches(".*(correction|solution|implement|fix|safety|security).*"))status="MISSING";
                else if(criterionName.matches(".*(proof|correct|verif|validation|result|outcome).*"))status="PARTIAL";
                incorrectMatched.add(criticalUnsafe?"critically unsafe recommendation":"unsafe validation or safety bypass");
            }
            int awarded="FULL".equals(status)?criterion.getWeight():"PARTIAL".equals(status)?criterion.getWeight()/2:0;
            scores.add(new CriterionScore(criterion,status,awarded,new ArrayList<>(matched),new ArrayList<>(incorrectMatched)));
        }
        int full=(int)scores.stream().filter(s->"FULL".equals(s.status())).count(),partial=(int)scores.stream().filter(s->"PARTIAL".equals(s.status())).count();
        int raw=behavioral?scores.stream().mapToInt(CriterionScore::awarded).sum():performanceBand(full,partial);boolean substantial=tokens(text).size()>=8;boolean relevant=substantial&&(topicRelated(text,question.getTopic())||scores.stream().filter(s->!"MISSING".equals(s.status())).count()>=2);
        incorrect|=unsafeClaim||criticalUnsafe;int finalScore=relevant?Math.max(raw,65):Math.min(raw,39);if(incorrect)finalScore=Math.min(finalScore,69);if(criticalUnsafe)finalScore=Math.min(finalScore,39);
        return new ScoreResult(finalScore,relevant,incorrect,criticalUnsafe,scores);
    }
    public boolean isCriticalUnsafeRecommendation(String answer){
        answer=answer==null?"":answer.toLowerCase(Locale.ROOT);
        var matcher=CRITICAL_UNSAFE.matcher(answer);
        while(matcher.find()){
            String prefix=answer.substring(Math.max(0,matcher.start()-40),matcher.start());
            if(!SAFETY_NEGATION.matcher(prefix).find())return true;
        }
        return false;
    }
    public int performanceBand(int full,int partial){int base=switch(full){case 0->0;case 1->40;case 2->60;case 3->80;case 4->90;default->100;};int increment=full==0?10:5;int cap=switch(full){case 0->50;case 1->60;case 2->75;case 3->90;case 4->95;default->100;};return Math.min(cap,base+partial*increment);}
    private boolean matches(String answer,String evidence){String value=normalize(evidence);if(value.length()<3)return false;if(answer.contains(value))return true;Set<String>w=tokens(value);if(w.size()<2)return false;Set<String>a=tokens(answer);long found=w.stream().filter(a::contains).count();return found>=2&&(double)found/w.size()>=.75;}
    private boolean topicRelated(String answer,String topic){Set<String>topicWords=tokens(topic),answerWords=tokens(answer);return !topicWords.isEmpty()&&topicWords.stream().filter(answerWords::contains).count()>=Math.min(2,topicWords.size());}
    private String normalize(String value){return value==null?"":value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+"," ").trim();}
    private Set<String> tokens(String value){return Arrays.stream(normalize(value).split(" ")).filter(v->v.length()>3).map(this::stem).collect(Collectors.toSet());}
    private String stem(String value){
        if(value.endsWith("ization")&&value.length()>9)return value.substring(0,value.length()-5);
        if(value.endsWith("ing")&&value.length()>6)return value.substring(0,value.length()-3);
        if(value.endsWith("ed")&&value.length()>5)return value.substring(0,value.length()-2);
        if(value.endsWith("s")&&value.length()>4)return value.substring(0,value.length()-1);
        return value;
    }

    private BehavioralEvaluation evaluateBehavioral(String criterion,String answer){
        String name=criterion==null?"":criterion.toLowerCase(Locale.ROOT);LinkedHashSet<String> evidence=new LinkedHashSet<>();boolean first;boolean second;boolean partialEvidence;
        if(name.matches(".*(situation|stake|context).*")){
            first=containsAny(answer,"during ","when ","launch","release","project","incident","production","deadline");
            second=containsAny(answer,"stake","blocker","risk","revenue","customer","user","failure","bug","outage","affected","impact");
            if(first)evidence.add("specific professional context");if(second)evidence.add("clear stakes or people affected");
            partialEvidence=first||second;
        }else if(name.matches(".*(owner|responsib|contribution|personal|individual).*")){
            first=containsAny(answer,"i ","i'm ","i personally","my ");
            second=containsAny(answer,"implemented","built","created","refactored","deployed","decided","led","fixed","investigated","designed","introduced","coordinated");
            if(first)evidence.add("personal contribution");if(second)evidence.add("specific action taken");
            partialEvidence=second;
        }else if(name.matches(".*(judg|decision|collabor|alternative).*")){
            first=containsAny(answer,"priorit","because","recognizing","trade-off","tradeoff","alternative","competing","instead","while ","first");
            second=containsAny(answer,"stakeholder","team","product manager","aligned","agreed","discussed","reviewed","consensus","partnered","coordinated","communicated");
            if(first)evidence.add("decision rationale or trade-off");if(second)evidence.add("collaboration or stakeholder alignment");
            partialEvidence=first||second;
        }else if(name.matches(".*(result|outcome|measur|impact).*")){
            first=QUANTIFIED_RESULT.matcher(answer).find();
            second=containsAny(answer,"as a result","resulted","reduced","dropped","increased","improved","saved","preserved","launched","zero ","before","after");
            if(first)evidence.add("quantified result");if(second)evidence.add("outcome connected to the action");
            partialEvidence=first||second;
        }else if(name.matches(".*(learn|transfer|after).*")){
            first=containsAny(answer,"learned","lesson","realized","reflection","taught me");
            second=containsAny(answer,"since then","afterward","next time","later","changed how","now i","introduced","standardized","prevent recurrence","follow-up");
            if(first)evidence.add("stated learning");if(second)evidence.add("learning applied afterward");
            partialEvidence=first||second;
        }else{
            first=containsAny(answer,"during ","when ","project","production");second=containsAny(answer,"i ","result","because");
            if(first)evidence.add("specific context");if(second)evidence.add("supporting behavioral evidence");
            partialEvidence=first||second;
        }
        return new BehavioralEvaluation(first&&second?"FULL":partialEvidence?"PARTIAL":"MISSING",new ArrayList<>(evidence));
    }
    private boolean containsAny(String answer,String...signals){return Arrays.stream(signals).anyMatch(answer::contains);}

    private ConceptEvaluation evaluateTechnical(String criterion,String answer){
        String name=criterion==null?"":criterion.toLowerCase(Locale.ROOT);LinkedHashSet<String> evidence=new LinkedHashSet<>();boolean mechanism;boolean support;
        if(name.matches(".*(reproduc|baseline|initial evidence|impact|scope|scoped evidence).*")){
            mechanism=containsAny(answer,"reproduce","replicate","simulate","trigger","deliberate","fault injection","chaos","load test","stress test","experiment","test run","inspect","observe");
            support=QUANTIFIED_RESULT.matcher(answer).find()||containsAny(answer,"baseline","failure rate","error rate","metric","monitor","grafana","p95","p99","rps","before","after","affected","scope","crash log","thread dump");
            if(mechanism)evidence.add("repeatable reproduction or fault injection");if(support)evidence.add("measured baseline or observed test evidence");
        }else if(name.matches(".*(root.?cause|causal|diagnos|isolation|mechanism).*")){
            mechanism=containsAny(answer,"diagnos","isolat","trace","log","thread dump","profil","inspect","reveal","investigat","fault injection","chaos","monitor","debug");
            support=containsAny(answer,"root cause","because","cause","saturat","lack ","stuck","blocked","timeout","contention","bottleneck","revealed","retained","race");
            if(mechanism)evidence.add("diagnostic or isolation method");if(support)evidence.add("specific causal explanation");
        }else if(name.matches(".*(correction|solution|implement|fix|alternative|comparison|design choice).*")){
            mechanism=containsAny(answer,"fix","configure","implement","bounded","circuit breaker","retry","replace","refactor","patch","select ","choose ","compared","versus","option","alternative");
            support=containsAny(answer,"trade-off","tradeoff","because","safely","minimal","resource","complexity","operational","compatib","overhead","lower","higher","benefit","drawback");
            if(mechanism)evidence.add("implementable technical correction");if(support)evidence.add("selection rationale or measured trade-off");
        }else if(name.matches(".*(proof|correct|verif|validation|measur|result|outcome|prevention|confidence|observability).*")){
            mechanism=containsAny(answer,"verify","validate","test","regression","k6","monitor","grafana","assert","check","benchmark","trigger","restart");
            support=QUANTIFIED_RESULT.matcher(answer).find()||containsAny(answer,"threshold","p95","p99","error rate","capacity","below","under","zero","before and after","successfully","confirmed");
            if(mechanism)evidence.add("explicit verification method");if(support)evidence.add("measurable success threshold");
        }else if(name.matches(".*(failure|rollback|recovery|contain|resilien|rollout|safe).*")){
            mechanism=containsAny(answer,"failure","fault","crash","termination","timeout","error","worse","risk","degrad","unavailable");
            support=containsAny(answer,"rollback","contain","fallback","circuit breaker","failover","restore","recovery","disable","revert","gracefully","locally","background worker","next time","next launch","canary","staged");
            if(mechanism)evidence.add("failure mode considered");if(support)evidence.add("rollback, containment, or fallback mechanism");
        }else return new ConceptEvaluation(false,"MISSING",List.of());
        return new ConceptEvaluation(true,mechanism&&support?"FULL":mechanism||support?"PARTIAL":"MISSING",new ArrayList<>(evidence));
    }

    private ConceptEvaluation evaluateSystemDesign(String criterion,String answer){
        String name=criterion==null?"":criterion.toLowerCase(Locale.ROOT);LinkedHashSet<String> evidence=new LinkedHashSet<>();boolean mechanism;boolean support;
        if(name.matches(".*(requirement|workload|slo|scale|product).*")){
            mechanism=containsAny(answer,"requirement","user","request","traffic","read","write","latency","availability","throughput","rps","qps","slo","sla","use case");
            support=QUANTIFIED_RESULT.matcher(answer).find()||containsAny(answer,"peak","per second","million","billion","capacity","target","constraint","assume");
            if(mechanism)evidence.add("workload or functional requirement");if(support)evidence.add("quantified target or explicit constraint");
        }else if(name.matches(".*(interface|component|boundar|ownership|contract|architecture|control plane|execution plane).*")){
            mechanism=containsAny(answer,"api","endpoint","service","component","gateway","worker","queue","topic","client","client","control plane","data plane","interface");
            support=containsAny(answer,"owns","responsib","boundary","contract","calls","publishes","consumes","routes","coordinates","separate","between");
            if(mechanism)evidence.add("concrete components or interfaces");if(support)evidence.add("clear boundary, ownership, or interaction");
        }else if(name.matches(".*(data model|request flow|state|correctness|storage|persistence|ingestion|pipeline|routing).*")){
            mechanism=containsAny(answer,"database","table","schema","record","event","state","store","storage","cache","request","message","flow","pipeline","partition");
            support=containsAny(answer,"idempot","consistent","atomic","transaction","version","sequence","dedup","unique","ordering","read path","write path","persist");
            if(mechanism)evidence.add("state, storage, or request flow");if(support)evidence.add("correctness or consistency mechanism");
        }else if(name.matches(".*(reliab|security|recovery|failure|safety|integrity|authorization|audit|secure).*")){
            mechanism=containsAny(answer,"failure","retry","replica","backup","failover","timeout","circuit breaker","dead letter","rollback","recovery","authentication","authorization","encrypt","security","audit");
            support=containsAny(answer,"idempot","multi-zone","region","restore","contain","fallback","least privilege","token","key","tls","monitor","alert","rto","rpo");
            if(mechanism)evidence.add("reliability or security mechanism");if(support)evidence.add("recovery, protection, or verification detail");
        }else if(name.matches(".*(capacity|trade.?off|operation|evolution|efficiency|observability|telemetry).*")){
            mechanism=containsAny(answer,"scale","capacity","shard","partition","cache","batch","queue","replica","autoscal","monitor","metric","log","trace","deploy","migration");
            support=containsAny(answer,"trade-off","tradeoff","cost","complexity","latency","throughput","availability","consistency","bottleneck","alert","dashboard","canary","evolve");
            if(mechanism)evidence.add("capacity or operational mechanism");if(support)evidence.add("trade-off, limit, or operational evidence");
        }else return new ConceptEvaluation(false,"MISSING",List.of());
        return new ConceptEvaluation(true,mechanism&&support?"FULL":mechanism||support?"PARTIAL":"MISSING",new ArrayList<>(evidence));
    }
    public record CriterionScore(RubricCriterion criterion,String status,int awarded,List<String> matched,List<String> incorrectMatched){}
    public record ScoreResult(int score,boolean relevant,boolean incorrect,boolean criticalUnsafe,List<CriterionScore> criteria){}
    private record BehavioralEvaluation(String status,List<String> evidence){}
    private record ConceptEvaluation(boolean recognized,String status,List<String> evidence){}
}
