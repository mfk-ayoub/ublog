import { useState, useRef, useEffect, useCallback } from 'react';
import { summarizeArticle, aiChat, askArticle } from '../api';

const MODE_ARTICLE = 'article';
const MODE_GENERAL = 'general';

let msgId = 0;

export default function AiAssistant({ slug }) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState(MODE_ARTICLE);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [summary, setSummary] = useState('');
	const bottomRef = useRef(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, loading]);

	const handleSummarize = async () => {
		if (summaryLoading) return;
		setSummaryLoading(true);
		setSummary('');
		try {
			const res = await summarizeArticle(slug);
			setSummary(res.data?.answer || 'No summary available.');
		} catch {
			setSummary('Failed to generate summary. Please try again.');
		} finally {
			setSummaryLoading(false);
		}
	};

	const handleSend = async (e) => {
		e.preventDefault();
		const question = input.trim();
		if (!question || loading) return;

		setMessages((prev) => [...prev, { id: ++msgId, role: 'user', text: question }]);
		setInput('');
		setLoading(true);

		try {
			const res =
				mode === MODE_ARTICLE
					? await askArticle(slug, question)
					: await aiChat(question);
			setMessages((prev) => [
				...prev,
				{ id: ++msgId, role: 'assistant', text: res.data?.answer || 'No response.' },
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{ id: ++msgId, role: 'assistant', text: 'Something went wrong. Please try again.' },
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleClearChat = useCallback(() => {
		setMessages([]);
		setInput('');
		setLoading(false);
	}, []);

	return (
		<div className="ai-assistant mb-4">
			{/* Toggle bar */}
			<button
				className="ai-toggle-btn w-100"
				onClick={() => setOpen((o) => !o)}
				type="button"
			>
				<span className="d-flex align-items-center gap-2">
					<span style={{ fontSize: '1.1rem' }}>✨</span>
					<span className="fw-semibold">AI Assistant</span>
				</span>
				<span style={{ fontSize: '0.85rem', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
					▾
				</span>
			</button>

			{open && (
				<div className="ai-panel">
					{/* Summarize section */}
					<div className="ai-section">
						<div className="d-flex align-items-center justify-content-between mb-2">
							<span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
								📝 Quick Summary
							</span>
							<button
								className="btn btn-brand btn-sm"
								onClick={handleSummarize}
								disabled={summaryLoading}
								style={{ fontSize: '0.8rem', padding: '0.2rem 0.75rem' }}
							>
								{summaryLoading ? 'Generating…' : summary ? 'Regenerate' : 'Summarize'}
							</button>
						</div>
						{summaryLoading && (
							<div className="skeleton" style={{ height: 48, borderRadius: 8 }} />
						)}
						{summary && !summaryLoading && (
							<div className="ai-summary-text">{summary}</div>
						)}
					</div>

					<div className="ai-divider" />

					{/* Chat section */}
					<div className="ai-section">
						<div className="d-flex align-items-center justify-content-between mb-2">
							<span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
								💬 Ask a Question
							</span>
							{messages.length > 0 && (
								<button
									className="btn btn-sm"
									onClick={handleClearChat}
									style={{
										fontSize: '0.75rem',
										color: 'var(--color-muted)',
										padding: '0.15rem 0.5rem',
									}}
								>
									Clear chat
								</button>
							)}
						</div>

						{/* Mode toggle */}
						<div className="ai-mode-toggle mb-2">
							<button
								className={`ai-mode-btn ${mode === MODE_ARTICLE ? 'active' : ''}`}
								onClick={() => setMode(MODE_ARTICLE)}
								type="button"
							>
								This Article
							</button>
							<button
								className={`ai-mode-btn ${mode === MODE_GENERAL ? 'active' : ''}`}
								onClick={() => setMode(MODE_GENERAL)}
								type="button"
							>
								General Chat
							</button>
						</div>

						{/* Messages */}
						{messages.length > 0 && (
							<div className="ai-messages">
								{messages.map((msg) => (
									<div key={msg.id} className={`ai-msg ai-msg-${msg.role}`}>
										<span className="ai-msg-label">
											{msg.role === 'user' ? 'You' : 'AI'}
										</span>
										<span className="ai-msg-text">{msg.text}</span>
									</div>
								))}
								{loading && (
									<div className="ai-msg ai-msg-assistant">
										<span className="ai-msg-label">AI</span>
										<span className="ai-typing">
											<span />
											<span />
											<span />
										</span>
									</div>
								)}
								<div ref={bottomRef} />
							</div>
						)}

						{/* Input */}
						<form onSubmit={handleSend} className="ai-input-row">
							<input
								className="form-control form-control-sm ai-input"
								type="text"
								placeholder={
									mode === MODE_ARTICLE
										? 'Ask about this article…'
										: 'Ask anything…'
								}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								disabled={loading}
							/>
							<button
								className="btn btn-brand btn-sm"
								type="submit"
								disabled={loading || !input.trim()}
								style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }}
							>
								Send
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
