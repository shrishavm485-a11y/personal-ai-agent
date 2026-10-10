# Your Personal AI (Neo-Brutalism)

Express backend + plain HTML/CSS/JS frontend. No build step. The AI key stays on the server.

## Folder structure
```
personal-ai-agent/
  server.js                    Express app, /api/chat, /api/health, rate limit, validation
  providers/openaiCompatible.js  AI provider (swap this file to change providers)
  public/index.html, style.css, app.js
  package.json  .env.example  .gitignore  README.md
```

## 1. Get a free API key
Default provider is Google Gemini (free tier): https://aistudio.google.com/apikey

## 2. Run locally (Windows PowerShell, in VS Code terminal)
```powershell
cd path\to\personal-ai-agent
npm install
Copy-Item .env.example .env
code .env        # paste your key after AI_API_KEY=
npm start
```
Open http://localhost:3000. The status badge shows Connected when the key is found.

## 3. Environment variables
| Name | Required | Value |
|---|---|---|
| `AI_API_KEY` | yes | your provider key |
| `AI_BASE_URL` | no | default `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_MODEL` | no | default `gemini-2.5-flash` |
| `PORT` | no | Render sets this automatically |

Other OpenAI-compatible providers work by changing the last two:
- Groq: `https://api.groq.com/openai/v1`, model `llama-3.3-70b-versatile`
- OpenRouter: `https://openrouter.ai/api/v1`, any model id
- OpenAI: `https://api.openai.com/v1`, model `gpt-4o-mini`

## 4. Push to GitHub
```powershell
git init
git add .
git commit -m "Personal AI agent"
git branch -M main
git remote add origin https://github.com/YOUR_USER/personal-ai-agent.git
git push -u origin main
```
(Create the empty repo on github.com first. `.env` is git-ignored.)

## 5. Deploy on Render
1. Render dashboard > New > Web Service > connect the GitHub repo.
2. Runtime: Node. Build command: `npm install`. Start command: `npm start`. Plan: Free.
3. Environment tab > Add `AI_API_KEY` (and optionally `AI_BASE_URL`, `AI_MODEL`).
4. Deploy, then open the `.onrender.com` URL on your phone. Free services sleep after inactivity, so the first load can take ~30 seconds.
