import { useState, useEffect } from 'react'
import jsPDF from 'jspdf' //Zur PDF-Generierung


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
    { value: 'Low', score: 2, description: 'The threat event could be expected to have a limited adverse effect - minor damage to assets, minor financial loss, or minor harm to individuals.' },
    { value: 'Moderate', score: 5, description: 'The threat event could be expected to have a serious adverse effect - significant degradation of mission capability or significant harm to individuals.' },
    { value: 'High', score: 8, description: 'The threat event could be expected to have a severe or catastrophic adverse effect - major damage to assets, major financial loss, or severe harm to individuals.' },
    { value: 'Very High', score: 10, description: 'The threat event could be expected to have multiple severe or catastrophic adverse effects on operations, assets, and individuals.' },
]

//NIST SP 800-30 Table I-2 --> Risk Level
function getRiskLevel(likelihood, impact) {
    const table = {
        'Very High': { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'High', 'High': 'Very High', 'Very High': 'Very High' },
        'High':      { 'Very Low': 'Low', 'Low': 'Moderate', 'Moderate': 'Moderate', 'High': 'High', 'Very High': 'Very High' },
        'Moderate':  { 'Very Low': 'Low', 'Low': 'Low', 'Moderate': 'Moderate', 'High': 'Moderate', 'Very High': 'High' },
        'Low':       { 'Very Low': 'Very Low', 'Low': 'Low', 'Moderate': 'Low', 'High': 'Low', 'Very High': 'Moderate' },
        'Very Low':  { 'Very Low': 'Very Low', 'Low': 'Very Low', 'Moderate': 'Very Low', 'High': 'Low', 'Very High': 'Low' },
    }
    return table[likelihood]?.[impact] ?? '-'
}

//Liste der Risk Sources
const RISK_CATALOG = [
    { id: 1, title: 'Biased training data', description: 'Training data does not represent the deployment population, leading to unfair outcomes.', source: 'ISO/IEC 23894 Annex B.5', domains: ['Healthcare', 'HR & Recruitment', 'Finance', 'Law Enforcement', 'Education'], phases: ['Inception', 'Design and Development'] },
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

//Scope & Criteria
const PHASES = ['Inception', 'Design and Development', 'Verification and Validation', 'Deployment', 'Operation and Monitoring', 'Re-evaluation', 'Retirement or Replacement']
const DOMAINS = ['Healthcare', 'Finance', 'HR & Recruitment', 'Education', 'Law Enforcement']

//Misuse
const MISUSE_CATEGORIES = [
    'Use beyond intended scope',
    'Adversarial attack / prompt injection',
    'Privacy violation through unauthorized use',
    'Disinformation & deception',
    'Overreliance by uninformed user',
    'Bias amplification through misuse',
    'Psychological manipulation',
]

//Automatisierter Vorschlage für Risk Treatment von "Biased Training Data" und "Discriminatory decisions"
const TREATMENT_SUGGESTIONS = {
    1: {
        option: 'Remove risk source',
        note: 'Apply dataset rebalancing and bias audit before deployment. Validate demographic parity across all affected groups.',
        hasSimulation: true,
        simulationButton: 'Run Bias Audit & Rebalance Dataset',
        simulationResult: 'Bias audit complete. Underrepresented groups rebalanced. Dataset fairness score: 94%',
        simulationResidualLikelihood: 'Low',
        simulationResidualImpact: 'Low',
    },
    10: {
        option: 'Remove risk source',
        note: 'Apply fairness constraints during training and conduct regular disparate impact audits post-deployment.',
        hasSimulation: true,
        simulationButton: 'Apply Fairness Constraints',
        simulationResult: 'Fairness check complete. Affected borrower groups identified and corrected. Loan approval rate gap reduced from 31% to 5%.',
        simulationResidualLikelihood: 'Low',
        simulationResidualImpact: 'Moderate',
    },
}

//5 Prozessschritte
const STEPS = [
    { id: 1, label: 'Scope & Criteria', sub: 'ISO 31000 Cl. 6.3' },
    { id: 2, label: 'Risk Identification', sub: 'ISO/IEC 23894 Cl. 6.4.2' },
    { id: 3, label: 'Risk Evaluation', sub: 'ISO/IEC 23894 Cl. 6.4.3' },
    { id: 4, label: 'Treatment', sub: 'ISO 31000 Cl. 6.5' },
    { id: 5, label: 'Report', sub: 'EU AI Act Art. 9' },
]

//Hilfsfunktion für die Farbe
const levelColor = (level) => {
    if (level === 'Very High' || level === 'High') return { bg: '#fdecea', text: '#c62828' }
    if (level === 'Moderate') return { bg: '#fff3e0', text: '#e65100' }
    if (level === 'Low') return { bg: '#e8f5e9', text: '#2e7d32' }
    return { bg: '#f5f5f5', text: '#888' }
}

//Einheitliches Farbschema
const COLORS = {
    navy: '#1a1a2e',
    accent: '#4fc3f7',
    bgLight: '#c9dced',
    cardBg: '#ffffff',
    cardBorder: '#a8c8e0',
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
                                <div style={{ fontSize: '10px', color: '#6b7d94', textAlign: 'center', whiteSpace: 'nowrap' }}>
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

//Back/Next Buttons auf jeder Seite
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

//Misuse model --> Button oben rechts
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

//Panel welches erscheint, wenn man auf den Button klickt
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
                    Reasonably foreseeable misuse - EU AI Act Art. 9(2)(b) · Seghid et al. (2026)<br />
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

//Scope & Criteria
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

//Hauptseite
function LandingPage({ onStart, onResume }) {

    const [assessments, setAssessments] = useState([])
    const [loading, setLoading] = useState(true)

    //Beim Laden der Landing Page: alle Assessments vom Backend holen
    useEffect(() => {
        fetch('http://127.0.0.1:8000/assessments')
            .then(r => r.json())
            .then(data => { setAssessments(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #243652 0%, #1a4a7a 55%, #2b6ca3 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
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
                <p style={{ fontSize: '12px', color: '#8fa5c2', marginTop: '16px' }}>
                    Grounded in ISO 31000:2018 · ISO/IEC 23894:2023 · NIST SP 800-30 · NIST AI RMF 1.0
                </p>
                {/* Assessments Liste */}
                {!loading && assessments.length > 0 && (
                    <div style={{ marginTop: '48px', textAlign: 'left' }}>
                        <h3 style={{ color: '#4fc3f7', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
                            Resume an Assessment
                        </h3>
                        {assessments.map(a => {
                            const isComplete = a.status === 'completed'
                            const stepLabel = STEPS.find(s => s.id === a.current_step)?.label || 'Unknown'
                            return (
                                <div key={a.id} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(79,195,247,0.2)', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>
                                            {a.ai_system.ai_system_name}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
                                            {a.ai_system.assessor_name} · {a.ai_system.date}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#7a90ab', marginTop: '4px' }}>
                                            ID: {a.id}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: isComplete ? 'rgba(46,125,50,0.3)' : 'rgba(79,195,247,0.2)', color: isComplete ? '#81c784' : '#4fc3f7', fontWeight: 'bold' }}>
                                            {isComplete ? '✓ Completed' : `In Progress · Step ${a.current_step}`}
                                        </span>
                                        {isComplete && (() => {
                                            const idx = PHASES.indexOf(a.scope?.phase)
                                            const pending = idx >= 0 ? PHASES.slice(idx + 1) : []
                                            const pendingLabel = pending.length > 2
                                                ? `${pending.slice(0, 2).join(', ')} +${pending.length - 2} more`
                                                : pending.join(', ')
                                            return (
                                                <div style={{ fontSize: '11px', color: '#8fa5c2', textAlign: 'right', maxWidth: '260px', lineHeight: 1.5 }}>
                                                    Stage: <strong style={{ color: '#4fc3f7' }}>{a.scope?.phase || '-'}</strong>
                                                    {pending.length > 0 ? (
                                                        <div>Pending: {pendingLabel}</div>
                                                    ) : (
                                                        <div style={{ color: '#81c784' }}>Final stage reached</div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                        <button
                                            onClick={() => onResume(a)}
                                            style={{ padding: '8px 16px', background: isComplete ? 'transparent' : '#4fc3f7', color: isComplete ? '#4fc3f7' : '#1a1a2e', border: isComplete ? '1px solid #4fc3f7' : 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            {isComplete ? 'Review & Update →' : 'Resume →'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

//Accuracy interpretieren
function interpretAccuracy(accuracy) {
    const chanceLevelNote = accuracy <= 0.5 ? " That's around chance level for a yes/no decision." : ""
    return `${Math.round(accuracy * 100)}% of decisions matched the ground truth in this small test.${chanceLevelNote} There's no fixed accuracy number required by law for this - it is something we define and justify ourselves for this project.`
}

//Fairness interpretieren
function interpretFairness(cf) {
    const threshold = 0.1
    if (cf <= threshold) {
        return `At or below ${threshold} (the threshold demonstrated for this metric family in IEEE Std 3198-2025, Cl. 7.3.1), meaning the fairness requirement would be considered met in that reference example - though n=5 pairs is a small sample.`
    }
    const multiple = (cf / threshold).toFixed(1)
    return `Above the ${threshold} threshold demonstrated in IEEE Std 3198-2025 (Cl. 7.3.1) for this metric family - about ${multiple}x that reference value. In that worked example, exceeding this threshold means the fairness requirement is not met.`
}

//Precision interpretieren
function interpretPrecision(precision) {
    const pct = Math.round(precision * 100)
    return `Of all applicants the model approved, ${pct}% actually should have been approved according to ground truth.`
}

//Recall interpretieren
function interpretRecall(recall) {
    const pct = Math.round(recall * 100)
    return `Of all applicants who should have been approved, the model correctly approved ${pct}% of them. Aji & Dhini (2019) highlight this kind of measure as more important than plain Accuracy in credit scoring.`
}

//Specificity interpretieren
function interpretSpecificity(specificity) {
    const pct = Math.round(specificity * 100)
    return `Of all applicants who should have been rejected, the model correctly rejected ${pct}% of them.`
}

//F1 interpretieren
function interpretF1(f1) {
    const pct = Math.round(f1 * 100)
    return `F1 combines Precision and Recall into one score (${pct}%).`
}

function AIModelCheckPanel({ modelCheckResult, occlusionResult, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <div style={{ background: 'white', width: '640px', maxWidth: '90vw', height: '100vh', overflowY: 'auto', padding: '32px', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>AI Model Check Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
                </div>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                    Results from the last run in Risk Identification. Go back there to re-run the check.
                </p>

                {!modelCheckResult && !occlusionResult && (
                    <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                        No AI model check has been run yet.
                    </p>
                )}

                {modelCheckResult && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ padding: '14px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Accuracy</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.round(modelCheckResult.accuracy * 100)}%</div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', marginTop: '8px' }}>{interpretAccuracy(modelCheckResult.accuracy)}</p>
                            </div>
                            <div style={{ padding: '14px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Counterfactual Fairness</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: modelCheckResult.counterfactual_fairness > 0.1 ? '#c62828' : '#2e7d32' }}>{modelCheckResult.counterfactual_fairness}</div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', marginTop: '8px' }}>{interpretFairness(modelCheckResult.counterfactual_fairness)}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            {modelCheckResult.precision !== null && (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ fontSize: '11px', color: '#5a5a5a' }}>Precision</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{modelCheckResult.precision}</div>
                                    <p style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '6px' }}>{interpretPrecision(modelCheckResult.precision)}</p>
                                </div>
                            )}
                            {modelCheckResult.recall !== null && (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ fontSize: '11px', color: '#5a5a5a' }}>Recall</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{modelCheckResult.recall}</div>
                                    <p style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '6px' }}>{interpretRecall(modelCheckResult.recall)}</p>
                                </div>
                            )}
                            {modelCheckResult.specificity !== null && (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ fontSize: '11px', color: '#5a5a5a' }}>Specificity</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{modelCheckResult.specificity}</div>
                                    <p style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '6px' }}>{interpretSpecificity(modelCheckResult.specificity)}</p>
                                </div>
                            )}
                            {modelCheckResult.f1_score !== null && (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                    <div style={{ fontSize: '11px', color: '#5a5a5a' }}>F1-Score</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{modelCheckResult.f1_score}</div>
                                    <p style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '6px' }}>{interpretF1(modelCheckResult.f1_score)}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {occlusionResult && (
                    <div>
                        <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>Occlusion (Applicant #{occlusionResult.applicant_id})</h3>
                        <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                            Baseline decision: <strong>{occlusionResult.baseline_decision}</strong>
                        </p>
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Field removed</th>
                                <th style={styles.th}>Decision</th>
                                <th style={styles.th}>Changed?</th>
                            </tr>
                            </thead>
                            <tbody>
                            {occlusionResult.occlusion_results.map(r => (
                                <tr key={r.omitted_field}>
                                    <td style={styles.td}>{r.omitted_field}</td>
                                    <td style={styles.td}>{r.decision_without_field}</td>
                                    <td style={styles.td}>
                                        {r.changed_from_baseline
                                            ? <span style={{ color: '#c62828', fontWeight: 'bold' }}>Yes</span>
                                            : <span style={{ color: '#999' }}>No</span>}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function FieldHint({ text }) {
    return <p style={{ fontSize: '12px', color: '#5a5a5a', margin: '2px 0 6px' }}>{text}</p>
}

//Muss vom User ausgefüllt werden
function UserForm({ onBegin }) {
    const [form, setForm] = useState({ assessorName: '', role: '', aiSystemName: '', date: new Date().toISOString().split('T')[0] })
    const isValid = form.assessorName.trim() && form.role.trim() && form.aiSystemName.trim() && form.date

    return (
        <div style={{ minHeight: '100vh', background: COLORS.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>            <div style={{ background: 'white', borderRadius: '12px', padding: '56px', width: '100%', maxWidth: '680px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
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
                        <input style={styles.input} placeholder="e.g. Credit Scoring Model" value={form.aiSystemName} onChange={e => setForm({ ...form, aiSystemName: e.target.value })} />
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

//Scope & Criteria Seite
function StepScope({ scope, setScope, likelihoodScale, setLikelihoodScale, impactScale, setImpactScale, assessmentId, previousPhase, onNext }) {
    const [form, setForm] = useState(scope)
    const isValid = form.domain && form.phase
    const isReassessment = !!previousPhase
    const phaseUnchanged = isReassessment && form.phase === previousPhase

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
            <p style={styles.sub}>Define the context of the AI system under assessment - ISO 31000 Cl. 6.3 · ISO/IEC 23894 Cl. 6.3</p>

            {isReassessment && (
                <div style={{ ...styles.card, marginBottom: '16px', background: '#fff8e1', border: '1px solid #f9a825' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#8d6e00' }}>
                        <strong>Re-assessment detected.</strong> This AI system was last assessed at lifecycle stage "<strong>{previousPhase}</strong>".
                        The Domain typically stays the same across re-assessments of the same system - please check below whether the
                        <strong> Lifecycle Stage</strong> needs to be updated to reflect progress.
                    </p>
                </div>
            )}

            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>AI System Context</h3>
                <label style={styles.label}>Deployment Domain</label>
                <FieldHint text="Filters the risk catalog to risks relevant to your sector. Usually unchanged across re-assessments of the same system." />
                <select style={styles.input} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}>
                    <option value="">- Select Domain -</option>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
            </div>

            <div style={{
                ...styles.card,
                marginTop: '16px',
                border: `3px solid ${phaseUnchanged ? '#f9a825' : COLORS.accent}`,
                background: COLORS.cardBg,
                boxShadow: `0 0 0 4px ${phaseUnchanged ? 'rgba(249,168,37,0.12)' : 'rgba(79,195,247,0.12)'}`,
            }}>
                {isReassessment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                        <span style={{
                            fontSize: '11px', fontWeight: 'bold', color: 'white', background: COLORS.accent,
                            padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px',
                        }}>
                            CHANGES AS SYSTEM PROGRESSES
                        </span>
                    </div>
                )}
                <label style={{ ...styles.label, fontSize: '15px', fontWeight: 'bold', color: COLORS.navy, marginTop: '8px' }}>
                    Lifecycle Stage
                </label>
                <FieldHint text="The Domain above usually stays the same across re-assessments - this is the field that changes as your AI system moves forward in its lifecycle (ISO/IEC 23894 Annex C)." />
                <select
                    style={{ ...styles.input, borderColor: phaseUnchanged ? '#f9a825' : COLORS.accent }}
                    value={form.phase}
                    onChange={e => setForm({ ...form, phase: e.target.value })}
                >
                    <option value="">- Select Phase -</option>
                    {PHASES.map(p => <option key={p}>{p}</option>)}
                </select>

                {isReassessment && (
                    phaseUnchanged ? (
                        <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#8d6e00', fontWeight: 'bold' }}>
                            Still set to the same stage as last time ("{previousPhase}"). If the system has progressed, please update it.
                        </p>
                    ) : (
                        <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>
                            Updated from "{previousPhase}" to "{form.phase}".
                        </p>
                    )
                )}
            </div>

            <EditableScaleTable scale={likelihoodScale} setScale={setLikelihoodScale} title="Likelihood Scale" source="NIST SP 800-30 Table G-3" note="Used to assess the likelihood of each identified risk. Definitions can be adapted to organisational context." />
            <EditableScaleTable scale={impactScale} setScale={setImpactScale} title="Impact Scale" source="NIST SP 800-30 Table H-3" note="Used to assess the impact across organisational, individual, and societal dimensions (ISO/IEC 23894 Cl. 6.4.3.2)." />

            <NavButtons currentStep={1} onBack={() => {}} onNext={save} nextDisabled={!isValid} nextLabel="Save & Continue →" />
        </div>
    )
}

//Risiken hinzufügen
function StepRiskIdentification({scope, risks, setRisks, assessmentId, onBack, onNext, modelCheckLoading, modelCheckResult, modelCheckError, runModelCheck, occlusionApplicantId, setOcclusionApplicantId, occlusionLoading, occlusionResult, occlusionError, runOcclusionTest,}) {
    const filtered = RISK_CATALOG.filter(r =>
        (!scope.domain || r.domains.includes(scope.domain)) &&
        (!scope.phase || r.phases.includes(scope.phase))
    )

    function toggle(risk) {
        if (risks.find(r => r.id === risk.id)) {
            setRisks(risks.filter(r => r.id !== risk.id))
        } else {
            setRisks([...risks, {
                ...risk,
                likelihood: 'Moderate',
                impact: 'Moderate',
                level: getRiskLevel('Moderate', 'Moderate'),
                treatmentStatus: 'none',
                treatmentOption: '',
                treatmentNote: '',
                residualLikelihood: 'Moderate',
                residualImpact: 'Moderate',
                residualLevel: getRiskLevel('Moderate', 'Moderate'),
            }])
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
                    ? `Showing risks for domain "${scope.domain}" · stage "${scope.phase}" - ISO/IEC 23894 Annex B & C`
                    : 'All catalog risks shown - no scope filter active.'}
            </p>
            <div style={{ ...styles.card, marginBottom: '16px', background: '#f0f7ff', border: '1px solid #b3d9f7' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1565c0' }}>
                    <strong>{risks.length}</strong> risk{risks.length !== 1 ? 's' : ''} selected so far. Select all risks relevant to your AI system. You will evaluate Likelihood and Impact in the next step.
                </p>
            </div>

            <div style={{ ...styles.card, marginBottom: '16px', background: '#f0f7ff', border: '1px solid #b3d9f7' }}>
                <h3 style={{ marginTop: 0, fontSize: '15px' }}>AI Model Technical Check</h3>
                <p style={{ fontSize: '13px', color: '#5a5a5a', marginBottom: '12px' }}>
                    Runs the connected AI system (Gemma-3-1B via Ollama) against a small test set of credit applications
                    to measure Accuracy and Counterfactual Fairness. Run this before
                    selecting risks below, so the selection can be informed by the technical evidence.
                </p>
                <button
                    onClick={runModelCheck}
                    disabled={modelCheckLoading}
                    style={{ ...styles.button, marginTop: 0, opacity: modelCheckLoading ? 0.6 : 1, cursor: modelCheckLoading ? 'not-allowed' : 'pointer' }}
                >
                    {modelCheckLoading ? 'Running Test...' : 'Run AI Model Check'}
                </button>

                {modelCheckError && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fdecea', border: '1px solid #c62828', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#c62828' }}>{modelCheckError}</p>
                    </div>
                )}

                {modelCheckResult && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px', padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                            <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Accuracy</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' }}>
                                {Math.round(modelCheckResult.accuracy * 100)}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                                over {modelCheckResult.sample_size} test applicants
                            </div>
                            <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                {interpretAccuracy(modelCheckResult.accuracy)}
                            </p>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px', padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                            <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Counterfactual Fairness</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: modelCheckResult.counterfactual_fairness > 0.1 ? '#c62828' : '#2e7d32' }}>
                                {modelCheckResult.counterfactual_fairness}
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                                share of paired applicants (identical data, different gender) whose decision flipped
                            </div>
                            <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                {interpretFairness(modelCheckResult.counterfactual_fairness)}
                            </p>
                        </div>
                    </div>
                )}

                {modelCheckResult && (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        {modelCheckResult.precision !== null && (
                            <div style={{ padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Precision</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
                                    {modelCheckResult.precision}
                                </div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                    {interpretPrecision(modelCheckResult.precision)}
                                </p>
                            </div>
                        )}
                        {modelCheckResult.recall !== null && (
                            <div style={{ padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Recall</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
                                    {modelCheckResult.recall}
                                </div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                    {interpretRecall(modelCheckResult.recall)}
                                </p>
                            </div>
                        )}
                        {modelCheckResult.specificity !== null && (
                            <div style={{ padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>Specificity</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
                                    {modelCheckResult.specificity}
                                </div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                    {interpretSpecificity(modelCheckResult.specificity)}
                                </p>
                            </div>
                        )}
                        {modelCheckResult.f1_score !== null && (
                            <div style={{ padding: '14px', background: 'white', borderRadius: '8px', border: '1px solid #d6e8f5' }}>
                                <div style={{ fontSize: '12px', color: '#5a5a5a' }}>F1-Score</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
                                    {modelCheckResult.f1_score}
                                </div>
                                <p style={{ fontSize: '12px', color: '#5a5a5a', margin: 0, borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                    {interpretF1(modelCheckResult.f1_score)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {modelCheckResult && modelCheckResult.unclear_count > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fff3e0', border: '1px solid #e65100', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#e65100' }}>
                            {modelCheckResult.unclear_count} response(s) could not be clearly classified as "approved" or "rejected"
                            and were excluded from Precision/Recall/Specificity/F1.
                        </p>
                    </div>
                )}
            </div>

            <div style={{ ...styles.card, marginBottom: '16px', background: '#f0f7ff', border: '1px solid #b3d9f7' }}>
                <h3 style={{ marginTop: 0, fontSize: '15px' }}>AI Model Explainability Check (Occlusion)</h3>
                <p style={{ fontSize: '13px', color: '#5a5a5a', marginBottom: '12px' }}>
                    Removes one input field at a time from a single test applicant to see which features actually
                    influence the model's decision.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ ...styles.label, marginBottom: 0 }}>Test applicant:</label>
                    <select
                        style={{ ...styles.input, width: '80px' }}
                        value={occlusionApplicantId}
                        onChange={e => setOcclusionApplicantId(Number(e.target.value))}
                    >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(id => (
                            <option key={id} value={id}>#{id}</option>
                        ))}
                    </select>
                    <button
                        onClick={runOcclusionTest}
                        disabled={occlusionLoading}
                        style={{ ...styles.button, marginTop: 0, opacity: occlusionLoading ? 0.6 : 1, cursor: occlusionLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {occlusionLoading ? 'Running Test...' : 'Run Occlusion Test'}
                    </button>
                </div>

                {occlusionError && (
                    <div style={{ padding: '10px 14px', background: '#fdecea', border: '1px solid #c62828', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#c62828' }}>{occlusionError}</p>
                    </div>
                )}

                {occlusionResult && (
                    <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                            Baseline decision (all fields present): <strong>{occlusionResult.baseline_decision}</strong>
                        </p>
                        <p style={{ fontSize: '13px', color: '#5a5a5a', marginBottom: '12px' }}>
                            {(() => {
                                const influential = occlusionResult.occlusion_results.filter(r => r.changed_from_baseline).map(r => r.omitted_field)
                                return influential.length === 0
                                    ? "No single field changed the decision when removed - the model's decision appears to rely on the combination of all fields together, or is not clearly sensitive to any one feature in this test."
                                    : `The decision changed when removing: ${influential.join(', ')}. This suggests these fields carry the most weight in this specific case - worth checking whether that matches what a credit officer should actually prioritize.`
                            })()}
                        </p>
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Field removed</th>
                                <th style={styles.th}>Decision without it</th>
                                <th style={styles.th}>Changed the outcome?</th>
                            </tr>
                            </thead>
                            <tbody>
                            {occlusionResult.occlusion_results.map(r => (
                                <tr key={r.omitted_field}>
                                    <td style={styles.td}>{r.omitted_field}</td>
                                    <td style={styles.td}>{r.decision_without_field}</td>
                                    <td style={styles.td}>
                                        {r.changed_from_baseline ? (
                                            <span style={{ color: '#c62828', fontWeight: 'bold' }}>Yes - influential</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>No</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
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

//Risk level Berechnung
function StepRiskEvaluation({ risks, setRisks, likelihoodScale, impactScale, assessmentId, onBack, onNext, modelCheckResult, occlusionResult, onOpenModelCheckPanel }) {
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
            <p style={styles.sub}>Assess Likelihood and Impact for each identified risk - NIST SP 800-30 Tables G-3, H-3, I-2</p>

            {(modelCheckResult || occlusionResult) && (
                <button
                    onClick={onOpenModelCheckPanel}
                    style={{ ...styles.buttonOutline, marginBottom: '16px', display: 'block' }}
                >
                    View AI Model Check Results
                </button>
            )}

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

//Treatment options aus ISO 31000 --> 6.5.2
const ISO_TREATMENT_OPTIONS = [
    'Avoid the risk',
    'Remove risk source',
    'Change likelihood',
    'Change consequences',
    'Share the risk',
    'Retain the risk by informed decision',
]

const TREATMENT_OPTION_EXPLANATIONS= {
    'Avoid the risk': 'Deciding not to start or continue with the activity that gives rise to the risk.',
    'Remove risk source': 'Eliminating the actual origin of the risk rather than just softening its effects - e.g. removing a biased data source or a faulty model component.',
    'Change likelihood': 'Taking measures that reduce the probability of the risk occurring, without eliminating its source.',
    'Change consequences': 'Reducing the severity of impact if the risk materializes, e.g. through safeguards or fallback mechanisms.',
    'Share the risk': 'Transferring part of the risk to another party, e.g. through contracts or insurance.',
    'Retain the risk by informed decision': 'Knowingly accepting the risk as-is, based on an informed trade-off between benefit and risk.',
}

function StepTreatment({ risks, setRisks, assessmentId, onBack, onNext, modelCheckResult, occlusionResult, onOpenModelCheckPanel }) {
    const [simulating, setSimulating] = useState(null) // speichert die ID des Risikos das gerade simuliert wird
    const [simDone, setSimDone] = useState({}) // speichert welche Simulationen bereits abgeschlossen sind

    const allGreen = risks.every(r => r.treatmentStatus === 'confirmed')


    async function runSimulation(id) {
        const suggestion = TREATMENT_SUGGESTIONS[id]
        if (!suggestion?.hasSimulation) return

        setSimulating(id) //Ladeanimation starten

        //2 Sekunden warten - simuliert dass im Hintergrund etwas passiert
        await new Promise(resolve => setTimeout(resolve, 2000))

        //Ergebnis setzen
        setRisks(risks.map(r => r.id !== id ? r : {
            ...r,
            treatmentOption: suggestion.option,
            treatmentNote: suggestion.note,
            residualLikelihood: suggestion.simulationResidualLikelihood,
            residualImpact: suggestion.simulationResidualImpact,
            residualLevel: getRiskLevel(suggestion.simulationResidualLikelihood, suggestion.simulationResidualImpact),
            treatmentStatus: 'suggested',
        }))

        setSimulating(null) //Ladeanimation stoppen
        setSimDone(prev => ({ ...prev, [id]: true })) //Simulation als abgeschlossen markieren
    }

    function applyAuto(id) {
        const suggestion = TREATMENT_SUGGESTIONS[id]
        if (!suggestion) return
        setRisks(risks.map(r => r.id !== id ? r : {
            ...r,
            treatmentOption: suggestion.option,
            treatmentNote: suggestion.note,
            treatmentStatus: 'suggested',
            residualLikelihood: suggestion.simulationResidualLikelihood || r.residualLikelihood,
            residualImpact: suggestion.simulationResidualImpact || r.residualImpact,
            residualLevel: getRiskLevel(
                suggestion.simulationResidualLikelihood || r.residualLikelihood,
                suggestion.simulationResidualImpact || r.residualImpact
            ),
        }))
    }

    //Berechnung des neuen Risk levels anhand der Residuals
    function updateTreatment(id, field, value) {
        setRisks(risks.map(r => {
            if (r.id !== id) return r
            const updated = { ...r, [field]: value }
            if (field === 'residualLikelihood' || field === 'residualImpact') {
                updated.residualLevel = getRiskLevel(
                    field === 'residualLikelihood' ? value : r.residualLikelihood,
                    field === 'residualImpact' ? value : r.residualImpact
                )
            }
            return updated
        }))
    }

    //Überprüfen des neuen Levels
    function confirmTreatment(id) {
        const risk = risks.find(r => r.id === id)
        if (!risk) return
        const stillHigh = risk.residualLevel === 'High' || risk.residualLevel === 'Very High'
        if (stillHigh) {
            alert(`Residual risk is still "${risk.residualLevel}". Please refine your treatment measure before confirming.`)
            return
        }
        setRisks(risks.map(r => r.id !== id ? r : { ...r, treatmentStatus: 'confirmed' }))
    }

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

    const statusColor = (status) => {
        if (status === 'confirmed') return { bg: '#e8f5e9', border: '#2e7d32', dot: '#2e7d32', label: '🟢 Treated' }
        if (status === 'suggested') return { bg: '#fff3e0', border: '#e65100', dot: '#e65100', label: '🟡 In Progress' }
        return { bg: '#fdecea', border: '#c62828', dot: '#c62828', label: '🔴 No Treatment' }
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risk Treatment</h1>
            <p style={styles.sub}>Define and confirm mitigation measures - ISO 31000 Cl. 6.5</p>

            {(modelCheckResult || occlusionResult) && (
                <button
                    onClick={onOpenModelCheckPanel}
                    style={{ ...styles.buttonOutline, marginBottom: '16px', display: 'block' }}
                >
                    View AI Model Check Results
                </button>
            )}

            {/* Ampel Übersicht */}
            <div style={{ ...styles.card, marginBottom: '24px', background: allGreen ? '#e8f5e9' : '#fff3e0', border: `1px solid ${allGreen ? '#2e7d32' : '#e65100'}` }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: allGreen ? '#2e7d32' : '#e65100' }}>
                    {allGreen
                        ? '🟢 All risks treated - you may proceed to the Report.'
                        : `🟡 ${risks.filter(r => r.treatmentStatus !== 'confirmed').length} risk(s) still require treatment before you can proceed.`}
                </p>
            </div>

            {risks.map(risk => {
                const c = levelColor(risk.level)
                const rc = levelColor(risk.residualLevel)
                const s = statusColor(risk.treatmentStatus)

                return (
                    <div key={risk.id} style={{ ...styles.card, marginBottom: '20px', borderLeft: `4px solid ${s.border}`, background: s.bg }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <strong style={{ fontSize: '15px' }}>{risk.title}</strong>
                                <p style={{ margin: '4px 0 0', color: '#555', fontSize: '13px' }}>{risk.description}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginLeft: '16px' }}>
                                <span style={{ ...styles.badge, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
                                    Initial: {risk.level}
                                </span>
                                <span style={{ fontSize: '12px', color: s.border, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{s.label}</span>
                            </div>
                        </div>

                        {risk.treatmentStatus !== 'confirmed' && (
                            <>
                                {/* Phase 1 - Treatment definieren */}
                                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '14px', marginBottom: '14px' }}>
                                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e' }}>
                                        Phase 1 - Define Treatment Measure
                                    </p>

                                    {/* Auto-Suggestion */}
                                    {TREATMENT_SUGGESTIONS[risk.id] && (
                                        <div style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.3)', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#1565c0', fontWeight: 'bold' }}>
                                                💡 Suggested Treatment (ISO 31000 Cl. 6.5.2)
                                            </p>
                                            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#555' }}>
                                                <strong>{TREATMENT_SUGGESTIONS[risk.id].option}:</strong> {TREATMENT_SUGGESTIONS[risk.id].note}
                                            </p>

                                            {/* Simulations-Ergebnis anzeigen wenn fertig */}
                                            {simDone[risk.id] && (
                                                <div style={{ background: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>
                                                        ✅ {TREATMENT_SUGGESTIONS[risk.id].simulationResult}
                                                    </p>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {/* Manuell übernehmen */}
                                                <button
                                                    onClick={() => applyAuto(risk.id)}
                                                    disabled={simulating === risk.id}
                                                    style={{ ...styles.buttonSelected, marginTop: 0, background: '#1565c0', fontSize: '12px' }}
                                                >
                                                    ✓ Apply This Treatment
                                                </button>

                                                {/* Simulations-Button */}
                                                {TREATMENT_SUGGESTIONS[risk.id].hasSimulation && (
                                                    <button
                                                        onClick={() => runSimulation(risk.id)}
                                                        disabled={simulating !== null || simDone[risk.id]}
                                                        style={{
                                                            ...styles.button,
                                                            marginTop: 0,
                                                            background: simDone[risk.id] ? '#aaa' : '#2e7d32',
                                                            fontSize: '12px',
                                                            cursor: (simulating !== null || simDone[risk.id]) ? 'not-allowed' : 'pointer',
                                                            opacity: simDone[risk.id] ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {simulating === risk.id
                                                            ? 'Running...'
                                                            : simDone[risk.id]
                                                                ? 'Completed'
                                                                : `${TREATMENT_SUGGESTIONS[risk.id].simulationButton}`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Manuell */}
                                    <label style={styles.label}>Treatment Option (ISO 31000 Cl. 6.5.2)</label>
                                    <select
                                        style={{ ...styles.input, marginBottom: '10px' }}
                                        value={risk.treatmentOption}
                                        onChange={e => updateTreatment(risk.id, 'treatmentOption', e.target.value)}
                                    >
                                        <option value="">- Select Treatment Option -</option>
                                        {ISO_TREATMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                    {risk.treatmentOption && (
                                        <FieldHint text={TREATMENT_OPTION_EXPLANATIONS[risk.treatmentOption]} />
                                    )}
                                    <label style={styles.label}>Treatment Description <span style={{ color: '#c62828' }}>*</span></label>
                                    <textarea
                                        style={{ ...styles.input, height: '70px', resize: 'vertical' }}
                                        placeholder="Describe the specific measures to be implemented..."
                                        value={risk.treatmentNote}
                                        onChange={e => updateTreatment(risk.id, 'treatmentNote', e.target.value)}
                                    />
                                    <button
                                        onClick={() => updateTreatment(risk.id, 'treatmentStatus', 'suggested')}
                                        disabled={!risk.treatmentOption || !risk.treatmentNote}
                                        style={{
                                            ...styles.button,
                                            marginTop: '12px',
                                            background: (!risk.treatmentOption || !risk.treatmentNote) ? '#aaa' : '#1565c0',
                                            cursor: (!risk.treatmentOption || !risk.treatmentNote) ? 'not-allowed' : 'pointer',
                                            opacity: (!risk.treatmentOption || !risk.treatmentNote) ? 0.6 : 1,
                                        }}
                                    >
                                        Apply Treatment →
                                    </button>
                                </div>

                                {/* Phase 2 - Residual Risk einschätzen */}
                                {risk.treatmentStatus === 'suggested' && (
                                    <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '14px', marginBottom: '14px' }}>
                                        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold', color: '#1a1a2e' }}>Phase 2 - Assess Residual Risk</p>
                                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#666' }}>
                                            After applying this measure, how do you assess the remaining risk? (ISO 31000 Cl. 6.5.1)
                                        </p>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={styles.label}>Residual Likelihood</label>
                                                <select
                                                    style={styles.input}
                                                    value={risk.residualLikelihood}
                                                    onChange={e => updateTreatment(risk.id, 'residualLikelihood', e.target.value)}
                                                >
                                                    {DEFAULT_LIKELIHOOD_SCALE.map(l => <option key={l.value}>{l.value}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={styles.label}>Residual Impact</label>
                                                <select
                                                    style={styles.input}
                                                    value={risk.residualImpact}
                                                    onChange={e => updateTreatment(risk.id, 'residualImpact', e.target.value)}
                                                >
                                                    {DEFAULT_IMPACT_SCALE.map(i => <option key={i.value}>{i.value}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={styles.label}>Residual Risk Level</label>
                                                <div style={{
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    background: rc.bg,
                                                    color: rc.text,
                                                }}>
                                                    {risk.residualLevel}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warnung wenn noch High/Very High */}
                                        {(risk.residualLevel === 'High' || risk.residualLevel === 'Very High') && (
                                            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fdecea', border: '1px solid #c62828', borderRadius: '6px' }}>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#c62828', fontWeight: 'bold' }}>
                                                    ⚠️ Residual risk is still {risk.residualLevel}. Consider refining your treatment measure or choosing a different option before confirming.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Confirm Button */}
                                {risk.treatmentStatus === 'suggested' && (
                                    <button onClick={() => confirmTreatment(risk.id)}
                                        disabled={risk.residualLevel === 'High' || risk.residualLevel === 'Very High'}
                                        style={{
                                            ...styles.button,
                                            marginTop: 0,
                                            background: (risk.residualLevel === 'High' || risk.residualLevel === 'Very High') ? '#aaa' : '#2e7d32',
                                            cursor: (risk.residualLevel === 'High' || risk.residualLevel === 'Very High') ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        ✓ Confirm Treatment & Accept Residual Risk
                                    </button>
                                )}
                            </>
                        )}

                        {/* Bestätigt - Zusammenfassung */}
                        {risk.treatmentStatus === 'confirmed' && (
                            <div style={{ borderTop: '1px solid #c8e6c9', paddingTop: '12px' }}>
                                <p style={{ margin: '0 0 4px', fontSize: '13px' }}><strong>Treatment:</strong> {risk.treatmentOption}</p>
                                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#555' }}>{risk.treatmentNote}</p>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#555' }}>
                                        Residual risk: <strong style={{ color: levelColor(risk.residualLevel).text }}>{risk.residualLevel}</strong>
                                        {' '}(was: <span style={{ color: levelColor(risk.level).text }}>{risk.level}</span>)
                                    </span>
                                    <button
                                        onClick={() => setRisks(risks.map(r => r.id !== risk.id ? r : { ...r, treatmentStatus: 'none' }))}
                                        style={{ ...styles.buttonOutline, marginTop: 0, fontSize: '12px' }}
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            <NavButtons
                currentStep={4}
                onBack={onBack}
                onNext={saveAndContinue}
                nextDisabled={!allGreen}
                nextLabel={allGreen ? 'Continue to Report →' : `${risks.filter(r => r.treatmentStatus !== 'confirmed').length} risk(s) remaining`}
            />
        </div>
    )
}

//Report Seite
function StepReport({ risks, scope, user, misuses, assessmentId, onBack, onFinish }) {
    const high = risks.filter(r => r.level === 'High' || r.level === 'Very High').length

    const [downloading, setDownloading] = useState(false)
    const [downloaded, setDownloaded] = useState(false)

    async function handleDownload() {
        setDownloading(true)
        await new Promise(resolve => setTimeout(resolve, 2000))

        const doc = new jsPDF()
        let y = 20

        //Titel
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('AI Risk Assessment Report', 105, y, { align: 'center' })
        y += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('EU AI Act Art. 9 · Annex IV', 105, y, { align: 'center' })
        y += 15

        //Trennlinie
        doc.setDrawColor(200)
        doc.line(20, y, 190, y)
        y += 10

        //Assessment Info
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Assessment Information', 20, y)
        y += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Assessor: ${user.assessorName} (${user.role})`, 20, y); y += 6
        doc.text(`AI System: ${user.aiSystemName}`, 20, y); y += 6
        doc.text(`Date: ${user.date}`, 20, y); y += 6
        doc.text(`Domain: ${scope.domain || '-'}`, 20, y); y += 6
        doc.text(`Lifecycle Stage: ${scope.phase || '-'}`, 20, y); y += 6
        doc.text(`Assessment ID: ${assessmentId}`, 20, y); y += 6
        doc.text(`Report generated: ${new Date().toISOString().split('T')[0]}`, 20, y); y += 6
        doc.text(`Likelihood Scale: NIST SP 800-30 Table G-3`, 20, y); y += 6
        doc.text(`Impact Scale: NIST SP 800-30 Table H-3`, 20, y); y += 6
        doc.text(`Risk Combination Matrix: NIST SP 800-30 Table I-2`, 20, y); y += 12

        //Trennlinie
        doc.line(20, y, 190, y); y += 10

        //Risiken
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Identified Risks (${risks.length})`, 20, y); y += 8

        risks.forEach((r, i) => {
            if (y > 260) { doc.addPage(); y = 20 }
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`${i + 1}. ${r.title}`, 20, y); y += 5
            doc.setFont('helvetica', 'normal')
            doc.text(`   Risk Level: ${r.level} | Likelihood: ${r.likelihood} | Impact: ${r.impact}`, 20, y); y += 5
            if (r.treatmentOption) {
                doc.text(`   Treatment: ${r.treatmentOption} - ${r.treatmentNote}`, 20, y, { maxWidth: 165 }); y += 8
                doc.text(`   Residual Risk: ${r.residualLevel}`, 20, y); y += 8
            } else {
                y += 4
            }
        })

        //Misuse
        if (misuses.length > 0) {
            if (y > 240) { doc.addPage(); y = 20 }
            doc.line(20, y, 190, y); y += 10
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`Misuse Scenarios (${misuses.length})`, 20, y); y += 8

            misuses.forEach((m, i) => {
                if (y > 260) { doc.addPage(); y = 20 }
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(`${i + 1}. ${m.category}`, 20, y); y += 5
                doc.setFont('helvetica', 'normal')
                doc.text(`   Risk Level: ${m.level} | Likelihood: ${m.likelihood} | Impact: ${m.impact}`, 20, y); y += 5
                if (m.description) {
                    doc.text(`   ${m.description}`, 20, y, { maxWidth: 165 }); y += 8
                } else {
                    y += 4
                }
            })
        }

        //Fußzeile
        if (y > 260) { doc.addPage(); y = 20 }
        doc.line(20, y, 190, y); y += 8
        doc.setFontSize(9)
        doc.setTextColor(150)
        doc.text('Generated by RMS Microservice · EU AI Act Art. 9 Compliance Tool', 105, y, { align: 'center' }); y += 5
        doc.text('Note: In a production environment, this report would be transmitted to the Technical Documentation Microservice of the QMS.', 105, y, { align: 'center', maxWidth: 170 })

        doc.save(`RMS_Report_${user.aiSystemName}_${user.date}.pdf`)

        setDownloading(false)
        setDownloaded(true)
    }

    async function finish() {
        try {
            await fetch(`http://127.0.0.1:8000/assessments/${assessmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            })
            onFinish()
        } catch (error) {
            console.error('Failed to finish assessment:', error)
        }
    }

    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Report</h1>
            <p style={styles.sub}>Risk Assessment Documentation - EU AI Act Art. 9 · Annex IV</p>
            <div style={styles.card}>
                <h3 style={{ marginTop: 0 }}>Assessment Summary</h3>
                <p><strong>Assessor:</strong> {user.assessorName} ({user.role})</p>
                <p><strong>AI System:</strong> {user.aiSystemName}</p>
                <p><strong>Date:</strong> {user.date}</p>
                <p><strong>Domain:</strong> {scope.domain || '-'}</p>
                <p><strong>Lifecycle Stage:</strong> {scope.phase || '-'}</p>
                <p><strong>Likelihood Scale:</strong> NIST SP 800-30 Table G-3</p>
                <p><strong>Impact Scale:</strong> NIST SP 800-30 Table H-3</p>
                <p><strong>Risk Combination:</strong> NIST SP 800-30 Table I-2</p>
                <p><strong>Total Risks Identified:</strong> {risks.length}</p>
                <p><strong>High / Very High Risks:</strong> {high}</p>
                <p><strong>Misuse Scenarios:</strong> {misuses.length}</p>
                <p><strong>Status:</strong> {risks.length === 0 ? 'No assessment conducted' : 'Assessment complete'}</p>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{ ...styles.button, marginTop: '16px', opacity: downloading ? 0.7 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
                >
                    {downloading ? 'Generating Report...' : 'Download Report (PDF)'}
                </button>

                {downloaded && (
                    <div style={{ marginTop: '12px', padding: '12px 16px', background: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>
                            Report successfully generated and downloaded.
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>
                            In a production environment, this report would be automatically transmitted to the Technical Documentation Microservice of the QMS.
                        </p>
                    </div>
                )}
            </div>
            <NavButtons currentStep={5} onBack={onBack} onNext={finish} nextLabel="✓ Finish" />
        </div>
    )
}

//Style
const styles = {
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '56px', background: '#1a1a2e', color: 'white' },
    navBrand: { fontWeight: 'bold', fontSize: '18px', color: '#4fc3f7', letterSpacing: '1px' },
    stepperWrap: { background: '#eef5fb', borderBottom: '1px solid #d6e8f5', padding: '20px 48px' },
    stepperInner: { display: 'flex', alignItems: 'flex-start', maxWidth: '900px' },
    page: { padding: '40px 48px', width: '100%', boxSizing: 'border-box' },
    heading: { fontSize: '28px', marginBottom: '8px', color: '#1a1a2e' },
    sub: { color: '#666', marginBottom: '24px', fontSize: '14px' },
    card: { border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', padding: '24px', background: COLORS.cardBg },    cardRow: { display: 'flex', gap: '16px' },
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

//Gesamte App
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
    const [modelCheckPanelOpen, setModelCheckPanelOpen] = useState(false)

    const [assessmentId, setAssessmentId] = useState(null)
    const [previousPhase, setPreviousPhase] = useState(null)

    const [modelCheckLoading, setModelCheckLoading] = useState(false)
    const [modelCheckResult, setModelCheckResult] = useState(null)
    const [modelCheckError, setModelCheckError] = useState(null)

    const [occlusionApplicantId, setOcclusionApplicantId] = useState(9)
    const [occlusionLoading, setOcclusionLoading] = useState(false)
    const [occlusionResult, setOcclusionResult] = useState(null)
    const [occlusionError, setOcclusionError] = useState(null)

    async function runModelCheck() {
        setModelCheckLoading(true)
        setModelCheckError(null)
        try {
            const response = await fetch('http://127.0.0.1:8000/credit-metrics')
            if (!response.ok) throw new Error('Backend returned an error')
            const data = await response.json()
            setModelCheckResult(data)
        } catch (error) {
            console.error('Model check failed:', error)
            setModelCheckError('Could not reach the AI model. Is the backend and Ollama running?')
        }
        setModelCheckLoading(false)
    }

    async function runOcclusionTest() {
        setOcclusionLoading(true)
        setOcclusionError(null)
        setOcclusionResult(null)
        try {
            const response = await fetch(`http://127.0.0.1:8000/occlusion-test/${occlusionApplicantId}`)
            if (!response.ok) throw new Error('Backend returned an error')
            const data = await response.json()
            setOcclusionResult(data)
        } catch (error) {
            console.error('Occlusion test failed:', error)
            setOcclusionError('Could not reach the AI model. Is the backend and Ollama running?')
        }
        setOcclusionLoading(false)
    }

    //Neues assessment anlegen
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

    //Bestehendes assessment fortsetzen bzw. bei abgeschlossenen wieder Schritt 1 öffnen  --> Re-evaluation
    async function handleResume(assessment) {
        const isReassessment = assessment.status === 'completed'
        setUser({
            assessorName: assessment.ai_system.assessor_name,
            role: assessment.ai_system.role,
            aiSystemName: assessment.ai_system.ai_system_name,
            date: assessment.ai_system.date,
        })
        setScope(assessment.scope)
        setRisks(isReassessment ? [] : (assessment.risks || []))
        setMisuses(assessment.misuses || [])
        if (assessment.likelihood_scale?.length) setLikelihoodScale(assessment.likelihood_scale)
        if (assessment.impact_scale?.length) setImpactScale(assessment.impact_scale)
        setAssessmentId(assessment.id)
        setPreviousPhase(isReassessment ? assessment.scope.phase : null)
        setCurrentStep(isReassessment ? 1 : (assessment.current_step || 1))
        setScreen('steps')
    }

    function renderStep() {
        switch (currentStep) {
            case 1: return <StepScope scope={scope} setScope={setScope} likelihoodScale={likelihoodScale} setLikelihoodScale={setLikelihoodScale} impactScale={impactScale} setImpactScale={setImpactScale} assessmentId={assessmentId} previousPhase={previousPhase} onNext={() => setCurrentStep(2)} />
            case 2: return <StepRiskIdentification
                scope={scope} risks={risks} setRisks={setRisks} assessmentId={assessmentId}
                onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)}
                modelCheckLoading={modelCheckLoading} modelCheckResult={modelCheckResult} modelCheckError={modelCheckError} runModelCheck={runModelCheck}
                occlusionApplicantId={occlusionApplicantId} setOcclusionApplicantId={setOcclusionApplicantId}
                occlusionLoading={occlusionLoading} occlusionResult={occlusionResult} occlusionError={occlusionError} runOcclusionTest={runOcclusionTest}
            />
            case 3: return <StepRiskEvaluation risks={risks} setRisks={setRisks} likelihoodScale={likelihoodScale} impactScale={impactScale} assessmentId={assessmentId} onBack={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)} modelCheckResult={modelCheckResult} occlusionResult={occlusionResult} onOpenModelCheckPanel={() => setModelCheckPanelOpen(true)} />
            case 4: return <StepTreatment risks={risks} setRisks={setRisks} assessmentId={assessmentId} onBack={() => setCurrentStep(3)} onNext={() => setCurrentStep(5)} modelCheckResult={modelCheckResult} occlusionResult={occlusionResult} onOpenModelCheckPanel={() => setModelCheckPanelOpen(true)} />
            case 5: return <StepReport risks={risks} scope={scope} user={user} misuses={misuses} assessmentId={assessmentId} onBack={() => setCurrentStep(4)} onFinish={() => setScreen('landing')} />
            default: return null
        }
    }

    //Alle states zurücksetzen
    function resetAll() {
        setUser({ assessorName: '', role: '', aiSystemName: '', date: '' })
        setScope({ domain: '', phase: '' })
        setRisks([])
        setMisuses([])
        setLikelihoodScale(DEFAULT_LIKELIHOOD_SCALE)
        setImpactScale(DEFAULT_IMPACT_SCALE)
        setAssessmentId(null)
        setPreviousPhase(null)
        setModelCheckResult(null)
        setModelCheckError(null)
        setOcclusionResult(null)
        setOcclusionError(null)
        setCurrentStep(1)
        setScreen('form')
    }

    if (screen === 'landing') return <LandingPage onStart={resetAll} onResume={handleResume} />
    if (screen === 'form') return <UserForm onBegin={handleBegin} />

    return (
        <div style={{ minHeight: '100vh', background: COLORS.bgLight }}>
            <nav style={styles.nav}>
                <div
                    style={{ ...styles.navBrand, cursor: 'pointer' }}
                    onClick={() => { resetAll(); setScreen('landing') }}                >
                    RMS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ fontSize: '13px', color: '#888' }}>
                        {user.aiSystemName} · {user.assessorName}
                    </div>
                    <button
                        onClick={() => { resetAll(); setScreen('landing') }}
                        style={{ padding: '7px 16px', background: 'transparent', color: '#4fc3f7', border: '1px solid #4fc3f7', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                        {currentStep === 5 ? '← Back to Home' : 'Save & Exit'}
                    </button>
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
            {modelCheckPanelOpen && (
                <AIModelCheckPanel
                    modelCheckResult={modelCheckResult}
                    occlusionResult={occlusionResult}
                    onClose={() => setModelCheckPanelOpen(false)}
                />
            )}
        </div>
    )
}