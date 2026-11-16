import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginRegister from './pages/LoginRegister';
import Feed from './pages/Feed';
import Dashboard from './pages/Dashboard';
import ArticleEditor from './pages/ArticleEditor';
import ArticleReader from './pages/ArticleReader';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
	return (
		<>
			<Navbar />
			<Routes>
				{/* Public */}
				<Route path="/" element={<Navigate to="/feed" replace />} />
				<Route path="/login" element={<LoginRegister />} />
				<Route path="/feed" element={<Feed />} />
				<Route path="/article/:slug" element={<ArticleReader />} />
				<Route path="/profile/:username" element={<Profile />} />
				<Route path="/privacy" element={<Privacy />} />
				<Route path="/terms" element={<Terms />} />

				{/* Protected */}
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/editor/:id"
					element={
						<ProtectedRoute>
							<ArticleEditor />
						</ProtectedRoute>
					}
				/>

				{/* Fallback */}
				<Route path="*" element={<Navigate to="/feed" replace />} />
			</Routes>

			<footer className="footer-ublog">
				<div className="container">
					<div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-2">
						<span style={{ fontWeight: 700, color: 'var(--color-brand)', fontSize: '1.1rem' }}>
							ublog
						</span>
						<div className="d-flex gap-3">
							<Link to="/privacy">Privacy</Link>
							<Link to="/terms">Terms</Link>
						</div>
						<span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
							© {new Date().getFullYear()} ublog. All rights reserved.
						</span>
					</div>
				</div>
			</footer>
		</>
	);
}
