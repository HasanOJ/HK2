# 🧾 Small Business Auto-Bookkeeper - API Server

**Hackathon 2 Project** - Team HasanOJ

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **Ollama** (for AI Chat - required for `/api/auditor/sql`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Ollama (Local LLM) ⚠️ REQUIRED

**Step A: Install Ollama**
- **Windows**: Download from https://ollama.com/download/windows
- **Mac**: `brew install ollama` or download from https://ollama.com
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`

**Step B: Start Ollama service**
```bash
# Windows: Ollama runs automatically after install (check system tray)
# Mac/Linux: 
ollama serve
```

**Step C: Pull the model (~1.9GB download)**
```bash
ollama pull qwen2.5:3b
```

**Step D: Verify it works**
```bash
ollama run qwen2.5:3b "Hello"
# Should respond in ~2 seconds
```

> ⚠️ Without Ollama running, the `/api/auditor/sql` endpoint will fail.
> The `/api/auditor` endpoint works without Ollama (rule-based).

### 3. Seed the Database
```bash
npm run seed
# Creates data/bookkeeper.db with 100 receipts
```

### 4. Start the Server
```bash
npm run dev
# Server: http://localhost:7272
```

---

## 📡 API Endpoints

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/[id]` | Get single receipt |
| POST | `/api/receipts` | Create receipt |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Dashboard stats |
| GET | `/api/vendors` | List vendors |

### AI Auditor Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auditor` | Rule-based chat (no LLM) |
| POST | `/api/auditor/sql` | LLM Text-to-SQL chat |

---

## 🗄️ Database

SQLite at `data/bookkeeper.db` (pre-seeded with 100 receipts)

---

## 🔧 Environment

Copy `.env.example` to `.env.local`:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```
