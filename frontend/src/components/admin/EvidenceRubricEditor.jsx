function formatTerms(terms = []) {
  return terms.map((term) => `${term.type || 'TERM'} | ${term.value}`).join('\n')
}

function parseTerms(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf('|')
    if (separator < 0) return { type: 'TERM', value: line }
    const requestedType = line.slice(0, separator).trim().toUpperCase()
    const type = ['TERM', 'ALTERNATIVE', 'INCORRECT'].includes(requestedType) ? requestedType : 'TERM'
    return { type, value: line.slice(separator + 1).trim() }
  }).filter((term) => term.value)
}

export default function EvidenceRubricEditor({ rubrics, onChange }) {
  const updateCriterion = (index, patch) => onChange(rubrics.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const updateGroup = (criterionIndex, groupIndex, patch) => {
    const criterion = rubrics[criterionIndex]
    updateCriterion(criterionIndex, {
      evidenceGroups: criterion.evidenceGroups.map((group, index) => index === groupIndex ? { ...group, ...patch } : group),
    })
  }
  const addGroup = (criterionIndex) => {
    const criterion = rubrics[criterionIndex]
    if (criterion.evidenceGroups.length >= 4) return
    updateCriterion(criterionIndex, {
      evidenceGroups: [...criterion.evidenceGroups, {
        concept: `Additional evidence for ${criterion.label}`,
        description: 'Accept another technically valid way to demonstrate this criterion.',
        terms: [{ type: 'ALTERNATIVE', value: '' }],
      }],
    })
  }
  const removeGroup = (criterionIndex, groupIndex) => {
    const criterion = rubrics[criterionIndex]
    if (criterion.evidenceGroups.length <= 2) return
    updateCriterion(criterionIndex, { evidenceGroups: criterion.evidenceGroups.filter((_, index) => index !== groupIndex) })
  }

  return <div className="evidence-rubric-editor">
    {rubrics.map((criterion, criterionIndex) => <details className="evidence-criterion" key={criterion.id || criterionIndex} open={criterionIndex === 0}>
      <summary>
        <b>{criterionIndex + 1}. {criterion.label}</b>
        <span>{criterion.importance} · {criterion.weight}% · {criterion.evidenceStatus || 'DRAFT'}</span>
      </summary>
      <div className="evidence-criterion-body">
        <div className="g3">
          <div className="field"><label>Criterion name</label><input className="inp" value={criterion.label} onChange={(event) => updateCriterion(criterionIndex, { label: event.target.value })} /></div>
          <div className="field"><label>Importance</label><select value={criterion.importance} onChange={(event) => updateCriterion(criterionIndex, { importance: event.target.value })}><option value="CORE">Core</option><option value="SUPPORTING">Supporting</option></select></div>
          <div className="field"><label>Weight</label><input className="inp" type="number" min="1" max="100" value={criterion.weight} onChange={(event) => updateCriterion(criterionIndex, { weight: Number(event.target.value) })} /></div>
        </div>
        <div className="field"><label>Description</label><textarea value={criterion.description} onChange={(event) => updateCriterion(criterionIndex, { description: event.target.value })} /></div>
        <div className="g2">
          <div className="field"><label>Expected evidence</label><textarea value={criterion.expectedEvidence} onChange={(event) => updateCriterion(criterionIndex, { expectedEvidence: event.target.value })} /></div>
          <div className="field"><label>Semantic description</label><textarea value={criterion.semanticDescription} onChange={(event) => updateCriterion(criterionIndex, { semanticDescription: event.target.value })} /></div>
        </div>
        <div className="g2">
          <div className="field"><label>Keywords</label><textarea value={criterion.keywords} onChange={(event) => updateCriterion(criterionIndex, { keywords: event.target.value })} /></div>
          <div className="field"><label>Acceptable alternatives</label><textarea value={criterion.acceptableAlternatives} onChange={(event) => updateCriterion(criterionIndex, { acceptableAlternatives: event.target.value })} /></div>
        </div>
        <div className="evidence-groups-heading"><b>Evidence groups ({criterion.evidenceGroups.length})</b><button type="button" className="btn ghost sm" disabled={criterion.evidenceGroups.length >= 4} onClick={() => addGroup(criterionIndex)}>+ Add group</button></div>
        {criterion.evidenceGroups.map((group, groupIndex) => <div className="evidence-group" key={group.id || groupIndex}>
          <div className="evidence-group-title"><b>Group {groupIndex + 1}</b><button type="button" className="act del" disabled={criterion.evidenceGroups.length <= 2} onClick={() => removeGroup(criterionIndex, groupIndex)}>Remove</button></div>
          <div className="field"><label>Concept</label><input className="inp" value={group.concept} onChange={(event) => updateGroup(criterionIndex, groupIndex, { concept: event.target.value })} /></div>
          <div className="field"><label>Description</label><textarea value={group.description} onChange={(event) => updateGroup(criterionIndex, groupIndex, { description: event.target.value })} /></div>
          <div className="field"><label>Terms—one per line: TERM | value, ALTERNATIVE | value, or INCORRECT | value</label><textarea className="evidence-terms" value={formatTerms(group.terms)} onChange={(event) => updateGroup(criterionIndex, groupIndex, { terms: parseTerms(event.target.value) })} /></div>
        </div>)}
      </div>
    </details>)}
  </div>
}
