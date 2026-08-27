import { useMemo, useState } from 'react';
import { CornerUpLeft } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const avatarColors = ['bg-[#f4d9a8]', 'bg-[#b9ddf0]', 'bg-[#f0c4c4]', 'bg-[#cfe8b8]', 'bg-[#e6f4ec]'];

function Avatar({ name }) {
  const color = avatarColors[(name?.length || 0) % avatarColors.length];
  return (
    <span
      className={`shrink-0 w-7 h-7 rounded-full ${color} grid place-items-center text-xs font-bold text-[#1c1f1c]`}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

function ReplyForm({ value, onChange, onSubmit, onCancel, placeholder, submitting, autoFocus }) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input flex-1"
      />
      <button
        disabled={!value.trim() || submitting}
        className="btn-primary disabled:opacity-50"
      >
        {submitting ? '…' : 'Post'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      )}
    </form>
  );
}

export default function CommentSection({ planId, initial }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initial || []);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { roots, childrenByParent, byId } = useMemo(() => {
    const byId = {};
    const childrenByParent = {};
    const roots = [];
    for (const c of comments) {
      byId[c.id] = c;
      if (c.parent) {
        (childrenByParent[c.parent] = childrenByParent[c.parent] || []).push(c);
      } else {
        roots.push(c);
      }
    }
    return { roots, childrenByParent, byId };
  }, [comments]);

  const replyCount = comments.length - roots.length;

  async function postComment(body) {
    setSubmitting(true);
    setError('');
    try {
      const data = await api.post(`/plans/${planId}/comments`, body);
      return data.comment;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const comment = await postComment({ text });
    if (comment) {
      setComments((c) => [...c, comment]);
      setText('');
    }
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;
    const comment = await postComment({ text: replyText, parentId: replyingTo });
    if (comment) {
      setComments((c) => [...c, comment]);
      setReplyText('');
      setReplyingTo(null);
    }
  }

  function startReply(id) {
    if (replyingTo === id) {
      setReplyingTo(null);
      setReplyText('');
    } else {
      setReplyingTo(id);
      setReplyText('');
    }
  }

  function cancelReply() {
    setReplyingTo(null);
    setReplyText('');
  }

  function renderThread(comment, depth) {
    const children = childrenByParent[comment.id] || [];
    return (
      <div key={comment.id}>
        <div className="neu-raised rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Avatar name={comment.author?.name} />
            <span className="text-sm font-bold text-[#1c1f1c]">{comment.author?.name}</span>
            <span className="text-xs text-[#5f655f]">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-[#5f655f]">
            {comment.parent && (
              <span className="inline-flex items-center bg-[#e6f4ec] text-[#047857] rounded-full px-1.5 py-0.5 text-[11px] font-bold mr-1">
                @{byId[comment.parent]?.author?.name || 'reply'}
              </span>
            )}
            {comment.text}
          </p>
          {user && (
            <button
              onClick={() => startReply(comment.id)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#059669] hover:text-[#1c1f1c]"
            >
              <CornerUpLeft size={12} />
              Reply
            </button>
          )}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <ReplyForm
                value={replyText}
                onChange={setReplyText}
                onSubmit={submitReply}
                onCancel={cancelReply}
                submitting={submitting}
                placeholder={`Reply to ${comment.author?.name || 'this comment'}…`}
                autoFocus
              />
            </div>
          )}
        </div>

        {children.length > 0 && (
          <div className="mt-2 ml-4 pl-3 border-l-[3px] border-[#059669]/40 space-y-2">
            {children.map((child) => renderThread(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section>
      <h3 className="font-bold text-[#1c1f1c] mb-3">
        Comments ({comments.length})
        {replyCount > 0 && <span className="font-normal text-[#5f655f] text-sm"> · {replyCount} replies</span>}
      </h3>

      <div className="space-y-4 mb-4">
        {comments.length === 0 && (
          <p className="text-sm text-[#5f655f]">No comments yet — start the conversation.</p>
        )}
        {roots.map((c) => renderThread(c, 0))}
      </div>

      {user ? (
        <ReplyForm
          value={text}
          onChange={setText}
          onSubmit={submit}
          submitting={submitting}
          placeholder="Share a thought or question…"
        />
      ) : (
        <p className="text-sm text-[#5f655f]">Log in to join the discussion.</p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </section>
  );
}