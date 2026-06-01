import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()
    const links = [
        { to: '/', label: 'Dashboard' },
        { to: '/risks', label: 'Risks' },
        { to: '/treatment', label: 'Treatment' },
        { to: '/report', label: 'Report' },
    ]
    return (
        <nav style={styles.nav}>
            <div style={styles.navBrand}>RMS</div>
            <div style={styles.navLinks}>
                {links.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        style={{
                            ...styles.navLink,
                            ...(location.pathname === link.to ? styles.navLinkActive : {})
                        }}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    )
}

function Dashboard() {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.sub}>Overview of all Risk Assessments</p>
            <div style={styles.card}>
                <h3>No assessments yet</h3>
                <p>Start by creating a new Risk Assessment.</p>
                <button style={styles.button}>+ New Assessment</button>
            </div>
        </div>
    )
}

function Risks() {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Risks</h1>
            <p style={styles.sub}>Identify and evaluate risks</p>
            <div style={styles.card}>
                <p>No risks identified yet.</p>
            </div>
        </div>
    )
}

function Treatment() {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Treatment</h1>
            <p style={styles.sub}>Manage risk mitigation measures</p>
            <div style={styles.card}>
                <p>No treatments defined yet.</p>
            </div>
        </div>
    )
}

function Report() {
    return (
        <div style={styles.page}>
            <h1 style={styles.heading}>Report</h1>
            <p style={styles.sub}>Annex IV Documentation</p>
            <div style={styles.card}>
                <p>No report generated yet.</p>
            </div>
        </div>
    )
}

const styles = {
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '60px',
        background: '#1a1a2e',
        color: 'white',
    },
    navBrand: {
        fontWeight: 'bold',
        fontSize: '20px',
        color: '#4fc3f7',
    },
    navLinks: {
        display: 'flex',
        gap: '24px',
    },
    navLink: {
        color: '#ccc',
        textDecoration: 'none',
        fontSize: '15px',
    },
    navLinkActive: {
        color: '#4fc3f7',
        fontWeight: 'bold',
        borderBottom: '2px solid #4fc3f7',
        paddingBottom: '2px',
    },
    page: {
        padding: '40px',
        maxWidth: '900px',
        margin: '0 auto',
    },
    heading: {
        fontSize: '28px',
        marginBottom: '8px',
    },
    sub: {
        color: '#666',
        marginBottom: '24px',
    },
    card: {
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        background: '#fafafa',
    },
    button: {
        marginTop: '12px',
        padding: '10px 20px',
        background: '#1a1a2e',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
    }
}

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/risks" element={<Risks />} />
                <Route path="/treatment" element={<Treatment />} />
                <Route path="/report" element={<Report />} />
            </Routes>
        </Router>
    )
}

export default App