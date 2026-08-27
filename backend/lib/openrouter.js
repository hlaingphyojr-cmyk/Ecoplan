const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function headers() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'EcoPlan',
  };
}

async function complete({ messages, json = false, temperature = 0.7, maxTokens = 1500 }) {
  const body = {
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };

  const res = await fetch(OPENROUTER_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function streamChat({ messages, temperature = 0.7 }) {
  const body = {
    model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324',
    messages,
    temperature,
    stream: true,
  };

  const res = await fetch(OPENROUTER_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.body;
}

module.exports = { complete, streamChat };