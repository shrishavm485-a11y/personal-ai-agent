require('dotenv').config();
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const provider = require('./providers/openaiCompatible');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const BASE = 'You are a friendly, concise personal AI assistant. Use short paragraphs and markdown code blocks for code.';
const MODES = {
  chat: BASE,
  code: BASE + ' You are an expert coding assistant for HTML, CSS, JavaScript, Python and C. Explain bugs clearly, then show corrected code.',
  study: BASE + ' You are a college tutor. Simplify difficult topics with examples, and create quizzes or study plans when asked.',
  plan: BASE + ' You are a productivity coach. Turn goals into realistic, prioritized plans and task lists.',
  prompt: BASE + ' You write detailed, well-structured prompts for AI tools, website builders, coding assistants and creative projects. Output the prompt in a code block.'
};

app.get('/api/health', (req, res) => res.json({ ok: true, configured: provider.isConfigured() }));

const limiter = rateLimit({
  windowMs: 60_000, max: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Wait a minute and try again.' }
});

app.post('/api/chat', limiter, async (req, res) => {
  if (!provider.isConfigured()) {
    return res.status(503).json({ error: 'AI is not set up yet. Add AI_API_KEY to your environment variables (see README).' });
  }
  const { messages, mode } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({ error: 'Send between 1 and 30 messages.' });
  }
  const clean = [];
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 4000) {
      return res.status(400).json({ error: 'Each message needs a role and text under 4000 characters.' });
    }
    clean.push({ role: m.role, content: m.content });
  }
  try {
    const reply = await provider.chat([{ role: 'system', content: MODES[mode] || MODES.chat }, ...clean]);
    res.json({ reply });
  } catch (err) {
    console.error(err.message);
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ error: err.status === 429 ? 'The AI provider is busy or out of quota. Try again shortly.' : 'The AI provider failed to answer. Check your key, base URL and model.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
