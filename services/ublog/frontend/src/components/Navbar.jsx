import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Navbar() {
	const { isAuth, username, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<nav className="navbar navbar-expand-md navbar-ublog sticky-top">
			<div className="container">
				<Link className="navbar-brand" to="/">
					ublog
				</Link>

				<button
					className="navbar-toggler border-0"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#mainNav"
					aria-controls="mainNav"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div className="collapse navbar-collapse" id="mainNav">
					<ul className="navbar-nav me-auto mb-2 mb-md-0">
						<li className="nav-item">
							<NavLink className="nav-link" to="/feed">
								Explore
							</NavLink>
						</li>
						{isAuth && (
							<li className="nav-item">
								<NavLink className="nav-link" to="/dashboard">
									Dashboard
								</NavLink>
							</li>
						)}
					</ul>

					<ul className="navbar-nav ms-auto mb-2 mb-md-0 align-items-center">
						{isAuth ? (
							<>
								<li className="nav-item">
									<NavLink
										className="nav-link"
										to={`/profile/${username}`}
									>
										@{username}
									</NavLink>
								</li>
								<li className="nav-item ms-2">
									<button
										className="btn btn-sm btn-outline-brand"
										onClick={handleLogout}
										style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}
									>
										Logout
									</button>
								</li>
							</>
						) : (
							<li className="nav-item">
								<NavLink className="btn btn-sm btn-brand" to="/login">
									Get Started
								</NavLink>
							</li>
						)}
					</ul>
				</div>
			</div>
		</nav>
	);
}
