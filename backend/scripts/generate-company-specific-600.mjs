import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const existing = JSON.parse(readFileSync(resolve('src/main/resources/data/company-specific-questions-300.json'), 'utf8'))
const companies = {
  Google: { lenses:['globally replicated infrastructure','privacy-aware data intelligence'], behaviors:['simplifying a complex technical decision','using evidence to resolve deep ambiguity'], contexts:['billions of daily operations','petabyte-scale data with regional controls'] },
  Microsoft: { lenses:['long-lived enterprise ecosystems','secure developer productivity'], behaviors:['creating clarity across organizational boundaries','turning customer feedback into platform improvement'], contexts:['thousands of isolated enterprise tenants','hybrid deployments with legacy compatibility'] },
  Amazon: { lenses:['cost-aware operational excellence','resilient autonomous services'], behaviors:['taking ownership beyond the immediate task','making a reversible decision with incomplete data'], contexts:['seasonal traffic with tenfold bursts','regional services with strict operational goals'] },
  Apple: { lenses:['on-device privacy and efficiency','seamless platform experience'], behaviors:['protecting product quality when schedule pressure increased','integrating details across hardware and software'], contexts:['hundreds of millions of personal devices','latency-sensitive services with minimal data collection'] },
  Meta: { lenses:['high-fanout real-time interaction','experiment-driven product evolution'], behaviors:['shipping quickly while containing measurable risk','changing direction after product evidence'], contexts:['billions of social graph updates','rapid experiments across diverse user segments'] },
}

const roles = {
  'Software Engineer': { topics:['distributed consistency boundaries','memory and throughput optimization'], systems:['globally replicated metadata service','stream-processing control plane'], signals:['consistency violations','allocation and throughput profiles'], methods:['invariant modeling','fault injection','comparative benchmarking'], risks:['split brain','unbounded resource growth','unsafe retry behavior'] },
  'Frontend Developer': { topics:['client caching and freshness','large-interface rendering efficiency'], systems:['edge-rendered application platform','accessible design-system delivery service'], signals:['stale-view reports','interaction latency and long tasks'], methods:['cache-policy tracing','render profiling','accessibility regression testing'], risks:['stale assets','main-thread blocking','assistive-technology regressions'] },
  'Backend Developer': { topics:['schema evolution under load','hot-key and cache behavior'], systems:['globally partitioned account service','exactly-once-effect payment workflow'], signals:['migration error rate','cache miss and key-skew metrics'], methods:['shadow reads','partition analysis','idempotency verification'], risks:['data loss','hot partitions','duplicate side effects'] },
  'Full-Stack Developer': { topics:['secure real-time collaboration','incremental application migration'], systems:['multi-tenant collaboration product','zero-downtime application modernization platform'], signals:['authorization denials and leaks','cross-version request failures'], methods:['end-to-end permission tracing','contract versioning','cohort rollout'], risks:['tenant data exposure','mixed-version corruption','client rollback gaps'] },
  'Data Scientist': { topics:['causal impact estimation','rare-event model evaluation'], systems:['causal experimentation service','governed metric-definition platform'], signals:['treatment-effect intervals','precision-recall by segment'], methods:['quasi-experimental checks','stratified evaluation','sensitivity analysis'], risks:['confounding','unstable rare-event estimates','metric inconsistency'] },
  'ML / AI Engineer': { topics:['retrieval quality and grounding','fairness across model slices'], systems:['grounded generation platform','responsible-model evaluation service'], signals:['retrieval recall and citation accuracy','quality gaps across protected slices'], methods:['hard-negative evaluation','groundedness scoring','slice-based threshold analysis'], risks:['hallucinated claims','representation harm','evaluation leakage'] },
  'Cloud / DevOps Engineer': { topics:['capacity planning and autoscaling','software supply-chain integrity'], systems:['multi-cloud workload scheduler','signed artifact and provenance platform'], signals:['headroom and scaling lag','unsigned or vulnerable artifact events'], methods:['load modeling','policy enforcement','provenance verification'], risks:['capacity exhaustion','malicious artifacts','control-plane outage'] },
  'Mobile Developer': { topics:['cross-device state reconciliation','media performance on constrained devices'], systems:['cross-device continuity service','adaptive mobile media pipeline'], signals:['conflict and sync lag','frame drops and energy use'], methods:['version-vector analysis','device profiling','network-condition simulation'], risks:['lost offline edits','battery drain','corrupt partial downloads'] },
  'Cybersecurity Analyst': { topics:['cloud attack-path analysis','detection quality and alert fatigue'], systems:['attack-surface intelligence service','high-confidence detection engineering platform'], signals:['reachable privilege paths','precision recall and analyst queue time'], methods:['graph-based exposure analysis','rule replay','threat-informed tuning'], risks:['hidden privilege escalation','missed true positives','analyst overload'] },
  'QA / Test Engineer': { topics:['stateful workflow coverage','release risk prediction'], systems:['model-based workflow testing service','risk-weighted regression platform'], signals:['uncovered state transitions','escaped defects by change risk'], methods:['state-machine modeling','change-impact analysis','historical defect validation'], risks:['path explosion','biased risk scores','critical untested changes'] },
}

const levels=['Medium','Hard']
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const rubric=(order,name,description,evidence,alternatives,keywords)=>({order,name,description,expectedEvidence:evidence,acceptableAlternatives:alternatives,keywords,weight:20})
const added=[]

for(const [company,cp] of Object.entries(companies)) for(const [role,rp] of Object.entries(roles)) {
  for(let v=0;v<2;v++){
    const topic=rp.topics[v], lens=cp.lenses[v], signal=rp.signals[v]
    const prompt=v===0
      ? `${company} observes ${signal} after scaling a system that depends on ${topic}. As a ${role}, lead the investigation: quantify impact, form falsifiable hypotheses, isolate the mechanism, compare fixes, and define safe rollout and recovery evidence.`
      : `A ${company} architecture proposal uses ${topic} to support ${lens}, but its behavior under failure is uncertain. As a ${role}, challenge the proposal with concrete failure cases, evaluate two alternatives, and specify implementation and verification criteria.`
    const points=[
      `Measure ${signal}, affected scope, timing, and a stable baseline; correlate them with traffic, data, configuration, or deployment changes.`,
      `Use ${rp.methods.join(', ')} to test causal hypotheses about ${topic} and record evidence that rules alternatives in or out.`,
      `Compare two feasible corrections for ${company}'s ${lens}, covering correctness, latency, compatibility, operational complexity, and cost.`,
      `Address ${rp.risks.join(', ')}, define containment and rollback, and limit blast radius through a staged rollout.`,
      `Set a numeric recovery target for ${signal}; verify with role-appropriate tests, production telemetry, and a durable recurrence-prevention control.`,
    ]
    added.push({company,role,type:'Technical',topic,difficulty:levels[v],sourceType:'COMPANY_SPECIFIC',prompt,legacyPrompt:null,isOriginalPilot:false,expectedAnswerSummary:points.join(' '),rubrics:[
      rubric(1,'Impact and baseline',`Scores measurable framing of ${topic} at ${company}.`,points[0],'Equivalent signals are acceptable if they establish scope and timing.',`${company},${role},${topic},${signal},baseline`),
      rubric(2,'Falsifiable diagnosis',`Scores causal investigation rather than guesswork.`,points[1],'Another systematic method is acceptable when it can disprove hypotheses.',`${company},${topic},${rp.methods.join(',')}`),
      rubric(3,'Alternative comparison',`Scores technical judgment in the ${lens} context.`,points[2],'Different solutions receive credit when consequences are explicit.',`${company},${lens},correctness,latency,compatibility,cost`),
      rubric(4,'Failure containment',`Scores handling of realistic adverse conditions.`,points[3],'Equivalent blast-radius and rollback controls are acceptable.',`${company},${rp.risks.join(',')},rollback`),
      rubric(5,'Recovery proof',`Scores objective verification and prevention.`,points[4],'Comparable automated tests and release gates are acceptable.',`${company},${signal},telemetry,prevention`),
    ]})
  }

  for(let v=0;v<2;v++){
    const topic=cp.behaviors[v], artifact=`${rp.signals[v]} evidence from ${rp.methods[v]}`
    const prompt=v===0
      ? `Tell me about a ${role} decision where you demonstrated ${topic}, an important ${company} interview theme. Describe the initial disagreement, the evidence that changed the conversation, your personal action, the measured outcome, and the lasting mechanism you created.`
      : `As a ${role}, describe a time when ${topic} produced a better result than your original plan. For a ${company} interview, make your ownership, alternatives, stakeholder influence, quantitative impact, and later learning explicit.`
    const points=[
      `Present one specific ${role} situation with real constraints, affected people, and why ${topic} mattered.`,
      `Distinguish personal ownership from team work and cite ${artifact} used to make or influence the decision.`,
      `Explain competing options, stakeholder objections, and how evidence and respectful communication produced alignment.`,
      `Quantify improvement in user impact, quality, security, reliability, delivery time, adoption, or cost.`,
      `Name one mistake or limitation and show the later behavior, tool, or process change that made the learning durable.`,
    ]
    added.push({company,role,type:'Behavioral',topic,difficulty:levels[v],sourceType:'COMPANY_SPECIFIC',prompt,legacyPrompt:null,isOriginalPilot:false,expectedAnswerSummary:points.join(' '),rubrics:[
      rubric(1,'Specific stakes',`Scores relevance and specificity for ${company} and ${role}.`,points[0],'A different professional example is acceptable when concrete.',`${company},${role},${topic},constraints,stakes`),
      rubric(2,'Personal evidence',`Scores individual ownership supported by evidence.`,points[1],'Shared ownership is acceptable if personal decisions are clear.',`${company},${role},ownership,${artifact}`),
      rubric(3,'Influence and judgment',`Scores options, objections, and alignment.`,points[2],'Another decision process is acceptable when evidence-based.',`${company},${topic},options,stakeholders,alignment`),
      rubric(4,'Quantified result',`Scores credible impact attributable to the actions.`,points[3],'Observable qualitative impact is acceptable with verification.',`${company},${role},impact,quality,reliability,cost`),
      rubric(5,'Durable learning',`Scores honest reflection applied beyond the event.`,points[4],'A durable prevention mechanism may substitute for a later example.',`${company},${topic},learning,process change`),
    ]})
  }

  for(let v=0;v<2;v++){
    const topic=rp.systems[v], context=cp.contexts[v], lens=cp.lenses[v]
    const prompt=v===0
      ? `${company} needs a ${topic} for ${context}. As a ${role}, write a complete text-only design: quantify workload and SLOs, define APIs and ownership, model and partition state, trace critical flows, estimate capacity, and cover security, failure recovery, observability, and trade-offs.`
      : `${company} must replace a fragile ${topic} while serving ${context}. As a ${role}, provide a text-only architecture and phased migration that addresses compatibility, data movement and validation, dual-operation risks, regional failure, security, rollback, and measurable completion criteria.`
    const points=[
      `Quantify operations, throughput, latency, availability, consistency, retention, sensitivity, and cost constraints for ${context}.`,
      `Define external and internal interfaces plus ownership for clients or ingestion, control logic, durable storage, asynchronous processing, and telemetry.`,
      `Specify the ${topic} data model, partition key, read/write flow, cache or batch strategy, and correctness for concurrency, retries, and ordering.`,
      `Handle ${rp.risks.join(', ')}, dependency and regional outages, authentication, authorization, encryption, recovery objectives, and graceful degradation.`,
      `Estimate the dominant bottleneck, justify consistency and availability decisions for ${company}'s ${lens}, and define alerts, rollout gates, rollback, and success metrics.`,
    ]
    added.push({company,role,type:'System Design',topic,difficulty:levels[v],sourceType:'COMPANY_SPECIFIC',prompt,legacyPrompt:null,isOriginalPilot:false,expectedAnswerSummary:points.join(' '),rubrics:[
      rubric(1,'Workload and SLOs',`Scores quantified requirements for ${context}.`,points[0],'Different assumptions are acceptable when internally consistent.',`${company},${topic},${context},SLO,throughput,latency`),
      rubric(2,'Interfaces and ownership',`Scores coherent component boundaries.`,points[1],'Alternative boundaries are acceptable when coupling is justified.',`${company},${role},${topic},API,ownership,telemetry`),
      rubric(3,'State and correctness',`Scores data modeling and critical request flows.`,points[2],'Alternative data stores are acceptable with access-pattern reasoning.',`${company},${topic},partition,retry,ordering,concurrency`),
      rubric(4,'Security and recovery',`Scores protection and credible failure handling.`,points[3],'Comparable controls are acceptable with explicit coverage.',`${company},${rp.risks.join(',')},encryption,recovery`),
      rubric(5,'Capacity and evolution',`Scores quantitative trade-offs and safe operation.`,points[4],'Different trade-offs are acceptable when tied to requirements.',`${company},${lens},capacity,rollout,rollback,metrics`),
    ]})
  }
}

for(const q of added) q.rubrics=q.rubrics.map(r=>({...r,expectedEvidence:`${r.expectedEvidence} Evaluate specifically for ${q.company}, ${q.role}, ${q.type}, and ${q.topic}.`}))
const questions=[...existing,...added]
if(existing.length!==300||added.length!==300||questions.length!==600)throw new Error('Expected 300 existing plus 300 new questions')
const combinations=Object.groupBy(questions,q=>`${q.company}|${q.role}|${q.type}`)
if(Object.keys(combinations).length!==150||Object.values(combinations).some(items=>items.length!==4))throw new Error('Every company/role/type combination requires four questions')
if(new Set(questions.map(q=>normalize(q.prompt))).size!==600)throw new Error('Duplicate prompts')
if(new Set(questions.map(q=>q.expectedAnswerSummary)).size!==600)throw new Error('Duplicate expected answers')
const evidence=questions.flatMap(q=>q.rubrics.map(r=>r.expectedEvidence))
if(new Set(evidence).size!==3000)throw new Error('Duplicate rubric evidence')
if(questions.filter(q=>q.isOriginalPilot).length!==12)throw new Error('Original Google 12 were not preserved')
writeFileSync(resolve('src/main/resources/data/company-specific-questions-600.json'),`${JSON.stringify(questions,null,2)}\n`)
console.log(`Wrote ${questions.length} company-specific questions and ${evidence.length} rubrics; added and reviewed ${added.length}.`)
