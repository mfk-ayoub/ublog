import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getAllArticles } from '../api';
import ArticleCard from '../components/ArticleCard';

export default function Feed() {
	const { isAuth } = useAuth();
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		getAllArticles()
			.then((res) => setArticles(res.data || []))
			.catch(() => setError('Could not load articles. Please try again later.'))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="container py-4">
			{/* Hero */}
			<div className="hero-section mb-4">
				<h1>Stay curious.</h1>
				<p>
					Discover stories, thinking, and expertise from writers on any topic
					that matters to you.
				</p>
				{!isAuth && (
					<Link to="/login" className="btn btn-light fw-semibold mt-2" style={{ borderRadius: 8 }}>
						Start reading
					</Link>
				)}
			</div>

			{/* Section heading */}
			<div className="d-flex align-items-center justify-content-between mb-4">
				<h4 className="fw-bold mb-0">Latest Articles</h4>
			</div>

			{loading && (
				<div className="row g-4">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<div key={i} className="col-12 col-md-6 col-lg-4">
							<div className="skeleton" style={{ height: 200 }} />
						</div>
					))}
				</div>
			)}

			{error && <div className="alert alert-danger">{error}</div>}

			{!loading && !error && articles.length === 0 && (
				<div className="text-center py-5">
					<p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</p>
					<h5 className="fw-semibold">No articles yet</h5>
					<p style={{ color: 'var(--color-muted)' }}>
						Be the first to publish something amazing!
					</p>
					{isAuth && (
						<Link to="/editor/new" className="btn btn-brand mt-2">
							Write an article
						</Link>
					)}
				</div>
			)}

			<div className="row g-4">
				{articles.map((article) => (
					<div key={article.id || article.slug} className="col-12 col-md-6 col-lg-4">
						<ArticleCard article={article} />
					</div>
				))}
			</div>
		</div>
	);
}
