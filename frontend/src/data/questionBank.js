import { generateCompanyQuestionSeeds } from './companyQuestionSeeds.js'

const concept = (label, keywords, guidance, weight = 20) => ({ label, keywords, guidance, weight })

const CORE_QUESTION_BANK = [
  {
    id: 'tech-array-linked-list', type: 'Technical', topic: 'Data Structures', difficulty: 'Easy',
    prompt: 'Compare an array with a linked list. When would you choose one over the other?',
    tips: ['Compare memory layout and access.', 'Discuss insertion and deletion.', 'Give a practical use case.'],
    model: ['Arrays use contiguous memory and provide O(1) indexed access.', 'Linked lists use nodes and pointers and require O(n) traversal.', 'Choose based on access patterns, mutation frequency, and memory overhead.'],
    concepts: [
      concept('Array memory layout', ['contiguous memory', 'adjacent memory', 'continuous memory'], 'Explain that array elements are stored contiguously.'),
      concept('Array access complexity', ['o(1) access', 'constant time access', 'random access'], 'State that indexed array access is O(1).'),
      concept('Linked-list structure', ['node and pointer', 'nodes and pointers', 'next pointer', 'linked nodes'], 'Describe nodes connected through pointers.'),
      concept('Linked-list traversal', ['o(n) traversal', 'linear traversal', 'sequential access'], 'Mention that locating an arbitrary element requires traversal.'),
      concept('Selection trade-off', ['use array', 'choose array', 'use linked list', 'choose linked list', 'trade-off'], 'Give a concrete situation where each structure is preferable.'),
    ],
  },
  {
    id: 'tech-hash-collisions', type: 'Technical', topic: 'Data Structures', difficulty: 'Medium',
    prompt: 'How does a hash map handle collisions, and what affects its performance?',
    tips: ['Define a collision.', 'Compare collision strategies.', 'Mention load factor and resizing.'],
    model: ['A collision occurs when keys map to the same bucket.', 'Chaining and open addressing are common strategies.', 'Load factor, hash quality, and resizing affect performance.'],
    concepts: [
      concept('Collision definition', ['same bucket', 'same index', 'same hash', 'collision occurs'], 'Define a collision as multiple keys mapping to the same bucket.'),
      concept('Chaining', ['chaining', 'linked list in bucket', 'bucket list'], 'Explain separate chaining.'),
      concept('Open addressing', ['open addressing', 'linear probing', 'quadratic probing', 'double hashing'], 'Contrast chaining with an open-addressing strategy.'),
      concept('Load factor', ['load factor', 'capacity ratio'], 'Explain how load factor influences collision frequency.'),
      concept('Resize and complexity', ['resize', 'rehash', 'o(1) average', 'o(n) worst'], 'Mention rehashing and average versus worst-case complexity.'),
    ],
  },
  {
    id: 'tech-process-thread', type: 'Technical', topic: 'Operating Systems', difficulty: 'Easy',
    prompt: 'What is the difference between a process and a thread?',
    tips: ['Compare memory isolation.', 'Discuss creation and switching costs.', 'Mention synchronization.'],
    model: ['Processes have isolated address spaces.', 'Threads share process memory and resources.', 'Threads are lighter but introduce synchronization risks.'],
    concepts: [
      concept('Process isolation', ['separate memory', 'isolated memory', 'own address space'], 'State that processes have isolated address spaces.'),
      concept('Shared thread memory', ['threads share memory', 'shared memory', 'same address space'], 'Explain that threads share their process memory.'),
      concept('Creation cost', ['threads are lighter', 'process is heavier', 'cheaper to create'], 'Compare creation overhead.'),
      concept('Context switching', ['context switch', 'switching cost'], 'Discuss context-switching cost.'),
      concept('Concurrency risk', ['race condition', 'synchronization', 'mutex', 'deadlock'], 'Mention synchronization or race-condition risks.'),
    ],
  },
  {
    id: 'tech-slow-api', type: 'Technical', topic: 'Debugging', difficulty: 'Medium',
    prompt: 'A production API suddenly becomes slow. How would you investigate and resolve the problem?',
    tips: ['Measure before changing anything.', 'Isolate application, database, and infrastructure causes.', 'Validate and monitor the fix.'],
    model: ['Confirm the regression using latency percentiles and traces.', 'Inspect recent changes, dependencies, database queries, and resources.', 'Mitigate, validate, monitor, and document the root cause.'],
    concepts: [
      concept('Measure the regression', ['latency', 'p95', 'p99', 'metrics', 'baseline'], 'Start with latency metrics and a known baseline.'),
      concept('Logs and tracing', ['logs', 'trace', 'tracing', 'apm'], 'Use logs and distributed tracing to locate the slow component.'),
      concept('Database investigation', ['slow query', 'database', 'query plan', 'index'], 'Inspect database queries, plans, and indexes.'),
      concept('Resource and dependency checks', ['cpu', 'memory', 'network', 'dependency', 'downstream'], 'Check resources and downstream dependencies.'),
      concept('Mitigation and verification', ['rollback', 'cache', 'verify', 'monitor', 'root cause'], 'Explain mitigation, verification, and continued monitoring.'),
    ],
  },
  {
    id: 'tech-database-index', type: 'Technical', topic: 'Databases', difficulty: 'Medium',
    prompt: 'How does a database index improve query performance, and when can an index hurt performance?',
    tips: ['Explain the lookup structure.', 'Cover read and write trade-offs.', 'Mention query plans.'],
    model: ['Indexes reduce scanned rows using structures such as B-trees.', 'They consume storage and add write-maintenance cost.', 'Useful indexes reflect real query predicates and are verified with query plans.'],
    concepts: [
      concept('Index lookup structure', ['b-tree', 'btree', 'lookup structure', 'sorted structure'], 'Describe an index structure such as a B-tree.'),
      concept('Reduced scanning', ['avoid full table scan', 'fewer rows', 'faster lookup'], 'Explain how indexes reduce row scanning.'),
      concept('Write overhead', ['slower writes', 'insert cost', 'update cost', 'maintain index'], 'Mention insert and update overhead.'),
      concept('Storage cost', ['extra storage', 'disk space', 'memory cost'], 'Mention the additional storage cost.'),
      concept('Query-plan validation', ['explain plan', 'query plan', 'selectivity', 'composite index'], 'Discuss selectivity or validating with a query plan.'),
    ],
  },
  {
    id: 'behavior-conflict', type: 'Behavioral', topic: 'Collaboration', difficulty: 'Medium',
    prompt: 'Tell me about a time you disagreed with a teammate. How did you handle the situation?',
    tips: ['Use STAR.', 'Show how you listened.', 'Explain the result and lesson.'],
    model: ['Briefly establish the disagreement and your responsibility.', 'Describe listening, evidence, and the decision process.', 'Close with the outcome and what you learned.'],
    concepts: [
      concept('Situation', ['situation', 'context', 'we were working', 'the project'], 'Set the context briefly.'),
      concept('Personal responsibility', ['my responsibility', 'my task', 'i needed to', 'i was responsible'], 'Clarify your personal responsibility.'),
      concept('Constructive action', ['i listened', 'one-on-one', 'discussed', 'data', 'evidence'], 'Describe the specific constructive action you took.'),
      concept('Result', ['result', 'outcome', 'we delivered', 'improved', 'resolved'], 'State the outcome.'),
      concept('Learning', ['i learned', 'next time', 'lesson', 'since then'], 'Explain what you learned or changed afterward.'),
    ],
  },
  {
    id: 'behavior-bug', type: 'Behavioral', topic: 'Problem Solving', difficulty: 'Easy',
    prompt: 'Describe a challenging bug you fixed and how you approached it.',
    tips: ['Explain why it was difficult.', 'Describe your diagnostic steps.', 'Quantify the result when possible.'],
    model: ['State the user or business impact.', 'Walk through reproduction, isolation, correction, and testing.', 'Report the result and preventive action.'],
    concepts: [
      concept('Problem context', ['bug', 'failure', 'crash', 'incorrect', 'issue'], 'Explain the bug and its impact.'),
      concept('Reproduction', ['reproduce', 'replicated', 'test case'], 'Describe how you reproduced the issue.'),
      concept('Diagnosis', ['logs', 'debugger', 'trace', 'isolated', 'root cause'], 'Explain the diagnostic process.'),
      concept('Fix and verification', ['fixed', 'test', 'verified', 'validation'], 'Describe both the fix and how you verified it.'),
      concept('Prevention or impact', ['monitoring', 'regression test', 'prevent', 'reduced', 'zero'], 'Include measurable impact or a prevention step.'),
    ],
  },
  {
    id: 'behavior-deadline', type: 'Behavioral', topic: 'Prioritization', difficulty: 'Medium',
    prompt: 'Tell me about a time you had to deliver under a difficult deadline.',
    tips: ['Explain the constraint.', 'Show prioritization and communication.', 'Share the outcome.'],
    model: ['Define the deadline and stakes.', 'Explain scope, prioritization, risks, and communication.', 'State the delivery result and lesson.'],
    concepts: [
      concept('Deadline context', ['deadline', 'time constraint', 'urgent', 'limited time'], 'Describe why the deadline was difficult.'),
      concept('Prioritization', ['prioritized', 'priority', 'must-have', 'scope'], 'Explain how you prioritized the work.'),
      concept('Planning', ['plan', 'milestone', 'estimate', 'broke down'], 'Describe your plan or milestones.'),
      concept('Communication', ['communicated', 'stakeholder', 'team', 'risk'], 'Show how you communicated progress and risk.'),
      concept('Outcome and learning', ['delivered', 'result', 'outcome', 'learned'], 'State the result and lesson.'),
    ],
  },
  {
    id: 'behavior-feedback', type: 'Behavioral', topic: 'Growth', difficulty: 'Easy',
    prompt: 'Describe a piece of difficult feedback you received and what you did with it.',
    tips: ['Be specific and accountable.', 'Describe changed behavior.', 'Show evidence of improvement.'],
    model: ['State the feedback without becoming defensive.', 'Explain the action plan and changed behavior.', 'Give evidence of improvement.'],
    concepts: [
      concept('Specific feedback', ['feedback', 'told me', 'review'], 'State the actual feedback clearly.'),
      concept('Ownership', ['i realized', 'i accepted', 'accountable', 'responsibility'], 'Show ownership rather than blame.'),
      concept('Action plan', ['action plan', 'i started', 'i changed', 'practice'], 'Describe the steps you took.'),
      concept('Follow-up', ['followed up', 'asked again', 'check-in', 'mentor'], 'Mention how you sought follow-up feedback.'),
      concept('Improvement', ['improved', 'result', 'better', 'since then'], 'Provide evidence of improvement.'),
    ],
  },
  {
    id: 'behavior-failure', type: 'Behavioral', topic: 'Ownership', difficulty: 'Hard',
    prompt: 'Tell me about a project that did not go as planned. What did you do?',
    tips: ['Own your contribution.', 'Describe recovery actions.', 'Explain the lasting lesson.'],
    model: ['Explain the original goal and what failed.', 'Own your decisions and describe recovery.', 'Close with the resulting process improvement.'],
    concepts: [
      concept('Goal and failure', ['goal', 'planned', 'failed', 'went wrong'], 'Describe the goal and what did not go as planned.'),
      concept('Ownership', ['my mistake', 'i owned', 'responsibility', 'i should have'], 'Own your contribution to the outcome.'),
      concept('Recovery action', ['recovered', 'fixed', 'adjusted', 'escalated', 'new plan'], 'Describe the recovery action.'),
      concept('Stakeholder communication', ['stakeholder', 'communicated', 'team', 'customer'], 'Explain how you communicated the problem.'),
      concept('Lasting lesson', ['learned', 'retrospective', 'process', 'prevent'], 'Describe a lasting improvement.'),
    ],
  },
  {
    id: 'design-rate-limiter', type: 'System Design', topic: 'Distributed Systems', difficulty: 'Medium',
    prompt: 'Design a rate limiter for a public API. What data structures and trade-offs would you consider?',
    tips: ['Clarify requirements.', 'Choose and justify an algorithm.', 'Cover distributed operation and failure.'],
    model: ['Clarify identity, limits, burst behavior, and scale.', 'Compare fixed window, sliding window, and token bucket.', 'Use shared atomic storage and discuss availability, monitoring, and failure policy.'],
    concepts: [
      concept('Requirements', ['requests per second', 'per user', 'api key', 'burst', 'requirements'], 'Clarify the limit scope and burst behavior.'),
      concept('Algorithm', ['token bucket', 'leaky bucket', 'sliding window', 'fixed window'], 'Choose and explain a rate-limiting algorithm.'),
      concept('Shared state', ['redis', 'shared store', 'distributed cache', 'atomic'], 'Explain distributed counter storage and atomic updates.'),
      concept('Scale and consistency', ['horizontal scale', 'consistent', 'multi-region', 'shard'], 'Discuss scaling and consistency.'),
      concept('Failure and observability', ['fail open', 'fail closed', 'monitor', 'metrics', 'unavailable'], 'Cover failure policy and monitoring.'),
    ],
  },
  {
    id: 'design-url-shortener', type: 'System Design', topic: 'Web Systems', difficulty: 'Medium',
    prompt: 'Design a URL shortening service similar to Bitly.',
    tips: ['Estimate scale.', 'Design IDs and storage.', 'Discuss caching and abuse.'],
    model: ['Define create and redirect APIs.', 'Generate collision-safe short IDs and store mappings.', 'Cache popular links and cover expiry, analytics, and abuse prevention.'],
    concepts: [
      concept('API design', ['create api', 'redirect', 'http 301', 'http 302', 'endpoint'], 'Define creation and redirect endpoints.'),
      concept('Short-code generation', ['base62', 'random id', 'unique id', 'collision'], 'Explain short-code generation and collision handling.'),
      concept('Data model', ['url mapping', 'database', 'short code', 'long url'], 'Describe the mapping data model.'),
      concept('Caching and scale', ['cache', 'redis', 'cdn', 'read heavy', 'partition'], 'Explain caching and read scaling.'),
      concept('Reliability and abuse', ['expiry', 'spam', 'malicious', 'rate limit', 'replica'], 'Cover reliability, expiration, or abuse prevention.'),
    ],
  },
  {
    id: 'design-notifications', type: 'System Design', topic: 'Messaging', difficulty: 'Hard',
    prompt: 'Design a notification service that supports email, SMS, and push notifications.',
    tips: ['Separate channels.', 'Use asynchronous delivery.', 'Cover retries, preferences, and observability.'],
    model: ['Accept notification requests through a validated API.', 'Fan out through durable queues to channel workers.', 'Handle preferences, idempotency, retries, dead letters, and delivery tracking.'],
    concepts: [
      concept('Request and template model', ['notification api', 'template', 'payload', 'endpoint'], 'Define the request and template model.'),
      concept('Asynchronous queues', ['queue', 'kafka', 'rabbitmq', 'asynchronous'], 'Use durable asynchronous processing.'),
      concept('Channel workers', ['email worker', 'sms worker', 'push worker', 'provider'], 'Separate channel-specific delivery workers.'),
      concept('Reliability', ['retry', 'dead letter', 'idempotent', 'duplicate'], 'Cover retry, dead-letter, and idempotency behavior.'),
      concept('Preferences and tracking', ['preference', 'opt out', 'delivery status', 'metrics'], 'Include user preferences and delivery observability.'),
    ],
  },
  {
    id: 'design-chat', type: 'System Design', topic: 'Realtime Systems', difficulty: 'Hard',
    prompt: 'Design a real-time chat service for direct and group conversations.',
    tips: ['Cover persistent connections.', 'Explain ordering and storage.', 'Discuss offline delivery.'],
    model: ['Use WebSocket gateways for persistent connections.', 'Route messages through durable messaging and conversation partitions.', 'Persist history and manage ordering, presence, retries, and offline notifications.'],
    concepts: [
      concept('Realtime connection', ['websocket', 'persistent connection', 'long polling'], 'Explain the realtime client connection.'),
      concept('Message routing', ['message broker', 'queue', 'kafka', 'pub sub'], 'Describe scalable message routing.'),
      concept('Storage model', ['conversation id', 'message store', 'database', 'partition'], 'Define message storage and partitioning.'),
      concept('Ordering and delivery', ['ordering', 'sequence number', 'acknowledgement', 'at least once'], 'Discuss ordering and delivery guarantees.'),
      concept('Presence and offline users', ['presence', 'online status', 'offline', 'push notification'], 'Cover presence and offline delivery.'),
    ],
  },
  {
    id: 'design-file-storage', type: 'System Design', topic: 'Storage', difficulty: 'Hard',
    prompt: 'Design a cloud file-storage and synchronization service.',
    tips: ['Separate metadata from file content.', 'Explain chunking and synchronization.', 'Cover durability and conflicts.'],
    model: ['Store file bytes in durable object storage and metadata separately.', 'Upload chunks with resumability and content hashing.', 'Synchronize through versioning, notifications, conflict handling, and replicated storage.'],
    concepts: [
      concept('Object and metadata separation', ['object storage', 'blob storage', 'metadata database', 'separate metadata'], 'Separate binary objects from metadata.'),
      concept('Chunked upload', ['chunk', 'multipart', 'resumable upload'], 'Explain chunked or resumable uploads.'),
      concept('Synchronization', ['sync', 'change log', 'notification', 'delta'], 'Describe how clients discover and apply changes.'),
      concept('Versioning and conflict', ['version', 'conflict', 'optimistic locking'], 'Cover concurrent edits and versioning.'),
      concept('Durability and security', ['replication', 'backup', 'encryption', 'access control'], 'Discuss durability and access security.'),
    ],
  },
]

const roleQuestion = (id, role, company, type, topic, difficulty, prompt, rubrics) => ({
  id, role, company, type, topic, difficulty, prompt,
  tips: type === 'Behavioral'
    ? ['Use a clear STAR structure.', 'Describe your personal actions.', 'Finish with the result and lesson.']
    : ['Explain your assumptions.', 'Describe the core approach.', 'Discuss trade-offs and verification.'],
  model: rubrics.map(([label]) => label),
  concepts: rubrics.map(([label, keywords]) => concept(label, keywords, `Cover ${label.toLowerCase()} clearly.`)),
})

const ROLE_QUESTIONS = [
  roleQuestion('fe-react-rendering', 'Frontend Developer', 'Meta', 'Technical', 'React', 'Medium', 'Explain how React renders and reconciles a component tree after state changes.', [
    ['State update', ['state update', 'setstate', 'setter']], ['Render phase', ['render phase', 'render function']], ['Virtual DOM', ['virtual dom', 'element tree']], ['Reconciliation', ['reconciliation', 'diffing']], ['Commit and effects', ['commit phase', 'useeffect', 'dom update']],
  ]),
  roleQuestion('fe-performance', 'Frontend Developer', 'Google', 'Technical', 'Web Performance', 'Hard', 'A large web page feels slow to users. How would you measure and improve its performance?', [
    ['User metrics', ['core web vitals', 'lcp', 'inp', 'cls']], ['Profiling', ['performance panel', 'profiler', 'trace']], ['Network optimization', ['code splitting', 'lazy loading', 'compression']], ['Rendering optimization', ['memoization', 'virtualization', 'reflow']], ['Verification', ['measure again', 'monitor', 'performance budget']],
  ]),
  roleQuestion('fe-accessibility', 'Frontend Developer', 'Microsoft', 'Technical', 'Accessibility', 'Medium', 'How would you make a custom modal dialog accessible?', [
    ['Semantic dialog', ['role dialog', 'aria-modal', 'dialog element']], ['Accessible name', ['aria-labelledby', 'accessible name', 'title']], ['Focus entry', ['move focus', 'initial focus']], ['Focus trap and escape', ['focus trap', 'escape key']], ['Focus restoration', ['restore focus', 'return focus']],
  ]),
  roleQuestion('be-idempotency', 'Backend Developer', 'Amazon', 'Technical', 'APIs', 'Medium', 'How would you make a payment API idempotent?', [
    ['Idempotency key', ['idempotency key', 'request key']], ['Persistent record', ['store key', 'database record']], ['Atomicity', ['transaction', 'atomic']], ['Duplicate response', ['return same response', 'cached response']], ['Expiry and conflicts', ['ttl', 'expiry', 'payload mismatch']],
  ]),
  roleQuestion('be-caching', 'Backend Developer', 'Microsoft', 'System Design', 'Caching', 'Hard', 'Design a caching strategy for a read-heavy content API.', [
    ['Cache placement', ['redis', 'cdn', 'cache aside']], ['Cache key', ['cache key', 'key design']], ['Invalidation', ['invalidate', 'ttl', 'expiration']], ['Stampede protection', ['cache stampede', 'single flight', 'locking']], ['Observability', ['hit rate', 'miss rate', 'metrics']],
  ]),
  roleQuestion('be-api-versioning', 'Backend Developer', 'Microsoft', 'Technical', 'API Design', 'Medium', 'How would you evolve a public API without breaking existing clients?', [
    ['Backward compatibility', ['backward compatible', 'non-breaking']], ['Version strategy', ['url version', 'header version', 'versioning']], ['Deprecation', ['deprecation', 'sunset']], ['Contract testing', ['contract test', 'schema test']], ['Communication', ['migration guide', 'changelog', 'notify clients']],
  ]),
  roleQuestion('fullstack-auth', 'Full-Stack Developer', 'Google', 'System Design', 'Authentication', 'Hard', 'Design authentication for a single-page application and API.', [
    ['Login flow', ['login', 'credential', 'oauth']], ['Token or session', ['access token', 'session cookie', 'jwt']], ['Secure storage', ['httponly', 'secure cookie', 'xss']], ['CSRF protection', ['csrf', 'same site', 'samesite']], ['Refresh and logout', ['refresh token', 'rotation', 'logout']],
  ]),
  roleQuestion('fullstack-data-flow', 'Full-Stack Developer', 'Meta', 'Technical', 'Architecture', 'Medium', 'Explain how data should flow from a React form to a backend database safely.', [
    ['Client validation', ['client validation', 'form validation']], ['API contract', ['api contract', 'request schema']], ['Server validation', ['server validation', 'sanitize']], ['Transaction', ['transaction', 'database write']], ['Error handling', ['error response', 'rollback', 'user feedback']],
  ]),
  roleQuestion('ds-experiment', 'Data Scientist', 'Google', 'Technical', 'Experimentation', 'Hard', 'How would you design and evaluate an A/B test for a recommendation feature?', [
    ['Hypothesis', ['hypothesis', 'expected effect']], ['Randomization', ['random assignment', 'randomization']], ['Primary metric', ['primary metric', 'success metric']], ['Statistical validity', ['sample size', 'significance', 'confidence interval']], ['Guardrails', ['guardrail metric', 'negative impact', 'segment']],
  ]),
  roleQuestion('ds-missing-data', 'Data Scientist', 'Amazon', 'Technical', 'Data Preparation', 'Medium', 'How would you investigate and handle missing values in a dataset?', [
    ['Missingness analysis', ['missing pattern', 'missing rate', 'mcar']], ['Root cause', ['data collection', 'source issue']], ['Imputation strategy', ['impute', 'median', 'model based']], ['Leakage avoidance', ['data leakage', 'train only']], ['Sensitivity check', ['sensitivity', 'compare results', 'validate']],
  ]),
  roleQuestion('ml-monitoring', 'ML / AI Engineer', 'Microsoft', 'System Design', 'ML Operations', 'Hard', 'Design monitoring for a machine-learning model in production.', [
    ['Service metrics', ['latency', 'error rate', 'throughput']], ['Data drift', ['data drift', 'feature drift']], ['Model quality', ['accuracy', 'precision', 'recall']], ['Feedback labels', ['ground truth', 'feedback loop', 'labels']], ['Response plan', ['alert', 'rollback', 'retrain']],
  ]),
  roleQuestion('ml-overfitting', 'ML / AI Engineer', 'Google', 'Technical', 'Machine Learning', 'Medium', 'How do you detect and reduce overfitting in a machine-learning model?', [
    ['Detection', ['training validation gap', 'validation loss']], ['Cross validation', ['cross validation', 'holdout']], ['Regularization', ['regularization', 'l1', 'l2']], ['Model complexity', ['simpler model', 'pruning', 'dropout']], ['More data', ['data augmentation', 'more data']],
  ]),
  roleQuestion('devops-deployment', 'Cloud / DevOps Engineer', 'Amazon', 'System Design', 'Deployment', 'Hard', 'Design a safe zero-downtime deployment process for a critical service.', [
    ['Deployment strategy', ['blue green', 'canary', 'rolling']], ['Health checks', ['health check', 'readiness']], ['Database compatibility', ['backward compatible migration', 'expand contract']], ['Observability', ['metrics', 'logs', 'alert']], ['Rollback', ['rollback', 'automatic rollback']],
  ]),
  roleQuestion('devops-incident', 'Cloud / DevOps Engineer', 'Amazon', 'Behavioral', 'Incident Response', 'Hard', 'Tell me about a production incident you helped resolve.', [
    ['Incident context', ['incident', 'outage', 'impact']], ['Triage', ['triage', 'severity', 'diagnose']], ['Communication', ['status update', 'stakeholder', 'incident channel']], ['Recovery', ['mitigation', 'recovery', 'rollback']], ['Prevention', ['postmortem', 'action item', 'prevent recurrence']],
  ]),
  roleQuestion('mobile-offline', 'Mobile Developer', 'Apple', 'System Design', 'Offline Data', 'Hard', 'Design offline synchronization for a mobile task application.', [
    ['Local storage', ['sqlite', 'local database', 'offline store']], ['Sync queue', ['operation queue', 'pending changes']], ['Conflict resolution', ['conflict resolution', 'version']], ['Connectivity recovery', ['reconnect', 'retry', 'backoff']], ['User state', ['sync status', 'error state', 'user feedback']],
  ]),
  roleQuestion('mobile-performance', 'Mobile Developer', 'Meta', 'Technical', 'Performance', 'Medium', 'How would you investigate excessive battery usage in a mobile application?', [
    ['Profiling', ['battery profiler', 'energy log', 'profiling']], ['Background work', ['background task', 'wake lock']], ['Network usage', ['network request', 'batching']], ['Location and sensors', ['gps', 'location', 'sensor']], ['Verification', ['device test', 'monitor', 'before and after']],
  ]),
  roleQuestion('security-api', 'Cybersecurity Analyst', 'Microsoft', 'Technical', 'Application Security', 'Hard', 'Review the security of a public REST API. What would you check first?', [
    ['Authentication', ['authentication', 'token validation']], ['Authorization', ['authorization', 'access control', 'idor']], ['Input validation', ['input validation', 'injection']], ['Rate limiting', ['rate limit', 'abuse']], ['Logging and secrets', ['audit log', 'secret management', 'sensitive data']],
  ]),
  roleQuestion('security-incident', 'Cybersecurity Analyst', 'Google', 'System Design', 'Incident Response', 'Hard', 'Design a response plan for suspected credential theft.', [
    ['Containment', ['disable account', 'revoke token', 'containment']], ['Evidence', ['logs', 'preserve evidence', 'timeline']], ['Scope', ['affected users', 'scope', 'lateral movement']], ['Recovery', ['reset credential', 'rotate secret', 'mfa']], ['Lessons learned', ['post incident', 'control improvement', 'monitoring']],
  ]),
  roleQuestion('qa-checkout', 'QA / Test Engineer', 'Amazon', 'Technical', 'Test Design', 'Medium', 'Create a test strategy for an e-commerce checkout flow.', [
    ['Happy path', ['successful checkout', 'happy path']], ['Negative cases', ['invalid card', 'declined', 'negative test']], ['Boundary cases', ['boundary', 'empty cart', 'quantity limit']], ['Integration coverage', ['payment gateway', 'inventory', 'integration']], ['Non-functional tests', ['performance', 'security', 'accessibility']],
  ]),
  roleQuestion('qa-flaky-tests', 'QA / Test Engineer', 'Meta', 'Behavioral', 'Automation', 'Medium', 'Tell me about a flaky automated test you diagnosed and stabilized.', [
    ['Symptoms', ['flaky', 'intermittent', 'failure rate']], ['Reproduction', ['repeat', 'isolate', 'reproduce']], ['Root cause', ['timing', 'shared state', 'root cause']], ['Fix', ['explicit wait', 'test data', 'isolation']], ['Result', ['stability', 'reduced failures', 'monitor']],
  ]),
]

const withDefaults = (question) => {
  let prompt = question.prompt
  if (question.type === 'System Design' && !/no diagram is required/i.test(prompt)) {
    prompt = `${prompt} Describe your design in writing; no diagram is required.`
  }
  if (question.type === 'Technical' && !/no executable code is required/i.test(prompt)) {
    prompt = `${prompt} Explain your answer in writing; no executable code is required.`
  }
  return {
    role: question.type === 'Behavioral' ? 'Any' : 'Software Engineer',
    company: 'All',
    ...question,
    prompt,
    responseMode: 'Written response',
    textAnswerable: true,
  }
}

const CUSTOM_QUESTIONS_KEY = 'aceinterview_admin_questions'
const QUESTION_OVERRIDES_KEY = 'aceinterview_admin_question_overrides'
const DELETED_QUESTIONS_KEY = 'aceinterview_admin_deleted_questions'

export const QUESTION_BANK = [...CORE_QUESTION_BANK, ...ROLE_QUESTIONS, ...generateCompanyQuestionSeeds()].map(withDefaults)

function questionIdentity(question) {
  return String(question.prompt || question.questionText || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function deduplicateQuestions(questions) {
  const seen = new Set()
  return questions.filter((question) => {
    const identity = questionIdentity(question)
    if (!identity || seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

export function getQuestionBank() {
  if (typeof localStorage === 'undefined') return QUESTION_BANK
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_QUESTIONS_KEY)) || []
    const overrides = JSON.parse(localStorage.getItem(QUESTION_OVERRIDES_KEY)) || {}
    const deleted = new Set(JSON.parse(localStorage.getItem(DELETED_QUESTIONS_KEY)) || [])
    return deduplicateQuestions([...QUESTION_BANK
      .filter((question) => !deleted.has(question.id))
      .map((question) => overrides[question.id] ? { ...question, ...overrides[question.id] } : question),
      ...custom.map((question) => ({ responseMode: 'Written response', textAnswerable: true, ...question })),
    ])
  } catch {
    return QUESTION_BANK
  }
}

export function saveCustomQuestions(questions) {
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions))
}

export function getCustomQuestions() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_QUESTIONS_KEY)) || []
  } catch {
    return []
  }
}

export function saveQuestionOverride(question) {
  const overrides = JSON.parse(localStorage.getItem(QUESTION_OVERRIDES_KEY)) || {}
  overrides[question.id] = question
  localStorage.setItem(QUESTION_OVERRIDES_KEY, JSON.stringify(overrides))
}

export function deleteQuestion(id) {
  const custom = getCustomQuestions()
  if (custom.some((question) => question.id === id)) {
    saveCustomQuestions(custom.filter((question) => question.id !== id))
    return
  }
  const deleted = new Set(JSON.parse(localStorage.getItem(DELETED_QUESTIONS_KEY)) || [])
  deleted.add(id)
  localStorage.setItem(DELETED_QUESTIONS_KEY, JSON.stringify([...deleted]))
}

export function selectQuestions(type = 'Technical', requestedCount = 5, role, company) {
  const count = Math.max(1, Number(requestedCount) || 5)
  const allQuestions = deduplicateQuestions(getQuestionBank())
    .filter((question) => question.textAnswerable !== false)
  const ranked = allQuestions.map((question, index) => ({
    question,
    index,
    score: (question.type === type ? 8 : 0)
      + (question.role === role ? 4 : question.role === 'Any' ? 1 : 0)
      + (question.company === company ? 2 : question.company === 'All' ? 1 : 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index)
  return deduplicateQuestions(ranked.map(({ question }) => question))
    .slice(0, Math.min(count, ranked.length))
}
