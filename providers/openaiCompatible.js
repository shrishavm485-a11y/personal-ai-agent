// One provider for any OpenAI-compatible API (Gemini, Groq, OpenRouter, OpenAI...).
// To add a different provider, create another file exporting { isConfigured, chat }
// and swap the require() in server.js.
const baseUrl = () => (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, '');
const model = () => process.env.AI_MODEL || 'gemini-2.5-flash';

const isConfigured = () => Boolean(process.env.AI_API_KEY);

async function chat(messages) {
  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({ model: model(), messages, temperature: 0.7 }),
    signal: AbortSignal.timeout(45000)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    const err = new Error(`Provider returned ${res.status}: ${detail}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Provider returned an empty reply.');
  return text;
}

module.exports = { isConfigured, chat };
