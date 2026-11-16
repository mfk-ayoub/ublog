import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useAuth } from '../context/useAuth';
import {
	getArticle,
	getArticleComments,
	getArticleLikes,
	getArticleLikeStatus,
	getArticleSaveStatus,
	writeComment,
	getArticlePictureUrl,
	getUserPictureUrl,
	likeArticle,
	unlikeArticle,
	saveArticle,
	unsaveArticle,
	recordArticleView,
} from '../api';
import AiAssistant from '../components/AiAssistant';

function CommentItem({ comment }) {
	const [avatarErr, setAvatarErr] = useState(false);
	const c = comment;

	const timeAgo = useMemo(() => {
		if (!c.createdAt) return null;
		const created = new Date(c.createdAt);
		const now = new Date();
		const diff = Math.max(0, now.getTime() - created.getTime());
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		if (days < 30) return `${days}d ago`;
		return created.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}, [c.createdAt]);

	return (
		<div
			className="d-flex gap-3 mb-3 p-3"
			style={{
				background: 'var(--color-surface)',
				borderRadius: 'var(--radius)',
				border: '1px solid var(--color-border)',
			}}
		>
			{avatarErr ? (
				<div
					style={{
						width: 32,
						height: 32,
						minWidth: 32,
						borderRadius: '50%',
						background: 'linear-gradient(135deg, #f093fb, #f5576c)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#fff',
						fontSize: '0.7rem',
						fontWeight: 700,
					}}
				>
					{c.author?.charAt(0).toUpperCase() || '?'}
				</div>
			) : (
				<img
					src={getUserPictureUrl(c.author)}
					alt={c.author}
					style={{
						width: 32,
						height: 32,
						minWidth: 32,
						borderRadius: '50%',
						objectFit: 'cover',
					}}
					onError={() => setAvatarErr(true)}
				/>
			)}
			<div className="flex-grow-1">
				<div className="d-flex align-items-center gap-2 mb-1">
					<Link
						to={`/profile/${c.author}`}
						className="fw-semibold text-decoration-none"
						style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}
					>
						{c.author}
					</Link>
					{timeAgo && (
						<span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
							{timeAgo}
						</span>
					)}
				</div>
				<p className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.6 }}>
					{c.content}
				</p>
			</div>
		</div>
	);
}

export default function ArticleReader() {
	const { slug } = useParams();
	const { isAuth, username } = useAuth();

	const [article, setArticle] = useState(null);
	const [comments, setComments] = useState([]);
	const [commentText, setCommentText] = useState('');
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loadingArticle, setLoadingArticle] = useState(true);
	const [loadingComments, setLoadingComments] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [commentError, setCommentError] = useState('');
	const [imageError, setImageError] = useState(false);
	const [authorAvatarError, setAuthorAvatarError] = useState(false);
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);
	const [likesCount, setLikesCount] = useState(0);
	const [likeLoading, setLikeLoading] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);
	const viewRecorded = useRef(false);

	// Record a view after the reader has spent at least 15 seconds on the page.
	// Uses sessionStorage so repeated visits in the same tab session don't
	// re-count, but a fresh session (new tab / refresh) will count again.
	useEffect(() => {
		if (!slug) return;

		// const storageKey = `viewed_${slug}`;
		// if (sessionStorage.getItem(storageKey) || viewRecorded.current) return;

		console.log(slug);

		const timer = setTimeout(() => {
			recordArticleView(slug).catch(() => { });
		}, 10_000);

		return () => clearTimeout(timer);
	}, [slug]);

	useEffect(() => {
		setLoadingArticle(true);
		getArticle(slug)
			.then((res) => {
				setArticle(res.data);
				setSaved(!!res.data?.saved);
			})
			.catch(() => setError('Article not found.'))
			.finally(() => setLoadingArticle(false));

		getArticleLikes(slug)
			.then((res) => setLikesCount(typeof res.data === 'number' ? res.data : 0))
			.catch(() => { });

		if (isAuth) {
			getArticleLikeStatus(slug)
				.then((res) => setLiked(!!res.data))
				.catch(() => { });
			getArticleSaveStatus(slug)
				.then((res) => setSaved(!!res.data))
				.catch(() => { });
		}
	}, [slug, isAuth]);

	const loadComments = useCallback((p = 1) => {
		setLoadingComments(true);
		getArticleComments(slug, p)
			.then((res) => {
				const list = res.data || [];
				setComments((prev) => (p === 1 ? list : [...prev, ...list]));
				setHasMore(list.length > 0);
			})
			.catch(() => { })
			.finally(() => setLoadingComments(false));
	}, [slug]);

	useEffect(() => {
		loadComments(1);
	}, [loadComments]);

	const handleToggleLike = async () => {
		if (!isAuth || likeLoading) return;
		setLikeLoading(true);
		try {
			if (liked) {
				await unlikeArticle(slug);
				setLiked(false);
				setLikesCount((c) => Math.max(0, c - 1));
			} else {
				await likeArticle(slug);
				setLiked(true);
				setLikesCount((c) => c + 1);
			}
		} catch {
			// keep current state on failure
		} finally {
			setLikeLoading(false);
		}
	};

	const handleToggleSave = async () => {
		if (!isAuth || saveLoading) return;
		setSaveLoading(true);
		try {
			if (saved) {
				await unsaveArticle(slug);
				setSaved(false);
			} else {
				await saveArticle(slug);
				setSaved(true);
			}
		} catch {
			// keep current state on failure
		} finally {
			setSaveLoading(false);
		}
	};

	const handleLoadMore = () => {
		const next = page + 1;
		setPage(next);
		loadComments(next);
	};

	const handleComment = async (e) => {
		e.preventDefault();
		if (!commentText.trim()) return;
		setSubmitting(true);
		setCommentError('');
		try {
			await writeComment(slug, { content: commentText.trim() });
			setCommentText('');
			loadComments(1);
			setPage(1);
		} catch (err) {
			const msg = err.response?.data?.message;
			setCommentError(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not post comment.');
		} finally {
			setSubmitting(false);
		}
	};

	if (loadingArticle) {
		return (
			<div className="container py-5">
				<div className="row justify-content-center">
					<div className="col-12 col-lg-8">
						<div className="skeleton mb-3" style={{ height: 48, width: '80%' }} />
						<div className="skeleton mb-2" style={{ height: 20, width: '40%' }} />
						<div className="skeleton mt-4" style={{ height: 300 }} />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container py-5">
				<div className="text-center py-5">
					<p style={{ fontSize: '3rem' }}>🔍</p>
					<h4 className="fw-bold">Article not found</h4>
					<p style={{ color: 'var(--color-muted)' }}>
						The article you are looking for does not exist or has been removed.
					</p>
					<Link to="/feed" className="btn btn-brand mt-2">
						← Back to Feed
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-12 col-lg-8">
					{/* Back link */}
					<Link
						to="/feed"
						className="text-decoration-none d-inline-flex align-items-center gap-1 mb-4"
						style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}
					>
						← Back to Feed
					</Link>

					{/* Cover image */}
					{!imageError && article?.slug && (
						<img
							src={getArticlePictureUrl(article.slug)}
							alt="Cover"
							className="img-fluid mb-4 w-100"
							style={{
								maxHeight: 420,
								objectFit: 'cover',
								borderRadius: 'var(--radius)',
							}}
							onError={() => setImageError(true)}
						/>
					)}

					{/* Categories */}
					{article?.categories?.length > 0 && (
						<div className="mb-3 d-flex flex-wrap gap-1">
							{article.categories.map((c) => (
								<span key={c} className="badge-category">{c}</span>
							))}
						</div>
					)}

					{/* Title */}
					<h1 className="reader-title mb-3">{article?.title}</h1>

					{/* Author meta */}
					<div className="reader-meta mb-4 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
						{authorAvatarError ? (
							<div
								style={{
									width: 40,
									height: 40,
									borderRadius: '50%',
									background: 'linear-gradient(135deg, #667eea, #764ba2)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#fff',
									fontSize: '0.9rem',
									fontWeight: 700,
								}}
							>
								{article?.author?.charAt(0).toUpperCase()}
							</div>
						) : (
							<img
								src={getUserPictureUrl(article?.author)}
								alt={article?.author}
								style={{
									width: 40,
									height: 40,
									borderRadius: '50%',
									objectFit: 'cover',
								}}
								onError={() => setAuthorAvatarError(true)}
							/>
						)}
						<div>
							<Link
								to={`/profile/${article?.author}`}
								className="text-decoration-none fw-semibold"
								style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}
							>
								{article?.author}
							</Link>
							<div className="d-flex align-items-center gap-2" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
								{article?.createdAt && (
									<span>
										{new Date(article.createdAt).toLocaleDateString('en-US', {
											month: 'long',
											day: 'numeric',
											year: 'numeric',
										})}
									</span>
								)}
								{article?.views != null && (
									<span title="Views">· 👁 {article.views}</span>
								)}
								<span title="Likes">· ♥ {likesCount}</span>
							</div>
						</div>
						<div className="d-flex align-items-center gap-2 ms-auto">
							{isAuth && (
								<>
									<button
										className={`btn btn-sm ${liked ? 'btn-brand' : 'btn-outline-brand'}`}
										style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
										onClick={handleToggleLike}
										disabled={likeLoading}
										title={liked ? 'Unlike' : 'Like'}
									>
										{liked ? `♥ Liked (${likesCount})` : `♡ Like (${likesCount})`}
									</button>
									<button
										className={`btn btn-sm ${saved ? 'btn-brand' : 'btn-outline-brand'}`}
										style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
										onClick={handleToggleSave}
										disabled={saveLoading}
										title={saved ? 'Unsave' : 'Save'}
									>
										{saved ? '★ Saved' : '☆ Save'}
									</button>
								</>
							)}
							{article?.author === username && (
								<Link
									to={`/editor/${article?.id}`}
									className="btn btn-sm btn-outline-brand"
									style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
								>
									Edit
								</Link>
							)}
						</div>
					</div>

					{/* Article body */}
					<div className="article-body markdown-content mb-5">
						<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
							{article?.body || ''}
						</ReactMarkdown>
					</div>

					{/* AI Assistant */}
					<AiAssistant slug={slug} />

					<hr className="divider" />

					{/* Comments section */}
					<h5 className="fw-bold mb-4">
						Comments
					</h5>

					{isAuth ? (
						<div
							className="mb-4 p-3"
							style={{
								background: 'var(--color-bg)',
								borderRadius: 'var(--radius)',
								border: '1px solid var(--color-border)',
							}}
						>
							{commentError && (
								<div className="alert alert-danger py-2 small">{commentError}</div>
							)}
							<form onSubmit={handleComment}>
								<textarea
									className="form-control border-0 bg-transparent mb-2"
									rows={3}
									placeholder="Share your thoughts…"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									maxLength={255}
									required
									style={{ resize: 'none' }}
								/>
								<div className="d-flex justify-content-between align-items-center">
									<span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
										{commentText.length}/255
									</span>
									<button
										className="btn btn-brand btn-sm"
										type="submit"
										disabled={submitting}
									>
										{submitting ? 'Posting…' : 'Post Comment'}
									</button>
								</div>
							</form>
						</div>
					) : (
						<div
							className="mb-4 p-4 text-center"
							style={{
								background: 'var(--color-brand-light)',
								borderRadius: 'var(--radius)',
							}}
						>
							<p className="mb-2 fw-semibold" style={{ color: 'var(--color-brand)' }}>
								Join the conversation
							</p>
							<Link to="/login" className="btn btn-brand btn-sm">
								Sign in to comment
							</Link>
						</div>
					)}

					{loadingComments && comments.length === 0 ? (
						<div className="text-center py-3">
							<div className="spinner-border spinner-border-sm" style={{ color: 'var(--color-brand)' }} role="status" />
						</div>
					) : comments.length === 0 ? (
						<p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>
							No comments yet. Be the first to share your thoughts!
						</p>
					) : (
						<>
							{comments.map((c, i) => (
								<CommentItem key={c.id || i} comment={c} />
							))}
							{hasMore && (
								<div className="text-center mt-3">
									<button
										className="btn btn-sm btn-outline-brand"
										onClick={handleLoadMore}
										disabled={loadingComments}
									>
										{loadingComments ? 'Loading…' : 'Load more comments'}
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
