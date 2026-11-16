import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getMyArticles, createArticle, deleteArticle, getMySaves, getArticle } from '../api';

export default function Dashboard() {
	const { username } = useAuth();
	const navigate = useNavigate();

	const [articles, setArticles] = useState([]);
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState('articles');
	const [error, setError] = useState('');

	useEffect(() => {
		const load = async () => {
			try {
				const [artRes, savRes] = await Promise.all([getMyArticles(), getMySaves()]);
				setArticles(artRes.data || []);

				const saveEntries = savRes.data || [];
				const fullSaves = await Promise.all(
					saveEntries.map(async (save) => {
						try {
							const res = await getArticle(save.slug);
							return { ...res.data, saveId: save.id };
						} catch {
							return { slug: save.slug, author: save.author, id: save.articleId, title: null };
						}
					})
				);
				setSaves(fullSaves);
			} catch {
				setError('Could not load your content.');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const handleNewArticle = async () => {
		try {
			const res = await createArticle();
			const id = res.data?.id;
			if (id) navigate(`/editor/${id}`);
		} catch {
			setError('Could not create a new article.');
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this article?')) return;
		try {
			await deleteArticle(id);
			setArticles((prev) => prev.filter((a) => a.id !== id));
		} catch {
			setError('Could not delete article.');
		}
	};

	return (
		<div className="container py-5">
			<div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
				<div>
					<h2 className="fw-bold mb-1">Dashboard</h2>
					<p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }} className="mb-0">
						Welcome back, <span className="fw-semibold">@{username}</span>
					</p>
				</div>
				<button className="btn btn-brand" onClick={handleNewArticle}>
					+ New Article
				</button>
			</div>

			{error && <div className="alert alert-danger py-2 small mt-3">{error}</div>}

			<ul className="nav nav-tabs-ublog mt-4 mb-4">
				<li className="nav-item">
					<button
						className={`nav-link ${activeTab === 'articles' ? 'active' : ''}`}
						onClick={() => setActiveTab('articles')}
					>
						My Articles ({articles.length})
					</button>
				</li>
				<li className="nav-item">
					<button
						className={`nav-link ${activeTab === 'saves' ? 'active' : ''}`}
						onClick={() => setActiveTab('saves')}
					>
						Saved ({saves.length})
					</button>
				</li>
			</ul>

			{loading ? (
				<div className="row g-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="col-12">
							<div className="skeleton" style={{ height: 64 }} />
						</div>
					))}
				</div>
			) : activeTab === 'articles' ? (
				articles.length === 0 ? (
					<div className="text-center py-5">
						<p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✍️</p>
						<h5 className="fw-semibold">No articles yet</h5>
						<p style={{ color: 'var(--color-muted)' }}>
							Start writing your first article and share it with the world.
						</p>
						<button className="btn btn-brand" onClick={handleNewArticle}>
							Write your first article
						</button>
					</div>
				) : (
					<div className="d-flex flex-column gap-3">
						{articles.map((a) => (
							<div
								key={a.id}
								className="d-flex align-items-center justify-content-between p-3"
								style={{
									background: 'var(--color-surface)',
									border: '1px solid var(--color-border)',
									borderRadius: 'var(--radius)',
									transition: 'box-shadow 0.2s',
								}}
							>
								<div className="flex-grow-1 me-3">
									<div className="d-flex align-items-center gap-2 mb-1">
										{a.published ? (
											<span
												className="badge"
												style={{
													background: '#dcfce7',
													color: '#166534',
													fontSize: '0.72rem',
													fontWeight: 600,
												}}
											>
												Published
											</span>
										) : (
											<span
												className="badge"
												style={{
													background: '#fef3c7',
													color: '#92400e',
													fontSize: '0.72rem',
													fontWeight: 600,
												}}
											>
												Draft
											</span>
										)}
									</div>
									{a.published && a.slug ? (
										<Link
											to={`/article/${a.slug}`}
											className="text-decoration-none fw-semibold"
											style={{ color: 'var(--color-text)' }}
										>
											{a.title || <span className="fst-italic" style={{ color: 'var(--color-muted)' }}>Untitled</span>}
										</Link>
									) : (
										<span className="fst-italic" style={{ color: 'var(--color-muted)' }}>
											{a.title || 'Untitled'}
										</span>
									)}
								</div>
								<div className="d-flex gap-2 flex-shrink-0">
									<Link
										to={`/editor/${a.id}`}
										className="btn btn-sm btn-outline-brand"
										style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
									>
										Edit
									</Link>
									<button
										className="btn btn-sm"
										style={{
											fontSize: '0.8rem',
											padding: '0.25rem 0.75rem',
											border: '1.5px solid #fca5a5',
											color: '#dc2626',
											borderRadius: 8,
										}}
										onClick={() => handleDelete(a.id)}
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				)
			) : saves.length === 0 ? (
				<div className="text-center py-5">
					<p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔖</p>
					<h5 className="fw-semibold">No saved articles</h5>
					<p style={{ color: 'var(--color-muted)' }}>
						Articles you save will appear here for easy access.
					</p>
					<Link to="/feed" className="btn btn-brand">
						Explore articles
					</Link>
				</div>
			) : (
				<div className="row g-4">
					{saves.map((a) => (
						<div key={a.id || a.slug} className="col-12 col-md-6 col-lg-4">
							<div className="card-ublog h-100">
								<div className="card-body p-4">
									<h6 className="fw-semibold mb-2">
										<Link
											to={`/article/${a.slug}`}
											className="text-decoration-none"
											style={{ color: 'var(--color-text)' }}
										>
											{a.title || <span className="fst-italic" style={{ color: 'var(--color-muted)' }}>Untitled</span>}
										</Link>
									</h6>
									{a.author && (
										<p className="small mb-0" style={{ color: 'var(--color-muted)' }}>
											by @{a.author}
										</p>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
