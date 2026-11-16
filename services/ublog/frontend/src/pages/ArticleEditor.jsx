import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
	getArticleById,
	updateArticle,
	publishArticle,
	uploadArticlePicture,
	deleteArticlePicture,
	addCategoryToArticle,
	getArticlePictureUrl,
} from '../api';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TITLE_RE = /^[A-Za-z0-9][A-Za-z0-9\s.,:;!?'"()\\-]{1,175}$/;

export default function ArticleEditor() {
	const { id } = useParams(); // uuid

	const [article, setArticle] = useState(null);
	const [form, setForm] = useState({ slug: '', title: '', body: '' });
	const [category, setCategory] = useState('');
	const [saving, setSaving] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [imagePreview, setImagePreview] = useState('');
	const [previewMode, setPreviewMode] = useState(false);

	// Load article data. If id === 'new', redirect after creation happens in Dashboard.
	const loadArticle = useCallback(async () => {
		if (id === 'new') return;
		try {
			const res = await getArticleById(id);
			const found = res.data;
			if (found) {
				setArticle(found);
				setForm({
					slug: found.slug || '',
					title: found.title || '',
					body: found.body || '',
				});
				if (found.slug) {
					setImagePreview(getArticlePictureUrl(found.slug));
				}
			}
		} catch {
			setError('Could not load article.');
		}
	}, [id]);

	useEffect(() => {
		loadArticle();
	}, [loadArticle]);

	const handleChange = (e) => {
		setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
		setError('');
		setSuccess('');
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!SLUG_RE.test(form.slug)) {
			setError('Slug must be lowercase letters, numbers, and hyphens only.');
			return;
		}
		if (!TITLE_RE.test(form.title)) {
			setError('Title contains invalid characters or is too long (max 175).');
			return;
		}
		if (form.body.length > 5000) {
			setError('Body exceeds 5000 characters.');
			return;
		}
		setSaving(true);
		try {
			await updateArticle(id, form);
			setSuccess('Saved.');
			await loadArticle();
		} catch (err) {
			const msg = err.response?.data?.message;
			setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not save.');
		} finally {
			setSaving(false);
		}
	};

	const handlePublishToggle = async () => {
		setPublishing(true);
		try {
			await publishArticle(id);
			setSuccess(article?.published ? 'Unpublished.' : 'Published!');
			await loadArticle();
		} catch {
			setError('Could not change publish status.');
		} finally {
			setPublishing(false);
		}
	};

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const formData = new FormData();
		formData.append('file', file);
		setUploading(true);
		try {
			await uploadArticlePicture(id, formData);
			setSuccess('Image uploaded.');
			await loadArticle();
			if (article?.slug) setImagePreview(getArticlePictureUrl(article.slug));
		} catch {
			setError('Could not upload image. Max 5 MB, JPEG/PNG/GIF/WebP only.');
		} finally {
			setUploading(false);
		}
	};

	const handleDeleteImage = async () => {
		if (!window.confirm('Remove cover image?')) return;
		try {
			await deleteArticlePicture(id);
			setImagePreview('');
			setSuccess('Image removed.');
		} catch {
			setError('Could not remove image.');
		}
	};

	const handleAddCategory = async (e) => {
		e.preventDefault();
		if (!category.trim()) return;
		try {
			await addCategoryToArticle(id, { name: category.trim() });
			setCategory('');
			setSuccess('Category added.');
			await loadArticle();
		} catch {
			setError('Could not add category.');
		}
	};

	if (id === 'new') {
		return (
			<div className="container py-5 text-center">
				<p style={{ fontSize: '3rem' }}>📝</p>
				<h5 className="fw-semibold">Create a new article</h5>
				<p style={{ color: 'var(--color-muted)' }}>
					Go to your <Link to="/dashboard" className="text-brand fw-semibold">Dashboard</Link> and click &quot;+ New Article&quot;.
				</p>
			</div>
		);
	}

	return (
		<div className="container py-5">
			<div className="row justify-content-center">
				<div className="col-12 col-lg-8">
					<div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
						<h2 className="fw-bold mb-0">
							{article?.published ? 'Edit Article' : 'Edit Draft'}
						</h2>
						<div className="d-flex gap-2">
							{article && (
								<button
									className={`btn btn-sm ${article.published ? 'btn-outline-brand' : 'btn-brand'}`}
									onClick={handlePublishToggle}
									disabled={publishing}
								>
									{publishing
										? '…'
										: article.published
											? 'Unpublish'
											: '🚀 Publish'}
								</button>
							)}
						</div>
					</div>

					{error && <div className="alert alert-danger py-2 small">{error}</div>}
					{success && (
						<div
							className="alert py-2 small"
							style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
						>
							{success}
						</div>
					)}

					{/* Cover image */}
					<div className="mb-4">
						{imagePreview && (
							<div className="position-relative mb-2">
								<img
									src={imagePreview}
									alt="Cover"
									className="img-fluid w-100"
									style={{
										maxHeight: 240,
										objectFit: 'cover',
										borderRadius: 'var(--radius)',
									}}
									onError={() => setImagePreview('')}
								/>
								<button
									className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
									style={{ borderRadius: '50%', width: 28, height: 28, padding: 0 }}
									onClick={handleDeleteImage}
								>
									✕
								</button>
							</div>
						)}
						<label className="btn btn-sm btn-outline-brand" htmlFor="coverInput">
							{uploading ? 'Uploading…' : imagePreview ? 'Change cover' : '🖼 Add cover image'}
						</label>
						<input
							id="coverInput"
							type="file"
							accept="image/jpeg,image/png,image/gif,image/webp"
							className="d-none"
							onChange={handleImageUpload}
							disabled={uploading}
						/>
					</div>

					<form onSubmit={handleSave}>
						<div className="mb-3">
							<label htmlFor="title" className="form-label small fw-semibold">Title</label>
							<input
								id="title"
								name="title"
								type="text"
								className="form-control form-control-lg border-0 border-bottom rounded-0 px-0 fw-bold"
								placeholder="Your article title…"
								value={form.title}
								onChange={handleChange}
								maxLength={175}
								required
								style={{ fontSize: '1.5rem' }}
							/>
						</div>

						<div className="mb-3">
							<label htmlFor="slug" className="form-label small fw-semibold">Slug</label>
							<input
								id="slug"
								name="slug"
								type="text"
								className="form-control"
								placeholder="my-article-slug"
								value={form.slug}
								onChange={handleChange}
								maxLength={100}
								required
							/>
							<div className="form-text">
								Lowercase letters, numbers, hyphens only. E.g. <code>my-first-post</code>
							</div>
						</div>

						<div className="mb-4">
							<label className="form-label small fw-semibold">Content</label>
							<div className="d-flex gap-2 mb-2">
								<button
									type="button"
									className={`btn btn-sm ${!previewMode ? 'btn-brand' : 'btn-outline-brand'}`}
									onClick={() => setPreviewMode(false)}
								>
									✏️ Write
								</button>
								<button
									type="button"
									className={`btn btn-sm ${previewMode ? 'btn-brand' : 'btn-outline-brand'}`}
									onClick={() => setPreviewMode(true)}
								>
									👁 Preview
								</button>
							</div>
							{previewMode ? (
								<div
									className="markdown-content form-control"
									style={{ minHeight: 380, overflow: 'auto', fontFamily: 'var(--font-serif)', lineHeight: 1.8 }}
								>
									{form.body.trim() ? (
										<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
											{form.body}
										</ReactMarkdown>
									) : (
										<span style={{ color: 'var(--color-muted)' }}>Nothing to preview</span>
									)}
								</div>
							) : (
								<textarea
									id="body"
									name="body"
									className="form-control"
									rows={16}
									placeholder="Write your article using Markdown…"
									value={form.body}
									onChange={handleChange}
									maxLength={5000}
									required
									style={{ fontFamily: 'monospace', lineHeight: 1.8 }}
								/>
							)}
							<div className="d-flex justify-content-between form-text">
								<span>
									Supports <strong>Markdown</strong>: **bold**, *italic*, # headings, - lists, `code`, [links](url), and more.
								</span>
								<span>{form.body.length} / 5000</span>
							</div>
						</div>

						<button className="btn btn-brand" type="submit" disabled={saving}>
							{saving ? 'Saving…' : 'Save Changes'}
						</button>
					</form>

					{/*Category
          <hr className="divider" />
          <h6 className="fw-bold mb-2">Categories</h6>
          {article?.categories?.length > 0 && (
            <div className="mb-2 d-flex flex-wrap gap-1">
              {article.categories.map((c) => (
                <span key={c} className="badge-category">{c}</span>
              ))}
            </div>
          )}
           <form className="d-flex gap-2" onSubmit={handleAddCategory}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Add category…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={64}
              pattern="^[a-zA-Z0-9 ]{1,64}$"
            />
            <button className="btn btn-sm btn-outline-brand" type="submit">
              Add
            </button>
          </form> */}
				</div>
			</div>
		</div>
	);
}
