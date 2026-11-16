import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getArticlePictureUrl, getUserPictureUrl } from '../api';

export default function ArticleCard({ article }) {
	const { slug, title, author, published, categories, body, createdAt, views } = article;
	const [imgError, setImgError] = useState(false);
	const [avatarError, setAvatarError] = useState(false);

	// Strip markdown formatting for a clean plain-text excerpt
	const stripMarkdown = (text) =>
		text
			.replace(/#{1,6}\s+/g, '')       // headings
			.replace(/\*{3}(.*?)\*{3}/g, '$1') // bold+italic ***
			.replace(/_{3}(.*?)_{3}/g, '$1')   // bold+italic ___
			.replace(/\*{2}(.*?)\*{2}/g, '$1') // bold **
			.replace(/_{2}(.*?)_{2}/g, '$1')   // bold __
			.replace(/\*(.*?)\*/g, '$1')       // italic *
			.replace(/_(.*?)_/g, '$1')         // italic _
			.replace(/~~(.*?)~~/g, '$1')       // strikethrough
			.replace(/```[\s\S]*?```/g, '')    // fenced code blocks
			.replace(/`([^`]+)`/g, '$1')       // inline code
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images
			.replace(/^\s*[-*+]\s+/gm, '')    // unordered lists
			.replace(/^\s*\d+\.\s+/gm, '')    // ordered lists
			.replace(/^\s*>\s+/gm, '')         // blockquotes
			.replace(/\n{2,}/g, ' ')          // collapse line breaks
			.replace(/\n/g, ' ')
			.trim();

	// Show first ~120 chars of body as excerpt
	const excerpt = body
		? (() => {
			const plain = stripMarkdown(body);
			return plain.length > 120
				? plain.slice(0, 120).trim() + '…'
				: plain;
		})()
		: null;

	const formattedDate = createdAt
		? new Date(createdAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
		: null;

	return (
		<div className="card-ublog h-100">
			{slug && !imgError ? (
				<img
					src={getArticlePictureUrl(slug)}
					alt=""
					className="w-100"
					style={{
						height: 180,
						objectFit: 'cover',
						borderRadius: 'var(--radius) var(--radius) 0 0',
					}}
					onError={() => setImgError(true)}
				/>
			) : (
				<div
					className="w-100 d-flex align-items-center justify-content-center"
					style={{
						height: 180,
						borderRadius: 'var(--radius) var(--radius) 0 0',
						background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
						color: '#6366f1',
						fontSize: '2.5rem',
					}}
				>
					📝
				</div>
			)}
			<div className="card-body d-flex flex-column p-4">
				<div className="mb-2 d-flex flex-wrap gap-1">
					{categories?.map((c) => (
						<span key={c} className="badge-category">
							{c}
						</span>
					))}
					{!published && (
						<span className="badge bg-warning text-dark fw-normal" style={{ fontSize: '0.72rem' }}>
							Draft
						</span>
					)}
				</div>

				<h5 className="mb-2" style={{ fontWeight: 700, lineHeight: 1.3 }}>
					<Link
						to={published ? `/article/${slug}` : '#'}
						className="text-decoration-none"
						style={{ color: 'var(--color-text)' }}
					>
						{title || <span className="text-muted fst-italic">Untitled</span>}
					</Link>
				</h5>

				{excerpt && (
					<p
						className="mb-3 flex-grow-1"
						style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}
					>
						{excerpt}
					</p>
				)}

				<div
					className="d-flex align-items-center justify-content-between mt-auto pt-3"
					style={{ borderTop: '1px solid var(--color-border)' }}
				>
					{author && (
						<Link
							to={`/profile/${author}`}
							className="text-decoration-none d-flex align-items-center gap-2"
							style={{ position: 'relative', zIndex: 1, color: 'var(--color-muted)', fontSize: '0.85rem' }}
						>
							{avatarError ? (
								<div
									style={{
										width: 24,
										height: 24,
										borderRadius: '50%',
										background: 'linear-gradient(135deg, #667eea, #764ba2)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: '#fff',
										fontSize: '0.65rem',
										fontWeight: 700,
									}}
								>
									{author.charAt(0).toUpperCase()}
								</div>
							) : (
								<img
									src={getUserPictureUrl(author)}
									alt={author}
									style={{
										width: 24,
										height: 24,
										borderRadius: '50%',
										objectFit: 'cover',
									}}
									onError={() => setAvatarError(true)}
								/>
							)}
							<span>{author}</span>
						</Link>
					)}
					{formattedDate && (
						<span
							className="d-flex align-items-center gap-2"
							style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}
						>
							{views != null && (
								<span title="Views">👁 {views}</span>
							)}
							<span>{formattedDate}</span>
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
