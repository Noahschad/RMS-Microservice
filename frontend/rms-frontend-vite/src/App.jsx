import { useState } from 'react'


//Konstanten
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


//NIST SP 800-30 Table I-2
function getRiskLevel(likelihood, impact) {
    const table = {
        'Very High': { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'High', 'High': 'Very High', 'Very High': 'Very High' },
        'High':      { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'Moderate', 'High': 'High', 'Very High': 'Very High' },
        'Moderate':  { 'Very Low': 'Low', 'Low': 'Low', 'Moderate': 'Moderate', 'High': 'Moderate', 'Very High': 'High' },
        'Low':       { 'Very Low': 'Very Low', 'Low': 'Low', 'Moderate': 'Low', 'High': 'Low', 'Very High': 'Moderate' },
        'Very Low':  { 'Very Low': 'Very Low', 'Low': 'Very Low', 'Moderate': 'Very Low', 'High': 'Low', 'Very High': 'Low' },
    }
    return table[likelihood]?.[impact] ?? '—'
}

const RISK_CATALOG = [
    { id: 1, title: 'Biased training data', description: 'Training data does not represent the deployment population, leading to unfair outcomes.', source: 'ISO/IEC 23894 Annex B.5', domains: ['Healthcare', 'HR & Recruitment', 'Law Enforcement', 'Education'], phases: ['Inception', 'Design and Development'] },
    { id: 2, title: 'Lack of transparency and explainability', description: 'The AI system cannot explain its decisions to stakeholders.', source: 'ISO/IEC 23894 Annex B.3', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'] },
    { id: 3, title: 'Data quality issues', description: 'Inadequate quality of training and test data affects system functionality and fairness.', source: 'ISO/IEC 23894 Annex B.5', domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'], phases: ['Inception', 'Design and Development', 'Verification and Validation'] },
    //{ id: 4, title: 'Unintended misuse of the system', description: 'The AI system is used in a context for which it was not originally designed.', source: 'ISO/IEC 23894 Annex B.7', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 5, title: 'Over-automation without human oversight', description: 'The system operates with insufficient human control, increasing risk of undetected errors.', source: 'ISO/IEC 23894 Annex B.4', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Design and Development', 'Deployment'] },
    { id: 6, title: 'Privacy violation through data processing', description: 'Personal data is processed in ways that violate privacy regulations such as GDPR.', source: 'ISO/IEC 23894 Annex B.5', domains: ['Healthcare', 'HR & Recruitment', 'Education', 'Finance'], phases: ['Inception', 'Design and Development', 'Operation and Monitoring'] },
    { id: 7, title: 'Model degradation over time', description: 'System performance degrades due to data drift or changes in the deployment environment.', source: 'ISO/IEC 23894 Annex B.7', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Operation and Monitoring', 'Re-evaluation'] },
    { id: 8, title: 'Inadequate verification and validation', description: 'Insufficient testing leads to undetected failures when the system is deployed.', source: 'ISO/IEC 23894 Annex B.7', domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'], phases: ['Verification and Validation'] },
    { id: 9, title: 'Adversarial attacks and data poisoning', description: 'Malicious actors manipulate input data or training data to compromise system behavior.', source: 'ISO/IEC 23894 Annex B.5', domains: ['Finance', 'Law Enforcement'], phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'] },
    { id: 10, title: 'Discriminatory automated decisions', description: 'The system produces decisions that systematically disadvantage certain groups.', source: 'ISO/IEC 23894 Annex B.3', domains: ['HR & Recruitment', 'Law Enforcement', 'Finance', 'Education'], phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'] },
    { id: 11, title: 'Hardware and infrastructure failures', description: 'Faults in GPU or cloud hardware during training or operation corrupt model behavior in ways that are difficult to detect.', source: 'Steimers & Bömer (2021), Sec. 3.5', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Design and Development', 'Deployment', 'Operation and Monitoring'] },
    { id: 12, title: 'Inadequate operating environment specification', description: 'The system is deployed in a context that was insufficiently described during development, leading to unexpected failures in operation.', source: 'Steimers & Bömer (2021), Sec. 3.3', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Inception', 'Design and Development'] },
    { id: 13, title: 'Use of technologically immature components', description: 'Deployment of insufficiently mature AI technology in safety-critical contexts introduces unknown or poorly understood risk profiles.', source: 'Steimers & Bömer (2021), Sec. 3.6', domains: ['Healthcare', 'Finance', 'Law Enforcement'], phases: ['Inception', 'Design and Development'] },
    { id: 14, title: 'Hallucination and output unreliability', description: 'The model generates factually incorrect outputs that are presented as correct, with potentially severe consequences in high-stakes decisions.', source: 'Nidhisree et al. (2024), Table I; IBM AI Risk Atlas', domains: ['Healthcare', 'Finance', 'Law Enforcement', 'Education'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 15, title: 'Overreliance on AI recommendations', description: 'Users trust AI outputs without critical review and delegate decisions without adequate human judgment.', source: 'Nidhisree et al. (2024), Table I; MIT AI Risk Repository, Subdomain 5.1', domains: ['Healthcare', 'Finance', 'Education'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 16, title: 'Disinformation and manipulation at scale', description: 'AI systems are deliberately used to generate and spread false information or to manipulate affected individuals at scale.', source: 'MIT AI Risk Repository, Subdomain 4.1', domains: ['Law Enforcement', 'Education', 'HR & Recruitment'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 17, title: 'Loss of human agency in automated decisions', description: 'Affected persons progressively lose the ability to understand, contest, or influence decisions made by AI systems.', source: 'MIT AI Risk Repository, Subdomain 5.2', domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Law Enforcement'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 18, title: 'Prompt injection and model behavior manipulation', description: 'Malicious inputs exploit LLM inference to override intended behavior and produce harmful or unintended outputs.', source: 'IBM AI Risk Atlas: Prompt attacks; Model-behavior manipulation', domains: ['Finance', 'Law Enforcement'], phases: ['Deployment', 'Operation and Monitoring'] },
    { id: 19, title: 'Lack of AI governance and accountability structures', description: 'Absent or insufficient ownership, accountability, and documentation structures make compliance verification and auditing impossible.', source: 'IBM AI Risk Atlas: Governance; MIT AI Risk Repository, Subdomain 6.5', domains: ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement'], phases: ['Inception', 'Deployment', 'Operation and Monitoring'] },
]

const PHASES = ['Inception', 'Design and Development', 'Verification and Validation', 'Deployment', 'Operation and Monitoring', 'Re-evaluation', 'Retirement or Replacement']
const DOMAINS = ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement']

const MISUSE_CATEGORIES = [
    'Use beyond intended scope',
    'Adversarial attack / prompt injection',
    'Privacy violation through unauthorized use',
    'Disinformation & deception',
    'Overreliance by uninformed user',
    'Bias amplification through misuse',
    'Psychological manipulation',
]

const STEPS = [
    { id: 1, label: 'Scope & Criteria', sub: 'ISO 31000 Cl. 6.3' },
    { id: 2, label: 'Risk Identification', sub: 'ISO/IEC 23894 Cl. 6.4.2' },
    { id: 3, label: 'Risk Evaluation', sub: 'ISO/IEC 23894 Cl. 6.4.3' },
    { id: 4, label: 'Treatment', sub: 'ISO 31000 Cl. 6.5' },
    { id: 5, label: 'Report', sub: 'EU AI Act Art. 9' },
]

const levelColor = (level) => {
    if (level === 'Very High' || level === 'High') return { bg: '#fdecea', text: '#c62828' }
    if (level === 'Moderate') return { bg: '#fff3e0', text: '#e65100' }
    if (level === 'Low') return { bg: '#e8f5e9', text: '#2e7d32' }
    return { bg: '#f5f5f5', text: '#888' }
}

//Schritte 1-5
function Stepper({ currentStep, onStepClick }) {
    return (
        <div style={styles.stepperWrap}>
            <div style={styles.stepperInner}>
                {STEPS.map((step, idx) => {
                    const isActive = step.id === currentStep
                    const isDone = step.id < currentStep
                    return (
                        <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 0 }}>
                            <div
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: isDone ? 'pointer' : 'default' }}
                                onClick={() => isDone && onStepClick(step.id)}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: isActive ? '#1a1a2e' : isDone ? '#4fc3f7' : '#e0e0e0',
                                    color: isActive || isDone ? 'white' : '#999',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s',
                                    border: isActive ? '2px solid #4fc3f7' : '2px solid transparent',
                                }}>
                                    {isDone ? '✓' : step.id}
                                </div>
                                <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#1a1a2e' : isDone ? '#4fc3f7' : '#999', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {step.label}
                                </div>
                                <div style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {step.sub}
                                </div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div style={{ flex: 1, height: '2px', background: isDone ? '#4fc3f7' : '#e0e0e0', margin: '0 8px', marginBottom: '28px', transition: 'background 0.3s' }} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function NavButtons({ currentStep, onBack, onNext, nextLabel, nextDisabled }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
            <button
                onClick={onBack}
                style={{ ...styles.buttonOutline, marginTop: 0, visibility: currentStep === 1 ? 'hidden' : 'visible' }}
            >
                ← Back
            </button>
            <button
                onClick={onNext}
                disabled={nextDisabled}
                style={{ ...styles.button, marginTop: 0, opacity: nextDisabled ? 0.4 : 1, cursor: nextDisabled ? 'not-allowed' : 'pointer' }}
            >
                {nextLabel || 'Next →'}
            </button>
        </div>
    )
}

//Misuse model
function MisueFloatingButton({ onClick, count }) {
    return (
        <button
            onClick={onClick}
            title="Add a misuse scenario at any time"
            style={{
                position: 'fixed', top: '76px', right: '32px',
                background: '#1a1a2e', color: 'white',
                border: '2px solid #4fc3f7', borderRadius: '50px',
                padding: '14px 22px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px',
                zIndex: 200,
            }}
        >
            Potential misuse of the AI System
            {count > 0 && (
                <span style={{ background: '#4fc3f7', color: '#1a1a2e', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    {count}
                </span>
            )}
        </button>
    )
}

function MisuseModal({ misuses, setMisuses, likelihoodScale, impactScale, onClose }) {
    function addScenario() {
        setMisuses([...misuses, {
            id: Date.now(),
            category: MISUSE_CATEGORIES[0],
            description: '',
            likelihood: 'Moderate',
            impact: 'Moderate',
            level: getRiskLevel('Moderate', 'Moderate'),
        }])
    }

    function update(id, field, value) {
        setMisuses(misuses.map(m => {
            if (m.id !== id) return m
            const updated = { ...m, [field]: value }
            updated.level = getRiskLevel(updated.likelihood, updated.impact)
            return updated
        }))
    }

    function remove(id) {
        setMisuses(misuses.filter(m => m.id !== id))
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <div style={{ background: 'white', width: '520px', height: '100vh', overflowY: 'auto', padding: '32px', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Misuse Scenarios</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
                </div>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                    Reasonably foreseeable misuse — EU AI Act Art. 9(2)(b) · Seghid et al. (2026)<br />
                    <em>You can add misuse scenarios at any point during the assessment.</em>
                </p>

                <button style={{ ...styles.button, marginTop: 0, width: '100%' }} onClick={addScenario}>+ Add Misuse Scenario</button>

                {misuses.length === 0 && (
                    <p style={{ color: '#aaa', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>No scenarios added yet.</p>
                )}

                {misuses.map(m => {
                    const c = levelColor(m.level)
                    return (
                        <div key={m.id} style={{ ...styles.card, marginTop: '16px', borderLeft: '4px solid #1a1a2e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <label style={styles.label}>Category</label>
                                <span style={{ ...styles.badge, background: c.bg, color: c.text }}>{m.level}</span>
                            </div>
                            <select style={{ ...styles.input, marginBottom: '10px' }} value={m.category} onChange={e => update(m.id, 'category', e.target.value)}>
                                {MISUSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                            <textarea
                                style={{ ...styles.input, height: '70px', resize: 'vertical', marginBottom: '10px' }}
                                placeholder="Describe the foreseeable misuse scenario..."
                                value={m.description}
                                onChange={e => update(m.id, 'description', e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Likelihood</label>
                                    <select style={styles.input} value={m.likelihood} onChange={e => update(m.id, 'likelihood', e.target.value)}>
                                        {likelihoodScale.map(l => <option key={l.value}>{l.value}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Impact</label>
                                    <select style={styles.input} value={m.impact} onChange={e => update(m.id, 'impact', e.target.value)}>
                                        {impactScale.map(i => <option key={i.value}>{i.value}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={() => remove(m.id)} style={{ ...styles.buttonOutline, marginTop: '10px', color: '#c62828', borderColor: '#c62828', fontSize: '12px' }}>Remove</button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function EditableScaleTable({ scale, setScale, title, source, note }) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [editValue, setEditValue] = useState('')

    function saveEdit(i) {
        setScale(scale.map((row, idx) => idx === i ? { ...row, description: editValue } : row))
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
                            <td style={styles.td}><span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{row.value}</span></td>
                            <td style={styles.td}>{row.score}</td>
                            <td style={styles.td}>
                                {editingIndex === i ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <textarea style={{ ...styles.input, flex: 1, height: '70px', fontSize: '13px' }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <button onClick={() => saveEdit(i)} style={{ ...styles.buttonSelected, fontSize: '12px', marginTop: 0, padding: '6px 12px' }}>Save</button>
                                            <button onClick={() => setEditingIndex(null)} style={{ ...styles.buttonOutline, fontSize: '12px', marginTop: 0, padding: '6px 12px' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '13px', color: '#555', cursor: 'pointer', display: 'block' }} onClick={() => { setEditingIndex(i); setEditValue(row.description) }}>
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

//Seiten
function LandingPage({ onStart }) {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2a2a4a 0%, #243652 60%, #1a4a7a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ maxWidth: '720px', textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '13px', letterSpacing: '2px', color: '#4fc3f7', textTransform: 'uppercase', marginBottom: '16px' }}>
                    EU AI Act · Article 9
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 16px', lineHeight: 1.2, color: '#4fc3f7' }}>
                    Risk Management System
                </h1>
                <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '32px', lineHeight: 1.6 }}>
                    A structured risk management process for high-risk AI systems, grounded in ISO 31000:2018, ISO/IEC 23894:2023, and NIST SP 800-30.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Scope & Criteria', desc: 'ISO 31000 Cl. 6.3' },
                        { label: 'Risk Assessment', desc: 'ISO/IEC 23894 Cl. 6.4' },
                        { label: 'Treatment', desc: 'ISO 31000 Cl. 6.5' },
                        { label: 'Reporting', desc: 'EU AI Act Annex IV' },
                    ].map(item => (
                        <div key={item.label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(79,195,247,0.3)', borderRadius: '10px', padding: '14px 20px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#4fc3f7' }}>{item.label}</div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{item.desc}</div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onStart}
                    style={{ padding: '16px 48px', background: '#4fc3f7', color: '#1a1a2e', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Start Assessment →
                </button>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '16px' }}>
                    Grounded in ISO 31000:2018 · ISO/IEC 23894:2023 · NIST SP 800-30 · NIST AI RMF 1.0
                </p>
            </div>
        </div>
    )
}

function FieldHint({ text }) {
    return <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 6px' }}>{text}</p>
}

function UserForm({ onBegin }) {
    const [form, setForm] = useState({ assessorName: '', role: '', aiSystemName: '', date: new Date().toISOString().split('T')[0] })
    const isValid = form.assessorName.trim() && form.role.trim() && form.aiSystemName.trim() && form.date

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '56px', width: '100%', maxWidth: '680px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '12px', letterSpacing: '2px', color: '#4fc3f7', textTransform: 'uppercase', marginBottom: '8px' }}>New Assessment</div>
                    <h2 style={{ margin: 0, fontSize: '24px', color: '#1a1a2e' }}>Who is conducting this assessment?</h2>
                    <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>This information will appear in the final report.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={styles.label}>Your Name</label>
                        <input style={styles.input} placeholder="e.g. Jane Smith" value={form.assessorName} onChange={e => setForm({ ...form, assessorName: e.target.value })} />
                    </div>
                    <div>
                        <label style={styles.label}>Your Role</label>
                        <input style={styles.input} placeholder="e.g. AI Compliance Officer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
                    </div>
                    <div>
                        <label style={styles.label}>AI System Name</label>
                        <input style={styles.input} placeholder="e.g. HR Screening Model" value={form.aiSystemName} onChange={e => setForm({ ...form, aiSystemName: e.target.value })} />
                    </div>
                    <div>
                        <label style={styles.label}>Assessment Date</label>
                        <input style={styles.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                </div>

                <button
                    onClick={() => isValid && onBegin(form)}
                    disabled={!isValid}
                    style={{ ...styles.button, width: '100%', marginTop: '28px', padding: '14px', fontSize: '15px', opacity: isValid ? 1 : 0.4, cursor: isValid ? 'pointer' : 'not-allowed' }}
                >
                    Begin Assessment →
                </button>
            </div>
        </div>
    )
}

function StepScope({ scope, setScope, likelihoodScale, setLikelihoodScale, impactScale, setImpactScale, assessmentId, onNext }) {
    const [form, setForm] = useState(scope)
    const isValid = form.domain && form.phase

    async function save() {
        setScope(form)
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_step: 2,
                    scope: form,
                    likelihood_scale: likelihoodScale,
                    impact_scale: impactScale,
                }),
            })
        } catch (error) {
            console.error('Failed to save scope:', error)
        }
        onNext()
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Scope & Criteria</h1>
            <p style={styles.sub}>Define the context of the AI system under assessment — ISO 31000 Cl. 6.3 · ISO/IEC 23894 Cl. 6.3</p>

            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>AI System Context</h3>
                <div style={styles.formGrid}>
                    <div>
                        <label style={styles.label}>Deployment Domain</label>
                        <FieldHint text="Filters the risk catalog to risks relevant to your sector." />
                        <select style={styles.input} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}>
                            <option value="">-- Select Domain --</option>
                            {DOMAINS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Lifecycle Stage (ISO/IEC 23894 Annex C)</label>
                        <FieldHint text="The current phase of your AI system — affects which risks are shown." />
                        <select style={styles.input} value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
                            <option value="">-- Select Phase --</option>
                            {PHASES.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <EditableScaleTable scale={likelihoodScale} setScale={setLikelihoodScale} title="Likelihood Scale" source="NIST SP 800-30 Table G-3" note="Used to assess the likelihood of each identified risk. Definitions can be adapted to organisational context." />
            <EditableScaleTable scale={impactScale} setScale={setImpactScale} title="Impact Scale" source="NIST SP 800-30 Table H-3" note="Used to assess the impact across organisational, individual, and societal dimensions (ISO/IEC 23894 Cl. 6.4.3.2)." />

            <NavButtons currentStep={1} onBack={() => {}} onNext={save} nextDisabled={!isValid} nextLabel="Save & Continue →" />
        </div>
    )
}

function StepRiskIdentification({ scope, risks, setRisks, assessmentId, onBack, onNext }) {
    const filtered = RISK_CATALOG.filter(r =>
        (!scope.domain || r.domains.includes(scope.domain)) &&
        (!scope.phase || r.phases.includes(scope.phase))
    )

    function toggle(risk) {
        if (risks.find(r => r.id === risk.id)) {
            setRisks(risks.filter(r => r.id !== risk.id))
        } else {
            setRisks([...risks, { ...risk, likelihood: 'Moderate', impact: 'Moderate', level: getRiskLevel('Moderate', 'Moderate') }])
        }
    }

    async function saveAndContinue() {
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_step: 3,
                    risks: risks,
                }),
            })
        } catch (error) {
            console.error('Failed to save risks:', error)
        }
        onNext()
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Identification</h1>
            <p style={styles.sub}>
                {scope.domain
                    ? `Showing risks for domain "${scope.domain}" · stage "${scope.phase}" — ISO/IEC 23894 Annex B & C`
                    : 'All catalog risks shown — no scope filter active.'}
            </p>
            <div style={{ ...styles.card, marginBottom: '16px', background: '#f0f7ff', border: '1px solid #b3d9f7' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1565c0' }}>
                    <strong>{risks.length}</strong> risk{risks.length !== 1 ? 's' : ''} selected so far. Select all risks relevant to your AI system. You will evaluate Likelihood and Impact in the next step.
                </p>
            </div>

            {filtered.length === 0 && <div style={styles.card}><p>No risks found for the selected context. Please adjust your scope.</p></div>}

            {filtered.map(risk => {
                const selected = !!risks.find(r => r.id === risk.id)
                return (
                    <div key={risk.id} style={{ ...styles.card, marginBottom: '10px', borderLeft: selected ? '4px solid #4fc3f7' : '4px solid #e0e0e0', background: selected ? '#f0f7ff' : '#fafafa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#1a1a2e' }}>{risk.title}</strong>
                                <p style={{ margin: '4px 0', color: '#555', fontSize: '14px' }}>{risk.description}</p>
                                <span style={styles.sourceTag}>{risk.source}</span>
                            </div>
                            <button style={{ ...(selected ? styles.buttonSelected : styles.buttonOutline), marginTop: 0, marginLeft: '16px', whiteSpace: 'nowrap' }} onClick={() => toggle(risk)}>
                                {selected ? '✓ Selected' : '+ Select'}
                            </button>
                        </div>
                    </div>
                )
            })}

            <NavButtons currentStep={2} onBack={onBack} onNext={saveAndContinue} nextDisabled={risks.length === 0} nextLabel={`Continue with ${risks.length} risk${risks.length !== 1 ? 's' : ''} →`} />
        </div>
    )
}

function StepRiskEvaluation({ risks, setRisks, likelihoodScale, impactScale, assessmentId, onBack, onNext }) {
    function update(id, field, value) {
        setRisks(risks.map(r => {
            if (r.id !== id) return r
            const updated = { ...r, [field]: value }
            updated.level = getRiskLevel(updated.likelihood, updated.impact)
            return updated
        }))
    }

    async function saveAndContinue() {
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_step: 4,
                    risks: risks,
                }),
            })
        } catch (error) {
            console.error('Failed to save risk evaluation:', error)
        }
        onNext()
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Evaluation</h1>
            <p style={styles.sub}>Assess Likelihood and Impact for each identified risk — NIST SP 800-30 Tables G-3, H-3, I-2</p>

            {risks.map(risk => {
                const c = levelColor(risk.level)
                return (
                    <div key={risk.id} style={{ ...styles.card, marginBottom: '12px', borderLeft: `4px solid ${c.text}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <strong>{risk.title}</strong>
                                <p style={{ margin: '4px 0 0', color: '#555', fontSize: '13px' }}>{risk.description}</p>
                            </div>
                            <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap', marginLeft: '16px' }}>{risk.level}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Likelihood (NIST SP 800-30 Table G-3)</label>
                                <FieldHint text="How likely is this risk to occur?" />
                                <select style={styles.input} value={risk.likelihood} onChange={e => update(risk.id, 'likelihood', e.target.value)}>
                                    {likelihoodScale.map(l => <option key={l.value}>{l.value}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Impact (NIST SP 800-30 Table H-3)</label>
                                <FieldHint text="How severe would the harm be if it occurred?" />
                                <select style={styles.input} value={risk.impact} onChange={e => update(risk.id, 'impact', e.target.value)}>
                                    {impactScale.map(i => <option key={i.value}>{i.value}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )
            })}

            <NavButtons currentStep={3} onBack={onBack} onNext={saveAndContinue} nextLabel="Continue to Treatment →" />
        </div>
    )
}

function StepTreatment({ risks, assessmentId, onBack, onNext }) {

    async function saveAndContinue() {
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_step: 5 }),
            })
        } catch (error) {
            console.error('Failed to save treatment step:', error)
        }
        onNext()
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Treatment</h1>
            <p style={styles.sub}>Define mitigation measures for each identified risk — ISO 31000 Cl. 6.5</p>
            <div style={styles.card}>
                {risks.length === 0
                    ? <p>No risks selected. Go back and select relevant risks first.</p>
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
            <NavButtons currentStep={4} onBack={onBack} onNext={saveAndContinue} nextLabel="Continue to Report →" />
        </div>
    )
}

function StepReport({ risks, scope, user, misuses, assessmentId, onBack }) {
    const high = risks.filter(r => r.level === 'High' || r.level === 'Very High').length

    async function finish() {
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            })
            alert('Assessment marked as completed!')
        } catch (error) {
            console.error('Failed to finish assessment:', error)
        }
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Report</h1>
            <p style={styles.sub}>Risk Assessment Documentation — EU AI Act Art. 9 · Annex IV</p>
            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>Assessment Summary</h3>
                <p><strong>Assessor:</strong> {user.assessorName} ({user.role})</p>
                <p><strong>AI System:</strong> {user.aiSystemName}</p>
                <p><strong>Date:</strong> {user.date}</p>
                <p><strong>Domain:</strong> {scope.domain || '—'}</p>
                <p><strong>Lifecycle Stage:</strong> {scope.phase || '—'}</p>
                <p><strong>Likelihood Scale:</strong> NIST SP 800-30 Table G-3</p>
                <p><strong>Impact Scale:</strong> NIST SP 800-30 Table H-3</p>
                <p><strong>Risk Combination:</strong> NIST SP 800-30 Table I-2</p>
                <p><strong>Total Risks Identified:</strong> {risks.length}</p>
                <p><strong>High / Very High Risks:</strong> {high}</p>
                <p><strong>Misuse Scenarios:</strong> {misuses.length}</p>
                <p><strong>Status:</strong> {risks.length === 0 ? 'No assessment conducted' : 'Assessment complete'}</p>
                <button style={styles.button}>Download Report (PDF)</button>
            </div>
            <NavButtons currentStep={5} onBack={onBack} onNext={finish} nextLabel="✓ Finish" />
        </div>
    )
}

//Style
const styles = {
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '56px', background: '#1a1a2e', color: 'white' },
    navBrand: { fontWeight: 'bold', fontSize: '18px', color: '#4fc3f7', letterSpacing: '1px' },
    stepperWrap: { background: 'white', borderBottom: '1px solid #e0e0e0', padding: '20px 48px' },
    stepperInner: { display: 'flex', alignItems: 'flex-start', maxWidth: '900px' },
    page: { padding: '40px 48px', width: '100%', boxSizing: 'border-box' },
    heading: { fontSize: '28px', marginBottom: '8px', color: '#1a1a2e' },
    sub: { color: '#666', marginBottom: '24px', fontSize: '14px' },
    card: { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', background: '#fafafa' },
    cardRow: { display: 'flex', gap: '16px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    label: { display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px', fontWeight: '500' },
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

export default function App() {
    const [screen, setScreen] = useState('landing') // landing | form | steps
    const [currentStep, setCurrentStep] = useState(1)
    const [user, setUser] = useState({ assessorName: '', role: '', aiSystemName: '', date: '' })
    const [scope, setScope] = useState({ domain: '', phase: '' })
    const [risks, setRisks] = useState([])
    const [misuses, setMisuses] = useState([])
    const [likelihoodScale, setLikelihoodScale] = useState(DEFAULT_LIKELIHOOD_SCALE)
    const [impactScale, setImpactScale] = useState(DEFAULT_IMPACT_SCALE)
    const [misueModalOpen, setMisuseModalOpen] = useState(false)
    const [assessmentId, setAssessmentId] = useState(null)

    async function handleBegin(formData) {
        try {
            const response = await fetch('http://127.0.0.1:8000/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ai_system: {
                        assessor_name: formData.assessorName,
                        role: formData.role,
                        ai_system_name: formData.aiSystemName,
                        date: formData.date,
                    },
                    scope: { domain: '', phase: '' },
                    likelihood_scale: likelihoodScale,
                    impact_scale: impactScale,
                }),
            })
            const created = await response.json()

            setUser(formData)
            setAssessmentId(created.id)
            setScreen('steps')
            setCurrentStep(1)
        } catch (error) {
            console.error('Failed to create assessment:', error)
            alert('Could not connect to the backend. Is the server running?')
        }
    }

    function renderStep() {
        switch (currentStep) {
            case 1: return <StepScope scope={scope} setScope={setScope} likelihoodScale={likelihoodScale} setLikelihoodScale={setLikelihoodScale} impactScale={impactScale} setImpactScale={setImpactScale} assessmentId={assessmentId} onNext={() => setCurrentStep(2)} />
            case 2: return <StepRiskIdentification scope={scope} risks={risks} setRisks={setRisks} assessmentId={assessmentId} onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />
            case 3: return <StepRiskEvaluation risks={risks} setRisks={setRisks} likelihoodScale={likelihoodScale} impactScale={impactScale} assessmentId={assessmentId} onBack={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)} />
            case 4: return <StepTreatment risks={risks} assessmentId={assessmentId} onBack={() => setCurrentStep(3)} onNext={() => setCurrentStep(5)} />
            case 5: return <StepReport risks={risks} scope={scope} user={user} misuses={misuses} assessmentId={assessmentId} onBack={() => setCurrentStep(4)} />
            default: return null
        }
    }

    if (screen === 'landing') return <LandingPage onStart={() => setScreen('form')} />
    if (screen === 'form') return <UserForm onBegin={handleBegin} />

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <nav style={styles.nav}>
                <div style={styles.navBrand}>RMS</div>
                <div style={{ fontSize: '13px', color: '#888' }}>
                    {user.aiSystemName} · {user.assessorName}
                </div>
            </nav>

            <Stepper currentStep={currentStep} onStepClick={setCurrentStep} />

            <div style={{ width: '100%' }}>
                {renderStep()}
            </div>

            <MisueFloatingButton onClick={() => setMisuseModalOpen(true)} count={misuses.length} />
            {misueModalOpen && (
                <MisuseModal
                    misuses={misuses}
                    setMisuses={setMisuses}
                    likelihoodScale={likelihoodScale}
                    impactScale={impactScale}
                    onClose={() => setMisuseModalOpen(false)}
                />
            )}
        </div>
    )
}