import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
	getUser,
	getUserPictureUrl,
	getArticlesByAuthor,
	uploadProfilePicture,
	updateProfile,
	removeProfilePic,
} from '../api';
import ArticleCard from '../components/ArticleCard';

export default function Profile() {
	const { username: paramUsername } = useParams();
	const { username: myUsername } = useAuth();
	const isOwner = paramUsername === myUsername;

	const [user, setUser] = useState(null);
	const [articles, setArticles] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState('');
	const [uploadError, setUploadError] = useState('');
	const [avatarKey, setAvatarKey] = useState(0); // force re-render of avatar on upload
	const fileRef = useRef();

	const [editing, setEditing] = useState(false);
	const [editForm, setEditForm] = useState({ firstName: '', lastName: '', bio: '' });
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState('');

	useEffect(() => {
		setLoading(true);
		setError('');
		Promise.all([
			getUser(paramUsername),
			getArticlesByAuthor(paramUsername, 1),
		])
			.then(([userRes, artRes]) => {
				setUser(userRes.data);
				const list = artRes.data || [];
				setArticles(list);
				setHasMore(list.length > 0);
				setPage(1);
			})
			.catch(() => setError('Could not load profile.'))
			.finally(() => setLoading(false));
	}, [paramUsername]);

	const loadMoreArticles = async () => {
		const next = page + 1;
		setLoadingMore(true);
		try {
			const res = await getArticlesByAuthor(paramUsername, next);
			const list = res.data || [];
			setArticles((prev) => [...prev, ...list]);
			setHasMore(list.length > 0);
			setPage(next);
		} catch {
			setError('Could not load more articles.');
		} finally {
			setLoadingMore(false);
		}
	};

	const handleAvatarUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		setUploadError('');
		try {
			await uploadProfilePicture(fd);
			setAvatarKey((k) => k + 1);
		} catch {
			setUploadError('Could not upload picture. Max 5 MB, JPEG/PNG/GIF/WebP only.');
		}
	};

	const startEditing = () => {
		if (!user) return;
		setEditForm({
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			bio: user.bio || '',
		});
		setEditError('');
		setEditing(true);
	};

	const removePfpSubmit = async (e) => {
		setEditLoading(true);
		setEditError('');
		try {
			console.log(removeProfilePic);
			await removeProfilePic();
			setEditing(false);
		} catch {
			setEditError('Could not remove profile picture.');
		} finally {
			setEditLoading(false);
		}
	}
	const handleEditSubmit = async (e) => {
		e.preventDefault();
		setEditLoading(true);
		setEditError('');
		try {
			await updateProfile(editForm);
			setUser((prev) => ({ ...prev, ...editForm }));
			setEditing(false);
		} catch {
			setEditError('Could not update profile.');
		} finally {
			setEditLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="container py-5">
				<div className="d-flex align-items-center gap-4 mb-5">
					<div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
					<div className="flex-grow-1">
						<div className="skeleton mb-2" style={{ height: 24, width: '40%' }} />
						<div className="skeleton" style={{ height: 16, width: '25%' }} />
					</div>
				</div>
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="container py-5 text-center">
				<p style={{ fontSize: '3rem' }}>👤</p>
				<h4 className="fw-bold">Profile not found</h4>
				<p style={{ color: 'var(--color-muted)' }}>
					The user you are looking for does not exist.
				</p>
				<Link to="/feed" className="btn btn-brand mt-2">
					← Back to Feed
				</Link>
			</div>
		);
	}

	return (
		<div className="container py-5">
			{/* Profile header */}
			<div
				className="d-flex align-items-center gap-4 mb-5 p-4"
				style={{
					background: 'var(--color-surface)',
					border: '1px solid var(--color-border)',
					borderRadius: 'var(--radius)',
				}}
			>
				<div className="position-relative flex-shrink-0" style={{ width: 100, height: 100 }}>
					<img
						key={avatarKey}
						src={getUserPictureUrl(paramUsername)}
						alt={paramUsername}
						className="profile-avatar"
						onError={(e) => {
							e.target.src = `https://ui-avatars.com/api/?name=${paramUsername}&background=6366f1&color=fff&size=100&bold=true`;
						}}
					/>
					{isOwner && (
						<>
							<button
								className="btn btn-sm position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center"
								style={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									background: 'var(--color-brand)',
									color: '#fff',
									border: '2px solid #fff',
								}}
								title="Change photo"
								onClick={() => fileRef.current?.click()}
							>
								✎
							</button>
							<input
								ref={fileRef}
								type="file"
								accept="image/jpeg,image/png,image/gif,image/webp"
								className="d-none"
								onChange={handleAvatarUpload}
							/>
						</>
					)}
				</div>
				<div>
					<h3 className="fw-bold mb-0">
						{user?.firstName} {user?.lastName}
					</h3>
					<p className="mb-1" style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
						@{paramUsername}
					</p>
					{user?.bio && (
						<p className="mb-0" style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
							{user.bio}
						</p>
					)}
					<div className="d-flex gap-3 mt-2">
						{isOwner && (
							<>
								<button
									className="btn btn-sm btn-outline-brand"
									onClick={startEditing}
								>
									Edit Profile
								</button>
								<Link
									to="/dashboard"
									className="btn btn-sm btn-outline-brand"
								>
									Go to Dashboard
								</Link>
								<form onSubmit={removePfpSubmit}>
									<button
										type="removePfpSubm"
										className="btn btn-outline-brand btn-sm"
										disabled={editLoading}
									>
										{editLoading ? 'Saving…' : 'Remove pfp'}
									</button>
								</form>

							</>
						)}
					</div>
					{uploadError && (
						<p className="text-danger small mt-2 mb-0">{uploadError}</p>
					)}
				</div>
			</div>

			{/* Edit profile form */}
			{editing && (
				<div
					className="mb-5 p-4"
					style={{
						background: 'var(--color-surface)',
						border: '1px solid var(--color-border)',
						borderRadius: 'var(--radius)',
					}}
				>
					<h5 className="fw-bold mb-3">Edit Profile</h5>
					{editError && <div className="alert alert-danger py-2 small">{editError}</div>}
					<form onSubmit={handleEditSubmit}>
						<div className="row mb-3">
							<div className="col-6">
								<label htmlFor="editFirstName" className="form-label small fw-semibold">
									First Name
								</label>
								<input
									id="editFirstName"
									type="text"
									className="form-control"
									value={editForm.firstName}
									onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
								/>
							</div>
							<div className="col-6">
								<label htmlFor="editLastName" className="form-label small fw-semibold">
									Last Name
								</label>
								<input
									id="editLastName"
									type="text"
									className="form-control"
									value={editForm.lastName}
									onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
								/>
							</div>
						</div>
						<div className="mb-3">
							<label htmlFor="editBio" className="form-label small fw-semibold">
								Bio
							</label>
							<textarea
								id="editBio"
								className="form-control"
								rows={3}
								value={editForm.bio}
								onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
								style={{ resize: 'none' }}
							/>
						</div>
						<div className="d-flex gap-2">
							<button
								type="submit"
								className="btn btn-brand btn-sm"
								disabled={editLoading}
							>
								{editLoading ? 'Saving…' : 'Save Changes'}
							</button>
							<button
								type="button"
								className="btn btn-outline-brand btn-sm"
								onClick={() => setEditing(false)}
								disabled={editLoading}
							>
								Cancel
							</button>

						</div>
					</form>
				</div>
			)}

			{/* Articles */}
			<h5 className="fw-bold mb-4">Articles by @{paramUsername}</h5>

			{articles.length === 0 ? (
				<div className="text-center py-5">
					<p style={{ fontSize: '3rem' }}>📄</p>
					<p style={{ color: 'var(--color-muted)' }}>No published articles yet.</p>
				</div>
			) : (
				<>
					<div className="row g-4">
						{articles.map((a) => (
							<div key={a.id || a.slug} className="col-12 col-md-6 col-lg-4">
								<ArticleCard article={a} />
							</div>
						))}
					</div>
					{hasMore && (
						<div className="text-center mt-16">
							<button
								className="btn btn-outline-brand btn-sm"
								onClick={loadMoreArticles}
								disabled={loadingMore}
							>
								{loadingMore ? 'Loading…' : 'Load more'}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
