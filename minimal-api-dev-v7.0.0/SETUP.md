# 🧾 Small Business Auto-Bookkeeper - API Server

**Hackathon 2 Project** - Team HasanOJ

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+
- **Ollama** (for AI Chat) - https://ollama.com

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Ollama (for AI Chat)
```bash
# Install Ollama from https://ollama.com
# Then pull the model:
ollama pull qwen2.5:3b
```

### 3. Start the Server
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
