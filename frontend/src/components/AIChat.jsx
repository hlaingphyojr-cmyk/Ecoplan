import { useEffect, useRef, useState } from 'react';
import { streamChat } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AIChat({ planId, placeholder, className = '' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setError('');
    const history = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setInput('');
    setStreaming(true);
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    const abortController = new AbortController();
    controllerRef.current = abortController;
    try {
      const full = await streamChat(
        history,
        planId,
        {
          onDelta: (delta) =>
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                content: copy[copy.length - 1].content + delta,
              };
              return copy;
            }),
          signal: abortController.signal,
        }
      );
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: full || copy[copy.length - 1].content };
        return copy;
      });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setStreaming(false);
    }
  }

  function stop() {
    controllerRef.current?.abort();
    setStreaming(false);
  }

  return (
    <div className={`flex flex-col rounded-2xl bg-[#ffffff] border border-[#e4e4e0] overflow-hidden ${className}`}>
      <div className="nice-scroll flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#faf9f7]">
        {messages.length === 0 && (
          <div className="text-sm text-[#5f655f] p-2">
            {planId
              ? 'Ask anything about this plan — why it saves CO₂, how to scale it, or how to improve it further.'
              : 'Ask me to generate an optimized production plan, compare materials, or explain low-carbon manufacturing techniques.'}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#f2f2f0] text-[#1c1f1c]'
              }`}
            >
              {m.content || '…'}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 pt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={send} className="p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || 'Ask the AI…'}
          disabled={streaming}
          className="input flex-1 disabled:opacity-60"
        />
        {streaming ? (
          <button type="button" onClick={stop} className="btn-ghost">
            Stop
          </button>
        ) : (
          <button
            disabled={!input.trim() || !user}
            title={user ? 'Send' : 'Log in to chat'}
            className="btn-primary disabled:opacity-40"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}