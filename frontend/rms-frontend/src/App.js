import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Dashboard() {
    return <h1>Dashboard</h1>;
}

function Risks() {
    return <h1>Risks</h1>;
}

function Treatment() {
    return <h1>Treatment</h1>;
}

function Report() {
    return <h1>Report</h1>;
}

function App() {
    return (
        <Router>
            <nav>
                <Link to="/">Dashboard</Link> |{' '}
                <Link to="/risks">Risks</Link> |{' '}
                <Link to="/treatment">Treatment</Link> |{' '}
                <Link to="/report">Report</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/risks" element={<Risks />} />
                <Route path="/treatment" element={<Treatment />} />
                <Route path="/report" element={<Report />} />
            </Routes>
        </Router>
    );
}

export default App;