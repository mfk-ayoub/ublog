import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { login as apiLogin, signup as apiSignup } from '../api';

export default function LoginRegister() {
	const [tab, setTab] = useState('login');
	const [form, setForm] = useState({ email: '', password: '', username: '', firstName: '', lastName: '' });
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from?.pathname || '/dashboard';

	const handleChange = (e) => {
		setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			if (tab === 'login') {
				const res = await apiLogin({ email: form.email, password: form.password });
				login(res.data.accessToken, res.data.username);
				navigate(from, { replace: true });
			} else {
				const res = await apiSignup({
					email: form.email,
					password: form.password,
					username: form.username,
					firstName: form.firstName,
					lastName: form.lastName,
				});
				login(res.data.accessToken, res.data.username);
				navigate('/dashboard', { replace: true });
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
				(Array.isArray(err.response?.data?.message)
					? err.response.data.message.join(', ')
					: 'Something went wrong. Please try again.')
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-vh-100 d-flex align-items-center"
			style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
		>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-12 col-sm-9 col-md-6 col-lg-4">
						<div className="text-center mb-4">
							<h1
								className="fw-bold mb-1"
								style={{ fontSize: '2rem', color: 'var(--color-brand)' }}
							>
								ublog
							</h1>
							<p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
								{tab === 'login'
									? 'Welcome back! Sign in to continue.'
									: 'Join the community of writers and readers.'}
							</p>
						</div>

						<div className="auth-card">
							<div className="p-4">
								{/* Tabs */}
								<ul className="nav nav-tabs-ublog d-flex mb-4">
									<li className="nav-item flex-fill">
										<button
											className={`nav-link w-100 ${tab === 'login' ? 'active' : ''}`}
											onClick={() => { setTab('login'); setError(''); }}
										>
											Sign In
										</button>
									</li>
									<li className="nav-item flex-fill">
										<button
											className={`nav-link w-100 ${tab === 'register' ? 'active' : ''}`}
											onClick={() => { setTab('register'); setError(''); }}
										>
											Sign Up
										</button>
									</li>
								</ul>

								{error && (
									<div className="alert alert-danger py-2 small">{error}</div>
								)}

								<form onSubmit={handleSubmit} noValidate>
									{tab === 'register' && (
										<div className="mb-3">
											<label htmlFor="username" className="form-label small fw-semibold">
												Username
											</label>
											<input
												id="username"
												name="username"
												type="text"
												className="form-control"
												placeholder="johndoe"
												value={form.username}
												onChange={handleChange}
												required
												minLength={3}
												maxLength={25}
												pattern="^[a-zA-Z0-9]{3,25}$"
											/>
											<div className="form-text">3–25 alphanumeric characters.</div>
										</div>
									)}

									{tab === 'register' && (
										<div className="row mb-3">
											<div className="col-6">
												<label htmlFor="firstName" className="form-label small fw-semibold">
													First Name
												</label>
												<input
													id="firstName"
													name="firstName"
													type="text"
													className="form-control"
													placeholder="John"
													value={form.firstName}
													onChange={handleChange}
												/>
											</div>
											<div className="col-6">
												<label htmlFor="lastName" className="form-label small fw-semibold">
													Last Name
												</label>
												<input
													id="lastName"
													name="lastName"
													type="text"
													className="form-control"
													placeholder="Doe"
													value={form.lastName}
													onChange={handleChange}
												/>
											</div>
										</div>
									)}

									<div className="mb-3">
										<label htmlFor="email" className="form-label small fw-semibold">
											Email
										</label>
										<input
											id="email"
											name="email"
											type="email"
											className="form-control"
											placeholder="you@example.com"
											value={form.email}
											onChange={handleChange}
											required
										/>
									</div>

									<div className="mb-4">
										<label htmlFor="password" className="form-label small fw-semibold">
											Password
										</label>
										<input
											id="password"
											name="password"
											type="password"
											className="form-control"
											placeholder="••••••••"
											value={form.password}
											onChange={handleChange}
											required
											minLength={8}
										/>
										{tab === 'register' && (
											<div className="form-text">
												Min 8 chars, include uppercase, lowercase, digit & special character.
											</div>
										)}
									</div>

									<button
										type="submit"
										className="btn btn-brand w-100"
										disabled={loading}
									>
										{loading
											? 'Please wait…'
											: tab === 'login'
												? 'Sign In'
												: 'Create Account'}
									</button>
								</form>

								{/*
                <div className="d-flex align-items-center my-3">
                  <hr className="flex-grow-1" style={{ borderColor: 'var(--color-border)' }} />
                  <span className="px-3" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    OR
                  </span>
                  <hr className="flex-grow-1" style={{ borderColor: 'var(--color-border)' }} />
                </div>

                
				<a
                  href="/auth/google/login"
                  className="btn btn-outline-brand w-100"
                >
                  Continue with Google
                </a>
				*/}
							</div>
						</div>

						<p className="text-center small mt-3" style={{ color: 'var(--color-muted)' }}>
							By continuing you agree to our{' '}
							<Link to="/terms" style={{ color: 'var(--color-muted)' }}>Terms</Link> and{' '}
							<Link to="/privacy" style={{ color: 'var(--color-muted)' }}>Privacy Policy</Link>.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
