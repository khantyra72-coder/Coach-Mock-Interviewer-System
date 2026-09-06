package com.aceinterview.backend.service;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ExperienceLevelEvaluator {
    private static final Set<String> LEVELS=Set.of("Intern","Entry (0-2 yrs)","Mid (3-5 yrs)","Senior");

    public String normalizeLevel(String level){String value=level==null?"":level.replace('–','-').trim();return LEVELS.contains(value)?value:"Entry (0-2 yrs)";}

    public DepthResult evaluate(String level,String criterion,String answer){
        String normalizedLevel=normalizeLevel(level);
        if("Intern".equals(normalizedLevel)) return new DepthResult(true,List.of(),List.of());
        String category=category(criterion);
        List<Signal> required=requirements(normalizedLevel,category);
        List<String> found=new ArrayList<>(),missing=new ArrayList<>();
        String text=answer.toLowerCase(Locale.ROOT);
        for(Signal signal:required){if(signal.terms().stream().anyMatch(text::contains))found.add(signal.label());else missing.add(signal.label());}
        return new DepthResult(missing.isEmpty(),found,missing);
    }

    public DepthResult evaluateBehavioral(String level,String criterion,String answer){
        String normalizedLevel=normalizeLevel(level);
        if("Intern".equals(normalizedLevel)||"Entry (0-2 yrs)".equals(normalizedLevel))return new DepthResult(true,List.of(),List.of());
        String name=criterion.toLowerCase(Locale.ROOT),text=answer.toLowerCase(Locale.ROOT);
        List<Signal> required=new ArrayList<>();
        if(name.matches(".*(owner|responsib|contribution).*")){
            required.add(signal("clear personal contribution","i ","my ","personally"));
            if("Senior".equals(normalizedLevel))required.add(signal("influence beyond the individual","team","stakeholder","review","consensus","cross-team"));
        }else if(name.matches(".*(judg|decision|collabor|alternative).*")){
            required.add(signal("evidence-based decision","evidence","data","because","alternative","trade-off","tradeoff"));
            if("Senior".equals(normalizedLevel))required.add(signal("stakeholder influence or risk","team","stakeholder","consensus","risk","impact"));
        }else if(name.matches(".*(result|outcome|measur|impact).*")){
            required.add(signal("measurable outcome","%","$","saved","reduced","increased","improved","metric","result"));
            if("Senior".equals(normalizedLevel))required.add(signal("organizational or user impact","annual","business","customer","user","team","cost","lasting"));
        }else if(name.matches(".*(learn|transfer|after).*")){
            required.add(signal("learning applied afterward","learned","afterward","since then","next time","later","follow-up","prevent"));
        }else{
            required.add(signal("clear context and stakes","when ","situation","problem","challenge","risk","proposed","production"));
        }
        List<String> found=new ArrayList<>(),missing=new ArrayList<>();
        for(Signal signal:required){if(signal.terms().stream().anyMatch(text::contains))found.add(signal.label());else missing.add(signal.label());}
        return new DepthResult(missing.isEmpty(),found,missing);
    }

    public String behavioralEvidenceStatus(String criterion,String answer){
        String name=criterion.toLowerCase(Locale.ROOT),text=answer.toLowerCase(Locale.ROOT);int signals;
        if(name.matches(".*(situation|stake|context).*"))signals=countSignals(text,"when ","situation","team","project","problem","challenge","proposed","production","risk");
        else if(name.matches(".*(owner|responsib|contribution).*"))signals=countSignals(text,"i ","my ","personally","built","evaluated","gathered","presented","decided","led","implemented","created");
        else if(name.matches(".*(judg|decision|collabor|alternative).*"))signals=countSignals(text,"evidence","data","alternative","because","trade-off","tradeoff","review","team","consensus","decision");
        else if(name.matches(".*(result|outcome|measur|impact).*"))signals=countSignals(text,"%","$","saved","reduced","increased","improved","metric","result","cost","latency","throughput");
        else if(name.matches(".*(learn|transfer|after).*"))signals=countSignals(text,"learned","afterward","since then","next time","later","follow-up","prevent recurrence","changed how");
        else signals=countSignals(text,"when ","i ","result","team","because");
        return signals>=2?"FULL":signals==1?"PARTIAL":"MISSING";
    }

    private int countSignals(String answer,String...signals){return (int)Arrays.stream(signals).filter(answer::contains).count();}

    private String category(String criterion){
        String value=criterion.toLowerCase(Locale.ROOT);
        if(value.matches(".*(verif|valid|test|measur|result|outcome).*"))return "verification";
        if(value.matches(".*(trade|judg|decision|alternative|reason).*"))return "judgment";
        if(value.matches(".*(owner|collabor|communicat|learning|stakeholder).*"))return "ownership";
        return "technical";
    }

    private List<Signal> requirements(String level,String category){
        if("Entry (0-2 yrs)".equals(level)) return switch(category){
            case "verification" -> List.of(signal("basic verification","test","verify","validate","check"));
            case "judgment" -> List.of(signal("reason for the choice","because","choose","trade-off","tradeoff"));
            case "ownership" -> List.of(signal("personal contribution","i ","my ","personally"));
            default -> List.of(signal("practical application","implement","example","edge case","test"));
        };
        if("Mid (3-5 yrs)".equals(level)) return switch(category){
            case "verification" -> List.of(signal("testing","test","verify","validate"),signal("production measurement","metric","monitor","p95","p99","latency"));
            case "judgment" -> List.of(signal("alternatives or trade-offs","alternative","trade-off","tradeoff"),signal("risk or impact","risk","impact","failure"));
            case "ownership" -> List.of(signal("personal contribution","i ","my ","personally"),signal("team coordination","team","stakeholder","review","coordinate"));
            default -> List.of(signal("production behavior","production","scale","failure","concurrency"),signal("verification","test","verify","metric","monitor"));
        };
        return switch(category){
            case "verification" -> List.of(signal("validation plan","test","verify","validate"),signal("measurable threshold","metric","threshold","p95","p99","slo"),signal("safe rollout or rollback","rollback","rollout","canary","monitor"));
            case "judgment" -> List.of(signal("alternatives and trade-offs","alternative","trade-off","tradeoff"),signal("assumptions and risk","assumption","risk","blast radius"),signal("long-term or user impact","long-term","lasting","prevent","user impact","business impact"));
            case "ownership" -> List.of(signal("personal contribution","i ","my ","personally"),signal("cross-team leadership","cross-team","stakeholder","coordinate","team"),signal("lasting prevention","long-term","lasting","prevent","follow-up"));
            default -> List.of(signal("production and scale","production","scale","failure","concurrency"),signal("system-wide risk","risk","blast radius","downstream","client"),signal("operations and recovery","rollback","monitor","observability","recovery"));
        };
    }

    private Signal signal(String label,String...terms){return new Signal(label,List.of(terms));}
    private record Signal(String label,List<String> terms){}
    public record DepthResult(boolean full,List<String> found,List<String> missing){}
}
