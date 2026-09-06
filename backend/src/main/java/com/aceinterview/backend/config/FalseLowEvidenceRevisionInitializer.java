package com.aceinterview.backend.config;

import com.aceinterview.backend.entity.*;
import com.aceinterview.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Component @Order(6)
@ConditionalOnProperty(name="app.evidence.false-low-revision.enabled",havingValue="true")
public class FalseLowEvidenceRevisionInitializer implements CommandLineRunner {
    private final RubricCriterionRepository criteria;private final RubricEvidenceGroupRepository groups;private final EvidenceTermRepository terms;
    public FalseLowEvidenceRevisionInitializer(RubricCriterionRepository criteria,RubricEvidenceGroupRepository groups,EvidenceTermRepository terms){this.criteria=criteria;this.groups=groups;this.terms=terms;}
    @Override @Transactional public void run(String...args){seeds().forEach(this::apply);}
    private void apply(QuestionSeed questionSeed){
        List<RubricCriterion> rubric=criteria.findByQuestionIdOrderByCriterionOrderAsc(questionSeed.questionId());if(rubric.size()!=5)return;
        for(int i=0;i<5;i++){RubricCriterion criterion=rubric.get(i);CriterionSeed seed=questionSeed.criteria().get(i);if(criterion.getRubricVersion()!=null&&criterion.getRubricVersion()>=3)continue;
            for(RubricEvidenceGroup group:groups.findByRubricCriterionIdOrderByGroupOrderAsc(criterion.getId())){terms.deleteByEvidenceGroupId(group.getId());groups.delete(group);}
            terms.flush();groups.flush();
            criterion.setCriterionName(seed.name());criterion.setExpectedEvidence(seed.description());criterion.setSemanticDescription(seed.description());criterion.setImportance(i<3?"CORE":"SUPPORTING");criterion.setRubricVersion(3);criterion.setEvidenceStatus("PILOT");criteria.save(criterion);
            create(criterion,1,seed.name(),seed.description(),"TERM",seed.terms());create(criterion,2,"Valid equivalents for "+seed.name(),"Accept equivalent tools, mechanisms, and measurements.","ALTERNATIVE",seed.alternatives());
        }
    }
    private void create(RubricCriterion criterion,int order,String concept,String description,String type,List<String> values){RubricEvidenceGroup group=new RubricEvidenceGroup();group.setRubricCriterion(criterion);group.setGroupOrder(order);group.setConcept(concept);group.setDescription(description);group=groups.save(group);for(String value:values){EvidenceTerm term=new EvidenceTerm();term.setEvidenceGroup(group);term.setTermType(type);term.setValue(value);terms.save(term);}}
    private List<QuestionSeed> seeds(){return List.of(
        q(2213,
          c("Reproduction and baseline","Reproduce load-related test instability and collect failure evidence",l("failure artifacts","DOM snapshots","console logs","network logs","flakiness rate"),l("video recordings","CI stress","repeat runs","baseline failure rate")),
          c("Causal isolation","Identify the specific nondeterministic or resource-related cause",l("fixed timeouts","race conditions","real network calls","resource starvation","memory leak"),l("arbitrary waits","worker contention","retained browser state","flaky network mocks")),
          c("Deterministic correction","Replace fragile behavior with deterministic test mechanisms",l("waitForSelector","network interception","stub dependencies","fresh browser contexts","clean teardown"),l("explicit assertion guards","MSW","Playwright routing","worker isolation")),
          c("Load resilience","Keep test execution stable within CI resource limits",l("concurrency limits","CPU constraints","memory constraints","isolated workers"),l("bounded parallelism","container capacity","dependency isolation","cleanup hooks")),
          c("Measured verification","Prove stability through repeated stress execution",l("hundreds of runs","0% flakiness","stable memory","repeat-each"),l("matrix builds","soak test","bounded memory","pipeline duration"))),
        q(2394,
          c("Measured reproduction","Reproduce the leak and establish memory growth",l("heap snapshots","repeated workflow","retained heap","memory growth"),l("allocation timeline","long session","before and after memory","detached DOM")),
          c("Falsifiable diagnosis","Test competing hypotheses and isolate retained references",l("falsifiable hypothesis","event listeners","timers","subscriptions","detached DOM trees"),l("listener count","closure references","forced garbage collection","retainer path")),
          c("Leak correction","Release lifecycle resources and retained references",l("cleanup function","removeEventListener","unsubscribe","clear timer","ResizeObserver"),l("useEffect teardown","unlisten","WeakMap","WeakSet")),
          c("Lifecycle safety","Prevent recurrence across component mount and unmount cycles",l("component unmount","lifecycle hooks","ephemeral references","bounded cache"),l("observer disconnect","subscription disposal","route transitions","ownership cleanup")),
          c("Soak verification","Verify memory remains bounded during prolonged use",l("soak test","hundreds of loops","heap stays bounded","returns to baseline"),l("Puppeteer","performance memory","forced GC","zero detached nodes"))),
        q(2209,
          c("Implementable solution comparison","Compare native and custom semantic implementations",l("custom ARIA","native select","progressive enhancement","two solutions"),l("listbox widget","native element","HTML dialog","selectlist")),
          c("Accessibility correctness","Address semantics, keyboard use, and assistive technology",l("screen reader","keyboard navigation","focus management","WCAG"),l("NVDA","VoiceOver","TalkBack","aria-activedescendant")),
          c("Measured trade-offs","Compare flexibility, complexity, compatibility, and maintenance",l("styling flexibility","implementation complexity","maintenance overhead","mobile support"),l("design customization","native picker","browser compatibility","engineering cost")),
          c("Decision and implementation","Choose a justified option and explain its implementation",l("chose","native interaction model","custom visual trigger","based on trade-offs"),l("decision rationale","progressively enhanced native","implementation choice","fallback semantics")),
          c("Accessibility verification","Test the chosen solution with automated and manual coverage",l("axe-core","manual testing","VoiceOver Safari","NVDA Chrome"),l("accessibility audit","screen-reader matrix","keyboard test","CI assertions"))),
        q(2395,
          c("Leak evidence and baseline","Measure and identify the retained-memory behavior",l("heap snapshots","50MB","detached DOM","retained references"),l("memory profile","growth per hour","allocation trace","baseline heap")),
          c("Alternative solutions","Present two implementable cleanup strategies",l("manual cleanup","WeakMap","WeakSet","lifecycle hooks"),l("explicit teardown","garbage collection friendly storage","destroy method","removeEventListener")),
          c("Trade-off analysis","Compare control, maintainability, observability, and limitations",l("precise control","maintenance risk","unable to iterate","developer oversight"),l("explicit lifecycle","automatic garbage collection","inspection limitation","regression risk")),
          c("Justified correction","Choose and implement a solution appropriate to reference ownership",l("chose WeakMap","automated ESLint","cleanup listeners","key-bound cache"),l("hybrid solution","lifecycle cleanup","weak references","ownership rule")),
          c("Measured verification","Demonstrate bounded memory and removal of detached nodes",l("500 navigation loops","heap remained bounded","returned to baseline","zero detached DOM"),l("Puppeteer soak test","usedJSHeapSize","forced GC","retention check")))
    );}
    private QuestionSeed q(long id,CriterionSeed...criteria){return new QuestionSeed(id,List.of(criteria));}private CriterionSeed c(String n,String d,List<String>t,List<String>a){return new CriterionSeed(n,d,t,a);}private List<String>l(String...v){return List.of(v);}private record QuestionSeed(long questionId,List<CriterionSeed>criteria){}private record CriterionSeed(String name,String description,List<String>terms,List<String>alternatives){}
}
