import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const shared=JSON.parse(readFileSync(resolve('src/main/resources/data/shared-questions-reviewed.json'),'utf8'))
const company=JSON.parse(readFileSync(resolve('src/main/resources/data/company-specific-questions-900.json'),'utf8'))
const pilot=JSON.parse(readFileSync(resolve('src/main/resources/data/pilot-questions.json'),'utf8'))
const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const pilotPrompts=new Set(pilot.map(q=>norm(q.prompt)))
const stop=new Set('about after against along also and another any apply are around because been before being between both can candidate company concrete context could data define describe design each either enough especially evidence explain explicit for from full give given good handle has have how identify implementation include including into its itself main make may more must need needs one only other over provide question rather relevant response role same should show specific state such system than that the their them then there these they this through under use used using very what when where which while who why will with would your'.split(' '))
const words=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w))

const all=[...shared,...company]
const frequency=new Map()
for(const q of all){for(const token of new Set(words(`${q.expectedAnswerSummary} ${q.rubrics.map(r=>r.keywords||'').join(' ')}`)))frequency.set(token,(frequency.get(token)||0)+1)}
const focus=q=>[...new Set(words(`${q.topic} ${q.expectedAnswerSummary} ${q.rubrics.map(r=>r.keywords||'').join(' ')}`))]
  .sort((a,b)=>(frequency.get(a)||0)-(frequency.get(b)||0)||b.length-a.length).slice(0,9)

const openings={
 Technical:[
  (q,c)=>`${c}Diagnose a measured ${q.topic} regression from its first signal through verified recovery`,
  (q,c)=>`${c}Review a ${q.topic} implementation that breaks under load and propose a safer correction`,
  (q,c)=>`${c}Investigate an intermittent ${q.topic} production defect using falsifiable hypotheses`,
  (q,c)=>`${c}Compare two implementable ${q.topic} solutions and choose using measured trade-offs`,
  (q,c)=>`${c}A ${q.topic} rollout failed its release gate; determine mitigation and prevention`,
  (q,c)=>`${c}Explain a realistic ${q.topic} failure mechanism and validate a robust fix`,
 ],
 Behavioral:[
  (q,c)=>`${c}Tell me about one real experience where ${q.topic} materially changed your technical decision`,
  (q,c)=>`${c}Describe a difficult situation involving ${q.topic} where your first approach was incomplete`,
  (q,c)=>`${c}Give a specific example of using ${q.topic} to resolve disagreement or uncertainty`,
  (q,c)=>`${c}Tell me about an outcome involving ${q.topic} that required personal ownership beyond your assigned task`,
  (q,c)=>`${c}Describe a time when ${q.topic} forced you to choose between competing goals`,
  (q,c)=>`${c}Give an example where your judgment about ${q.topic} produced a measurable and lasting change`,
 ],
 'System Design':[
  (q,c)=>`${c}Design a new ${q.topic} from quantified requirements through production operation`,
  (q,c)=>`${c}Redesign and migrate a fragile ${q.topic} without a disruptive cutover`,
  (q,c)=>`${c}Design a multi-region ${q.topic} and explain correctness during partial failure`,
  (q,c)=>`${c}Design a secure and cost-aware ${q.topic} with explicit capacity estimates`,
  (q,c)=>`${c}Evolve a single-region ${q.topic} into a resilient global architecture`,
  (q,c)=>`${c}Design a ${q.topic} that remains observable and recoverable during overload`,
 ],
}
const companyLens={
 Google:'Account for planet-scale traffic, SRE error budgets, and data-driven launches',
 Microsoft:'Account for enterprise tenants, Azure operations, backward compatibility, and accessibility',
 Amazon:'Account for customer impact, written trade-offs, operational ownership, and AWS-scale demand',
 Apple:'Account for privacy, device constraints, ecosystem integration, and user-perceived quality',
 Meta:'Account for social-graph scale, rapid experimentation, integrity, and real-time interaction',
}
const sharedLens=[
 'Use one explicit production constraint and one counterexample',
 'State the invariant that makes the solution correct',
 'Tie the decision to a measurable acceptance threshold',
 'Include a failure injection that could disprove the approach',
 'Distinguish immediate containment from the durable correction',
 'Name the assumption most likely to invalidate the result',
]
const roleLens={
 'Software Engineer':'Use algorithmic invariants, API contracts, concurrency behavior, and maintainable code boundaries',
 'Frontend Developer':'Use browser rendering, accessibility semantics, client state, and interaction performance',
 'Backend Developer':'Use transactional boundaries, queue semantics, storage indexes, and dependency isolation',
 'Full-Stack Developer':'Use UI-to-API contracts, end-to-end tracing, schema evolution, and deployment coordination',
 'Mobile Developer':'Use offline synchronization, battery limits, lifecycle transitions, and device fragmentation',
 'Cloud / DevOps Engineer':'Use infrastructure automation, release safety, service telemetry, and regional recovery',
 'Data Scientist':'Use statistical assumptions, experiment validity, cohort analysis, and reproducible data quality controls',
 'ML / AI Engineer':'Use feature provenance, evaluation slices, model drift, and serving safeguards',
 'QA / Test Engineer':'Use risk-based coverage, deterministic test oracles, environment control, and defect isolation',
 'Cybersecurity Analyst':'Use threat modeling, identity boundaries, forensic evidence, and containment strategy',
}
const scenarioLens=[
 'Evaluate a sudden tenfold read surge with one hot partition',
 'Evaluate a partial regional outage during a schema transition',
 'Evaluate duplicated events arriving out of order after reconnection',
 'Evaluate a compromised credential alongside incomplete audit logs',
 'Evaluate a strict latency target during downstream saturation',
 'Evaluate rollback after incompatible clients have already updated',
 'Evaluate corrupted cached state while the source remains healthy',
 'Evaluate a privacy deletion request during active replication',
 'Evaluate noisy telemetry that hides a slowly growing failure rate',
 'Evaluate capacity exhaustion during an unplanned traffic shift',
 'Evaluate clock skew and retry storms across dependent services',
 'Evaluate an experiment whose aggregate metric masks cohort harm',
]
const decisionLens=[
 'Prove the result with cohort-level acceptance metrics',
 'Preserve compatibility for two independently deployed versions',
 'Bound recovery by a documented service-level objective',
 'Protect sensitive fields through collection, storage, and deletion',
 'Demonstrate correctness under replay and repeated execution',
 'Keep the degraded path useful when a critical dependency is unavailable',
 'Explain the cost ceiling and the capacity signal that triggers scaling',
 'Show how operators distinguish symptoms from the initiating fault',
 'Define an abort condition before rollout begins',
 'Reconcile conflicting stakeholder goals with a recorded decision rule',
 'Validate the smallest risky assumption before committing the full design',
 'Prevent a locally successful change from shifting harm downstream',
]
const lifecycleLens=[
 'Assume this is a greenfield decision before any user traffic',
 'Assume the service is mature and cannot pause writes',
 'Assume a regulated customer requires independently auditable evidence',
 'Assume the team must migrate incrementally with a small on-call rotation',
 'Assume the issue appears only in one geography and one client cohort',
 'Assume the next release must reduce both operational toil and cloud cost',
 'Assume the evidence conflicts across logs, traces, and customer reports',
 'Assume an external dependency owner cannot change their contract',
 'Assume historical data is incomplete and cannot be reconstructed',
 'Assume the proposed change will be evaluated by an adversarial review',
 'Assume success must remain measurable for one quarter after launch',
]

let revised=0
for(let index=0;index<all.length;index++){
 const q=all[index]
 if(pilotPrompts.has(norm(q.prompt)))continue
 revised++
 q.legacyPrompt=q.prompt
 const context=q.company?`For ${q.company}, as a ${q.role}: `:`As a ${q.role}: `
 const required=focus(q)
 const lens=q.company?companyLens[q.company]:sharedLens[index%sharedLens.length]
 const specialization=roleLens[q.role]
 const scenario=scenarioLens[index%scenarioLens.length]
 const decision=decisionLens[Math.floor(index/scenarioLens.length)%decisionLens.length]
 const lifecycle=lifecycleLens[Math.floor(index/(scenarioLens.length*decisionLens.length))%lifecycleLens.length]
 const instruction=q.type==='Technical'
  ? `${lens}. ${specialization}. ${scenario}. ${decision}. ${lifecycle}. Ground the diagnosis in ${required.join(', ')}.`
  : q.type==='Behavioral'
    ? `${lens}. ${specialization}. Frame the example around this constraint: ${scenario}; ${decision.toLowerCase()}; ${lifecycle.toLowerCase()}. Separate your own decision and measurable result; address ${required.join(', ')}.`
    : `${lens}. ${specialization}. ${scenario}. ${decision}. ${lifecycle}. Answer in text with capacity, failure recovery, and trade-offs centered on ${required.join(', ')}.`
 q.prompt=`${openings[q.type][index%6](q,context)}. ${instruction}`
 const sentences=q.expectedAnswerSummary.match(/[^.!?]+[.!?]+/g)||[q.expectedAnswerSummary]
 q.rubrics=q.rubrics.map((r,i)=>{
   const answer=(sentences[i]||sentences.at(-1)).trim()
   const contextLabel=`${q.company||'shared pool'} / ${q.role} / ${q.type} / ${q.topic}`
   return {...r,
    description:`Scores ${r.name.toLowerCase()} for ${contextLabel}; assess the stated evidence, not vocabulary matching alone.`,
    expectedEvidence:`Full credit: ${answer} The response must connect this evidence specifically to ${contextLabel}. Partial credit: identifies the right area but omits mechanism, consequence, or verification. No credit: gives only generic claims or irrelevant details.`,
    acceptableAlternatives:`Accept a technically valid alternative when assumptions are stated and its trade-offs satisfy the same ${r.name.toLowerCase()} objective.`,
   }
 })
}
if(revised!==1450)throw new Error(`Expected 1450 revisions while preserving pilot 50, got ${revised}`)
const combinedPrompts=all.map(q=>norm(q.prompt))
if(new Set(combinedPrompts).size!==1500)throw new Error('Exact duplicate prompts after combined revision')
if(new Set(all.map(q=>q.expectedAnswerSummary.trim())).size!==1500)throw new Error('Duplicate expected answers')
const evidence=all.flatMap(q=>q.rubrics.map(r=>r.expectedEvidence.trim()))
if(new Set(evidence).size!==7500)throw new Error('Duplicate rubric evidence')
if(all.some(q=>q.rubrics.length!==5||q.rubrics.reduce((s,r)=>s+r.weight,0)!==100))throw new Error('Invalid rubric count or weight')
const revisedQuestions=all.filter(q=>!pilotPrompts.has(norm(q.prompt)))
if(revisedQuestions.some(q=>q.rubrics.some(r=>words(r.expectedEvidence).length<12)))throw new Error('A revised rubric is too generic')
const sharedFinal=all.slice(0,600),companyFinal=all.slice(600)
writeFileSync(resolve('src/main/resources/data/shared-questions-final.json'),`${JSON.stringify(sharedFinal,null,2)}\n`)
writeFileSync(resolve('src/main/resources/data/company-specific-questions-final.json'),`${JSON.stringify(companyFinal,null,2)}\n`)
console.log(`Revised ${revised}; preserved ${all.length-revised} pilot questions; validated ${all.length} questions and ${evidence.length} rubrics.`)
