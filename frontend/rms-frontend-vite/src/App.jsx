import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'

const DEFAULT_LIKELIHOOD_SCALE = [
    { value: 'Very Low', score: 0, description: 'Error, accident, or act of nature is highly unlikely to occur; or occurs less than once every 10 years.' },
    { value: 'Low', score: 2, description: 'Error, accident, or act of nature is unlikely to occur; or occurs less than once a year, but more than once every 10 years.' },
    { value: 'Moderate', score: 5, description: 'Error, accident, or act of nature is somewhat likely to occur; or occurs between 1-10 times a year.' },
    { value: 'High', score: 8, description: 'Error, accident, or act of nature is highly likely to occur; or occurs between 10-100 times a year.' },
    { value: 'Very High', score: 10, description: 'Error, accident, or act of nature is almost certain to occur; or occurs more than 100 times a year.' },
]

const DEFAULT_IMPACT_SCALE = [
    { value: 'Very Low', score: 0, description: 'The threat event could be expected to have a negligible adverse effect on organizational operations, assets, or individuals.' },
    { value: 'Low', score: 2, description: 'The threat event could be expected to have a limited adverse effect — minor damage to assets, minor financial loss, or minor harm to individuals.' },
    { value: 'Moderate', score: 5, description: 'The threat event could be expected to have a serious adverse effect — significant degradation of mission capability or significant harm to individuals.' },
    { value: 'High', score: 8, description: 'The threat event could be expected to have a severe or catastrophic adverse effect — major damage to assets, major financial loss, or severe harm to individuals.' },
    { value: 'Very High', score: 10, description: 'The threat event could be expected to have multiple severe or catastrophic adverse effects on operations, assets, and individuals.' },
]

function getRiskLevel(likelihood, impact) {
    const table = {
        'Very High': { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'High', 'High': 'Very High', 'Very High': 'Very High' },
        'High': { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'Moderate', 'High': 'High', 'Very High': 'Very High' },
        'Moderate': { 'Very Low': 'Low', 'Low': 'Low', 'Moderate': 'Moderate', 'High': 'Moderate', 'Very High': 'High' },
        'Low': { 'Very Low': 'Very Low', 'Low': 'Low', 'Moderate': 'Low', 'High': 'Low', 'Very High': 'Moderate' },
        'Very Low': { 'Very Low': 'Very Low', 'Low': 'Very Low', 'Moderate': 'Very Low', 'High': 'Low', 'Very High': 'Low' },
    }
    return table[likelihood]?.[impact] ?? '—'
}

const RISK_CATALOG = [
    {
        id: 1,
        title: 'Biased training data',
        description: 'Training data does not represent the deployment population, leading to unfair outcomes.',
        source: 'ISO/IEC 23894 Annex B.5',
        domains: ['Healthcare', 'HR & Recruitment', 'Law Enforcement', 'Education'],
        phases: ['Inception', 'Design and Development'],
    },
    {
        id: 2,
        title: 'Lack of transparency and explainability',
        description: 'The AI system cannot explain its decisions to stakeholders.',
        source: 'ISO/IEC 23894 Annex B.3',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'],
    },
    {
        id: 3,
        title: 'Data quality issues',
        description: 'Inadequate quality of training and test data affects system functionality and fairness.',
        source: 'ISO/IEC 23894 Annex B.5',
        domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'],
        phases: ['Inception', 'Design and Development', 'Verification and Validation'],
    },
    {
        id: 4,
        title: 'Unintended misuse of the system',
        description: 'The AI system is used in a context for which it was not originally designed.',
        source: 'ISO/IEC 23894 Annex B.7',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 5,
        title: 'Over-automation without human oversight',
        description: 'The system operates with insufficient human control, increasing risk of undetected errors.',
        source: 'ISO/IEC 23894 Annex B.4',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Design and Development', 'Deployment'],
    },
    {
        id: 6,
        title: 'Privacy violation through data processing',
        description: 'Personal data is processed in ways that violate privacy regulations such as GDPR.',
        source: 'ISO/IEC 23894 Annex B.5',
        domains: ['Healthcare', 'HR & Recruitment', 'Education', 'Finance'],
        phases: ['Inception', 'Design and Development', 'Operation and Monitoring'],
    },
    {
        id: 7,
        title: 'Model degradation over time',
        description: 'System performance degrades due to data drift or changes in the deployment environment.',
        source: 'ISO/IEC 23894 Annex B.7',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Operation and Monitoring', 'Re-evaluation'],
    },
    {
        id: 8,
        title: 'Inadequate verification and validation',
        description: 'Insufficient testing leads to undetected failures when the system is deployed.',
        source: 'ISO/IEC 23894 Annex B.7',
        domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'],
        phases: ['Verification and Validation'],
    },
    {
        id: 9,
        title: 'Adversarial attacks and data poisoning',
        description: 'Malicious actors manipulate input data or training data to compromise system behavior.',
        source: 'ISO/IEC 23894 Annex B.5',
        domains: ['Finance', 'Law Enforcement'],
        phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'],
    },
    {
        id: 10,
        title: 'Discriminatory automated decisions',
        description: 'The system produces decisions that systematically disadvantage certain groups.',
        source: 'ISO/IEC 23894 Annex B.3',
        domains: ['HR & Recruitment', 'Law Enforcement', 'Finance', 'Education'],
        phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'],
    },
    {
        id: 11,
        title: 'Hardware and infrastructure failures',
        description: 'Faults in GPU or cloud hardware during training or operation corrupt model behavior in ways that are difficult to detect.',
        source: 'Steimers & Bömer (2021), Sec. 3.5',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'],
    },
    {
        id: 12,
        title: 'Inadequate operating environment specification',
        description: 'The system is deployed in a context that was insufficiently described during development, leading to unexpected failures in operation.',
        source: 'Steimers & Bömer (2021), Sec. 3.3',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Inception', 'Design and Development'],
    },
    {
        id: 13,
        title: 'Use of technologically immature components',
        description: 'Deployment of insufficiently mature AI technology in safety-critical contexts introduces unknown or poorly understood risk profiles.',
        source: 'Steimers & Bömer (2021), Sec. 3.6',
        domains: ['Healthcare', 'Finance', 'Law Enforcement'],
        phases: ['Inception', 'Design and Development'],
    },
    {
        id: 14,
        title: 'Hallucination and output unreliability',
        description: 'The model generates factually incorrect outputs that are presented as correct, with potentially severe consequences in high-stakes decisions.',
        source: 'Nidhisree et al. (2024), Table I; IBM AI Risk Atlas',
        domains: ['Healthcare', 'Finance', 'Law Enforcement', 'Education'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 15,
        title: 'Overreliance on AI recommendations',
        description: 'Users trust AI outputs without critical review and delegate decisions without adequate human judgment.',
        source: 'Nidhisree et al. (2024), Table I; MIT AI Risk Repository, Subdomain 5.1',
        domains: ['Healthcare', 'Finance', 'Education'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 16,
        title: 'Disinformation and manipulation at scale',
        description: 'AI systems are deliberately used to generate and spread false information or to manipulate affected individuals at scale.',
        source: 'MIT AI Risk Repository, Subdomain 4.1',
        domains: ['Law Enforcement', 'Education', 'HR & Recruitment'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 17,
        title: 'Loss of human agency in automated decisions',
        description: 'Affected persons progressively lose the ability to understand, contest, or influence decisions made by AI systems.',
        source: 'MIT AI Risk Repository, Subdomain 5.2',
        domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Law Enforcement'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 18,
        title: 'Prompt injection and model behavior manipulation',
        description: 'Malicious inputs exploit LLM inference to override intended behavior and produce harmful or unintended outputs.',
        source: 'IBM AI Risk Atlas: Prompt attacks; Model-behavior manipulation',
        domains: ['Finance', 'Law Enforcement'],
        phases: ['Deployment', 'Operation and Monitoring'],
    },
    {
        id: 19,
        title: 'Lack of AI governance and accountability structures',
        description: 'Absent or insufficient ownership, accountability, and documentation structures make compliance verification and auditing impossible.',
        source: 'IBM AI Risk Atlas: Governance; MIT AI Risk Repository, Subdomain 6.5',
        domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'],
        phases: ['Inception', 'Deployment', 'Operation and Monitoring'],
    },
]

const PHASES = ['Inception', 'Design and Development', 'Verification and Validation', 'Deployment', 'Operation and Monitoring', 'Re-evaluation', 'Retirement or Replacement']
const DOMAINS = ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement']

const levelColor = (level) => {
    if (level === 'Very High' || level === 'High') return { bg: '#fdecea', text: '#c62828' }
    if (level === 'Moderate') return { bg: '#fff3e0', text: '#e65100' }
    if (level === 'Low') return { bg: '#e8f5e9', text: '#2e7d32' }
    return { bg: '#f5f5f5', text: '#888' }
}

function EditableScaleTable({ scale, setScale, title, source, note }) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [editValue, setEditValue] = useState('')

    function startEdit(i, current) {
        setEditingIndex(i)
        setEditValue(current)
    }

    function saveEdit(i) {
        const updated = scale.map((row, idx) => idx === i ? { ...row, description: editValue } : row)
        setScale(updated)
        setEditingIndex(null)
    }

    function reset() {
        if (title.includes('Likelihood')) setScale(DEFAULT_LIKELIHOOD_SCALE)
        else setScale(DEFAULT_IMPACT_SCALE)
    }

    return (
        <div style={{ ...styles.card, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <button onClick={reset} style={{ ...styles.buttonOutline, fontSize: '12px', marginTop: 0 }}>Reset to NIST Default</button>
            </div>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>{note} · <em>{source}</em></p>
            <table style={styles.table}>
                <thead>
                <tr>
                    <th style={{ ...styles.th, width: '110px' }}>Level</th>
                    <th style={{ ...styles.th, width: '60px' }}>Score</th>
                    <th style={styles.th}>Definition <span style={{ color: '#aaa', fontWeight: 'normal' }}>(click to edit)</span></th>
                </tr>
                </thead>
                <tbody>
                {scale.map((row, i) => {
                    const c = levelColor(row.value)
                    return (
                        <tr key={row.value}>
                            <td style={styles.td}>
                                <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{row.value}</span>
                            </td>
                            <td style={styles.td}>{row.score}</td>
                            <td style={styles.td}>
                                {editingIndex === i ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                          style={{ ...styles.input, flex: 1, height: '70px', fontSize: '13px' }}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                      />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <button onClick={() => saveEdit(i)} style={{ ...styles.buttonSelected, fontSize: '12px', marginTop: 0, padding: '6px 12px' }}>Save</button>
                                            <button onClick={() => setEditingIndex(null)} style={{ ...styles.buttonOutline, fontSize: '12px', marginTop: 0, padding: '6px 12px' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span
                                        style={{ fontSize: '13px', color: '#555', cursor: 'pointer', display: 'block' }}
                                        onClick={() => startEdit(i, row.description)}
                                        title="Click to edit"
                                    >
                      {row.description} <span style={{ color: '#bbb', fontSize: '11px' }}>✏️</span>
                    </span>
                                )}
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}

function Navbar() {
    const location = useLocation()
    const links = [
        { to: '/', label: 'Dashboard' },
        { to: '/scope', label: 'Scope & Criteria' },
        { to: '/risks', label: 'Risks' },
        { to: '/misuse', label: 'Misuse' },
        { to: '/treatment', label: 'Treatment' },
        { to: '/report', label: 'Report' },
    ]
    return (
        <nav style={styles.nav}>
            <div style={styles.navBrand}>RMS</div>
            <div style={styles.navLinks}>
                {links.map(link => (
                    <Link key={link.to} to={link.to} style={{ ...styles.navLink, ...(location.pathname === link.to ? styles.navLinkActive : {}) }}>
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    )
}

function Dashboard({ risks }) {
    const high = risks.filter(r => r.level === 'High' || r.level === 'Very High').length
    const moderate = risks.filter(r => r.level === 'Moderate').length
    const low = risks.filter(r => r.level === 'Low' || r.level === 'Very Low').length
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.sub}>Risk Management Process Overview — EU AI Act Art. 9</p>
            <div style={styles.cardRow}>
                <div style={styles.statCard}><div style={styles.statNumber}>{risks.length}</div><div style={styles.statLabel}>Total Risks</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statNumber, color: '#c62828' }}>{high}</div><div style={styles.statLabel}>High / Very High</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statNumber, color: '#e65100' }}>{moderate}</div><div style={styles.statLabel}>Moderate</div></div>
                <div style={styles.statCard}><div style={{ ...styles.statNumber, color: '#2e7d32' }}>{low}</div><div style={styles.statLabel}>Low / Very Low</div></div>
            </div>
        </div>
    )
}

function Scope({ scope, setScope, likelihoodScale, setLikelihoodScale, impactScale, setImpactScale }) {
    const [form, setForm] = useState(scope)
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Scope & Criteria</h1>
            <p style={styles.sub}>Define the context of the AI system — ISO/IEC 23894 Cl. 6.3</p>

            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>AI System Information</h3>
                <div style={styles.formGrid}>
                    <div>
                        <label style={styles.label}>AI System Name</label>
                        <input style={styles.input} placeholder="e.g. Credit Scoring Model" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={styles.label}>Deployment Domain</label>
                        <select style={styles.input} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}>
                            <option value="">-- Select Domain --</option>
                            {DOMAINS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Lifecycle Stage (ISO/IEC 23894 Annex C)</label>
                        <select style={styles.input} value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
                            <option value="">-- Select Phase --</option>
                            {PHASES.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <button style={styles.button} onClick={() => setScope(form)}>Save Scope</button>
                {scope.domain && <p style={{ marginTop: '12px', color: '#2e7d32' }}>✓ Saved: {scope.name} — {scope.domain} — {scope.phase}</p>}
            </div>

            <EditableScaleTable
                scale={likelihoodScale}
                setScale={setLikelihoodScale}
                title="Likelihood Scale"
                source="NIST SP 800-30 Table G-3"
                note="Used to assess the likelihood of each identified risk. Definitions can be adapted to organizational context."
            />

            <EditableScaleTable
                scale={impactScale}
                setScale={setImpactScale}
                title="Impact Scale"
                source="NIST SP 800-30 Table H-3"
                note="Used to assess the impact across organizational, individual, and societal dimensions (ISO/IEC 23894 Cl. 6.4.3.2)."
            />
        </div>
    )
}

function Risks({ scope, risks, setRisks, likelihoodScale, impactScale }) {
    const filtered = RISK_CATALOG.filter(r =>
        (!scope.domain || r.domains.includes(scope.domain)) &&
        (!scope.phase || r.phases.includes(scope.phase))
    )
    const isSelected = (id) => risks.find(r => r.id === id)

    function toggle(risk) {
        if (isSelected(risk.id)) {
            setRisks(risks.filter(r => r.id !== risk.id))
        } else {
            setRisks([...risks, { ...risk, likelihood: 'Moderate', impact: 'Moderate', level: getRiskLevel('Moderate', 'Moderate') }])
        }
    }

    function update(id, field, value) {
        setRisks(risks.map(r => {
            if (r.id !== id) return r
            const updated = { ...r, [field]: value }
            updated.level = getRiskLevel(updated.likelihood, updated.impact)
            return updated
        }))
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Identification & Evaluation</h1>
            <p style={styles.sub}>
                {scope.domain
                    ? `Filtered for domain "${scope.domain}" · lifecycle stage "${scope.phase}" — ISO/IEC 23894 Annex B & C`
                    : 'Define Scope & Criteria first to filter relevant risks.'}
            </p>

            {filtered.length === 0 && <div style={styles.card}><p>No risks found for the selected context. Please adjust your scope.</p></div>}

            {filtered.map(risk => {
                const selected = risks.find(r => r.id === risk.id)
                const c = selected ? levelColor(selected.level) : { bg: '#f5f5f5', text: '#888' }
                return (
                    <div key={risk.id} style={{ ...styles.card, marginBottom: '12px', borderLeft: selected ? '4px solid #1a1a2e' : '4px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <strong>{risk.title}</strong>
                                <p style={{ margin: '4px 0', color: '#555', fontSize: '14px' }}>{risk.description}</p>
                                <span style={styles.sourceTag}>{risk.source}</span>
                            </div>
                            <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                <button style={selected ? styles.buttonSelected : styles.buttonOutline} onClick={() => toggle(risk)}>
                                    {selected ? '✓ Selected' : '+ Select'}
                                </button>
                                {selected && <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{selected.level}</span>}
                            </div>
                        </div>
                        {selected && (
                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Likelihood (NIST SP 800-30 Table G-3)</label>
                                    <select style={styles.input} value={selected.likelihood} onChange={e => update(risk.id, 'likelihood', e.target.value)}>
                                        {likelihoodScale.map(l => <option key={l.value}>{l.value}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Impact (NIST SP 800-30 Table H-3)</label>
                                    <select style={styles.input} value={selected.impact} onChange={e => update(risk.id, 'impact', e.target.value)}>
                                        {impactScale.map(i => <option key={i.value}>{i.value}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

const MISUSE_CATEGORIES = [
    'Use beyond intended scope',
    'Adversarial attack / prompt injection',
    'Privacy violation through unauthorized use',
    'Disinformation & deception',
    'Overreliance by uninformed user',
    'Bias amplification through misuse',
    'Psychological manipulation',
]

function Misuse({ misuses, setMisuses, likelihoodScale, impactScale }) {
    function addScenario() {
        const newScenario = {
            id: Date.now(),
            category: MISUSE_CATEGORIES[0],
            description: '',
            likelihood: 'Moderate',
            impact: 'Moderate',
            level: getRiskLevel('Moderate', 'Moderate'),
        }
        setMisuses([...misuses, newScenario])
    }

    function updateScenario(id, field, value) {
        setMisuses(misuses.map(m => {
            if (m.id !== id) return m
            const updated = { ...m, [field]: value }
            updated.level = getRiskLevel(updated.likelihood, updated.impact)
            return updated
        }))
    }

    function deleteScenario(id) {
        setMisuses(misuses.filter(m => m.id !== id))
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Misuse Scenarios</h1>
            <p style={styles.sub}>Reasonably foreseeable misuse — EU AI Act Art. 9(2)(b) · Seghid et al. (2026)</p>

            <button style={styles.button} onClick={addScenario}>+ Add Misuse Scenario</button>

            {misuses.length === 0 && (
                <div style={{ ...styles.card, marginTop: '24px' }}>
                    <p style={{ color: '#888', margin: 0 }}>No misuse scenarios defined yet. Click "+ Add Misuse Scenario" to begin.</p>
                </div>
            )}

            {misuses.map(m => {
                const c = levelColor(m.level)
                return (
                    <div key={m.id} style={{ ...styles.card, marginTop: '16px', borderLeft: '4px solid #1a1a2e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1, marginRight: '16px' }}>
                                <label style={styles.label}>Misuse Category (Seghid et al., 2026)</label>
                                <select
                                    style={styles.input}
                                    value={m.category}
                                    onChange={e => updateScenario(m.id, 'category', e.target.value)}
                                >
                                    {MISUSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap', marginTop: '20px' }}>
                                {m.level}
                            </span>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={styles.label}>Scenario Description</label>
                            <textarea
                                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                                placeholder="Describe how this system could be foreseeably misused..."
                                value={m.description}
                                onChange={e => updateScenario(m.id, 'description', e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Likelihood (NIST SP 800-30 Table G-3)</label>
                                <select
                                    style={styles.input}
                                    value={m.likelihood}
                                    onChange={e => updateScenario(m.id, 'likelihood', e.target.value)}
                                >
                                    {likelihoodScale.map(l => <option key={l.value}>{l.value}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Impact (NIST SP 800-30 Table H-3)</label>
                                <select
                                    style={styles.input}
                                    value={m.impact}
                                    onChange={e => updateScenario(m.id, 'impact', e.target.value)}
                                >
                                    {impactScale.map(i => <option key={i.value}>{i.value}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={() => deleteScenario(m.id)}
                                style={{ ...styles.buttonOutline, marginTop: 0, color: '#c62828', borderColor: '#c62828' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function Treatment({ risks }) {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Treatment</h1>
            <p style={styles.sub}>Define mitigation measures — ISO 31000 Cl. 6.5</p>
            <div style={styles.card}>
                {risks.length === 0
                    ? <p>No risks selected yet. Go to Risks and select relevant risks first.</p>
                    : risks.map(r => {
                        const c = levelColor(r.level)
                        return (
                            <div key={r.id} style={styles.treatmentItem}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{r.title}</strong>
                                    <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{r.level}</span>
                                </div>
                                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>Likelihood: {r.likelihood} · Impact: {r.impact}</p>
                                <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '13px' }}>Treatment plan pending</p>
                            </div>
                        )
                    })}
            </div>
        </div>
    )
}

function Report({ risks, scope }) {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Report</h1>
            <p style={styles.sub}>Annex IV Documentation — EU AI Act Art. 9</p>
            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>Assessment Summary</h3>
                <p><strong>AI System:</strong> {scope.name || '—'}</p>
                <p><strong>Domain:</strong> {scope.domain || '—'}</p>
                <p><strong>Lifecycle Stage:</strong> {scope.phase || '—'}</p>
                <p><strong>Likelihood Scale:</strong> NIST SP 800-30 Table G-3</p>
                <p><strong>Impact Scale:</strong> NIST SP 800-30 Table H-3</p>
                <p><strong>Total Risks Identified:</strong> {risks.length}</p>
                <p><strong>High / Very High Risks:</strong> {risks.filter(r => r.level === 'High' || r.level === 'Very High').length}</p>
                <p><strong>Status:</strong> {risks.length === 0 ? 'No assessment conducted' : 'Assessment in progress'}</p>
                <button style={styles.button}>Download Report (PDF)</button>
            </div>
        </div>
    )
}

const styles = {
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '60px', background: '#1a1a2e', color: 'white' },
    navBrand: { fontWeight: 'bold', fontSize: '20px', color: '#4fc3f7' },
    navLinks: { display: 'flex', gap: '24px' },
    navLink: { color: '#ccc', textDecoration: 'none', fontSize: '15px' },
    navLinkActive: { color: '#4fc3f7', fontWeight: 'bold', borderBottom: '2px solid #4fc3f7', paddingBottom: '2px' },
    page: { padding: '40px', maxWidth: '900px', margin: '0 auto' },
    heading: { fontSize: '28px', marginBottom: '8px' },
    sub: { color: '#666', marginBottom: '24px' },
    card: { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', background: '#fafafa' },
    cardRow: { display: 'flex', gap: '16px' },
    statCard: { flex: 1, border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#fafafa' },
    statNumber: { fontSize: '36px', fontWeight: 'bold', color: '#1a1a2e' },
    statLabel: { color: '#888', fontSize: '14px', marginTop: '4px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    label: { display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    button: { marginTop: '12px', padding: '10px 20px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    buttonOutline: { marginTop: '12px', padding: '8px 16px', background: 'white', color: '#1a1a2e', border: '1px solid #1a1a2e', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    buttonSelected: { marginTop: '12px', padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    sourceTag: { fontSize: '11px', color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px' },
    badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px', background: '#f5f5f5', borderBottom: '2px solid #e0e0e0', fontSize: '13px' },
    td: { padding: '10px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', verticalAlign: 'top' },
    treatmentItem: { padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
}

function App() {
    const [risks, setRisks] = useState([])
    const [scope, setScope] = useState({ name: '', domain: '', phase: '' })
    const [likelihoodScale, setLikelihoodScale] = useState(DEFAULT_LIKELIHOOD_SCALE)
    const [impactScale, setImpactScale] = useState(DEFAULT_IMPACT_SCALE)
    const [misuses, setMisuses] = useState([])
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard risks={risks} />} />
                <Route path="/scope" element={<Scope scope={scope} setScope={setScope} likelihoodScale={likelihoodScale} setLikelihoodScale={setLikelihoodScale} impactScale={impactScale} setImpactScale={setImpactScale} />} />
                <Route path="/risks" element={<Risks scope={scope} risks={risks} setRisks={setRisks} likelihoodScale={likelihoodScale} impactScale={impactScale} />} />
                <Route path="/misuse" element={<Misuse misuses={misuses} setMisuses={setMisuses} likelihoodScale={likelihoodScale} impactScale={impactScale} />} />
                <Route path="/treatment" element={<Treatment risks={risks} />} />
                <Route path="/report" element={<Report risks={risks} scope={scope} />} />
            </Routes>
        </Router>
    )
}

export default App