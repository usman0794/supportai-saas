# SupportAI

> AI-powered customer support and knowledge-base SaaS built with Next.js, FastAPI, Gemini, Qdrant, and PostgreSQL.

SupportAI is a reusable AI customer-support platform that allows businesses to create AI-powered chatbots, manage knowledge bases, upload documents, retrieve relevant information using RAG, execute support actions through tool/function calling, monitor conversations, and embed their chatbot into external websites.

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected API endpoints
- Authenticated dashboard

### 🤖 Chatbot Management
- Create multiple chatbots
- Update chatbot information
- Configure name, description, system prompt, welcome message, and active/inactive status
- Delete chatbots
- Owner-based chatbot access control

### 📚 Knowledge Base
- Upload PDF, TXT, and Markdown documents
- Automatic document processing
- Text cleaning and chunking
- Chunk overlap for better retrieval
- Document metadata storage
- Vector embeddings
- Semantic similarity search

### 🧠 RAG Pipeline

```text
Document
   ↓
Supabase Storage
   ↓
Document Extraction
   ↓
Text Cleaning
   ↓
Chunking
   ↓
Gemini Embeddings
   ↓
Qdrant Vector Database
```

When a customer asks a question:

```text
Customer Question
       ↓
Gemini Embedding
       ↓
Qdrant Similarity Search
       ↓
Relevant Knowledge Chunks
       ↓
Gemini
       ↓
AI Response
```

### 🛠️ AI Tool / Function Calling

SupportAI supports Gemini function calling for actions that require structured or dynamic information.

Example:

```text
Customer:
"What is the status of my card CARD123?"

        ↓

Gemini detects required tool

        ↓

get_card_status()

        ↓

Tool result

        ↓

Gemini generates response

        ↓

Customer receives answer
```

Current demo support tools include card-status lookup using mock support data.

### 💬 Conversations
- Create and continue conversations
- Store customer and AI messages
- View conversation history
- Search conversations
- Delete conversations
- Conversation previews
- Conversation timestamps
- Guest conversations through the widget

### 📊 Analytics
- Total chatbots
- Active chatbots
- Total conversations
- Total messages
- Customer messages
- Assistant messages
- Conversations by chatbot
- Recent conversation activity

### 🌐 Embeddable Chatbot Widget

```html
<script
  src="https://YOUR-WIDGET-DOMAIN.com/widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-api-url="https://YOUR-API-DOMAIN.com"
></script>
```

The widget supports:
- Floating chat launcher
- Chat window
- Welcome message
- Customer and AI messages
- Typing indicator
- Conversation persistence
- Local storage
- Stale conversation recovery
- Responsive mobile layout
- Dynamic chatbot configuration

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │      Customer       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   SupportAI Widget  │
                         │    JavaScript/CSS   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     FastAPI API     │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ PostgreSQL   │  │    Qdrant    │  │    Gemini    │
          │  / Supabase  │  │  Vector DB   │  │      AI      │
          └──────────────┘  └──────────────┘  └──────────────┘
                  │                                   │
                  ▼                                   ▼
          ┌──────────────┐                     ┌──────────────┐
          │   Supabase   │                     │  RAG + Tools │
          │   Storage    │                     └──────────────┘
          └──────────────┘
```

## 🧰 Tech Stack

### Frontend
- Next.js
- React
- JavaScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- JWT
- bcrypt

### Database & Storage
- PostgreSQL
- Supabase PostgreSQL
- Supabase Storage

### AI
- Google Gemini
- Gemini `gemini-3.6-flash`
- Gemini `gemini-embedding-2`
- Retrieval-Augmented Generation (RAG)
- Gemini Function Calling

### Vector Database
- Qdrant Cloud
- Cosine similarity search
- Chatbot-based vector filtering

### Development
- Git
- GitHub
- VS Code

---

## 📁 Project Structure

```text
supportAI/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── chatbots.py
│   │   │       ├── documents.py
│   │   │       ├── chat.py
│   │   │       ├── conversations.py
│   │   │       ├── widget.py
│   │   │       └── analytics.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── database/
│   │   │   ├── base.py
│   │   │   └── connection.py
│   │   │
│   │   ├── models/
│   │   │   ├── profile.py
│   │   │   ├── chatbot.py
│   │   │   ├── document.py
│   │   │   ├── document_chunk.py
│   │   │   ├── conversation.py
│   │   │   └── message.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── chatbot.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │   └── conversation.py
│   │   │
│   │   └── services/
│   │       ├── ai.py
│   │       ├── embeddings.py
│   │       ├── rag.py
│   │       ├── search.py
│   │       ├── qdrant.py
│   │       ├── vector_store.py
│   │       ├── tools.py
│   │       ├── tool_calling.py
│   │       ├── supabase.py
│   │       └── document_processor.py
│   │
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── chatbots/
│   │   ├── knowledge-base/
│   │   ├── conversations/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── page.js
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── lib/
│   ├── services/
│   ├── package.json
│   └── next.config.mjs
│
└── widget/
    ├── widget.js
    ├── widget.css
    └── test-widget.html
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/usman0794/supportai-saas.git
cd supportai
```

---

## ⚙️ Backend Setup

### 2. Create a Python Virtual Environment

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Git Bash:

```bash
source venv/Scripts/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=your_postgresql_connection_string

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET_KEY=your_secret_key
```

> Never commit real `.env` files or expose secret API keys publicly.

### 5. Run Database Migrations

```bash
alembic upgrade head
```

### 6. Start the FastAPI Server

```bash
uvicorn app.main:app --reload
```

API:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🌐 Widget Setup

The widget is a standalone JavaScript application.

From the project root:

```bash
cd widget
python -m http.server 5500
```

Open:

```text
http://127.0.0.1:5500/test-widget.html
```

Example:

```html
<script
  src="./widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-api-url="http://127.0.0.1:8000"
></script>
```

Replace `YOUR_CHATBOT_ID` with an existing chatbot ID.

---

## 🔄 RAG Implementation

### Document Ingestion

```text
Upload PDF/TXT/MD
       ↓
Supabase Storage
       ↓
Document Extraction
       ↓
Text Cleaning
       ↓
Chunking
       ↓
Gemini Embedding
       ↓
Qdrant
```

Current embedding configuration:

```text
Model: gemini-embedding-2
Dimensions: 1536
```

Qdrant collection:

```text
supportai_documents
```

Vector payload includes:

```text
document_id
chatbot_id
chunk_id
chunk_index
content
```

### Semantic Search

When a customer asks a question:

1. The question is converted into an embedding.
2. Qdrant performs similarity search.
3. Results are filtered by chatbot ID.
4. Relevant chunks are retrieved.
5. Retrieved context is passed to Gemini.
6. Gemini generates the response.

---

## 🛠️ Function Calling

SupportAI demonstrates Gemini function calling using customer-support tools.

Example:

```text
Customer:
"What is the status of CARD123?"

        ↓

Gemini detects the required tool

        ↓

get_card_status()

        ↓

Structured tool result

        ↓

Gemini generates the final response
```

Demo data:

```text
CARD123 → Dispatched
CARD456 → Active
CARD789 → Blocked
```

The tool layer can be extended with additional business actions.

---

## 💬 Conversation System

Each conversation belongs to a chatbot.

```text
Chatbot
   │
   ├── Conversation
   │      ├── User Message
   │      ├── Assistant Message
   │      ├── User Message
   │      └── Assistant Message
   │
   └── Conversation
          ├── User Message
          └── Assistant Message
```

The system supports both authenticated dashboard conversations and guest conversations through the public widget.

---

## 🔐 Authentication

Authentication is handled by FastAPI using JWT.

```text
Register
   ↓
Password Hashing
   ↓
PostgreSQL
   ↓
Login
   ↓
JWT Access Token
   ↓
Protected API Requests
```

Protected resources validate the authenticated user's ownership before allowing access.

---

## 📊 Analytics

The analytics API provides:

```text
Total Chatbots
Active Chatbots
Total Conversations
Total Messages
Customer Messages
Assistant Messages
```

It also provides:

- Conversations by chatbot
- Recent conversation activity
- Chatbot names
- Conversation previews
- Last activity timestamps

---

## 🌍 Embedding SupportAI

After deployment, a customer can add SupportAI to an external website with a single script:

```html
<script
  src="https://YOUR-WIDGET-DOMAIN.com/widget.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-api-url="https://YOUR-API-DOMAIN.com"
></script>
```

The external website does not need React, Next.js, Python, or any SupportAI backend dependency.

---

## ☁️ Deployment

Planned production architecture:

```text
                    Production
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
       Vercel                       Render
     Next.js App                 FastAPI API
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
                  ▼                   ▼                   ▼
              Supabase             Qdrant              Gemini
             PostgreSQL            Cloud                 API
                  │
                  ▼
             Supabase
              Storage
```

Recommended services:

- Frontend → Vercel
- Backend → Render
- PostgreSQL → Supabase
- File storage → Supabase Storage
- Vector database → Qdrant Cloud
- AI → Google Gemini
- Widget → Static hosting/CDN

---

## 🧪 API Documentation

FastAPI provides interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

Main API areas:

```text
Authentication
Chatbots
Documents
Chat
Conversations
Widget
Analytics
```

---

## 🔒 Security

The project includes:

- JWT authentication
- bcrypt password hashing
- Protected API endpoints
- Owner-based authorization
- Environment variables for secrets
- Database foreign-key constraints
- Cascading deletes where appropriate
- Guest widget conversations
- Chatbot ownership validation

For production, configure HTTPS, restricted CORS origins, secure JWT secrets, production credentials, rate limiting, monitoring, and proper secret management.

---

## 🛣️ Future Improvements

- Streaming AI responses
- Advanced analytics
- Conversation ratings
- Human-agent handoff
- Email integration
- WhatsApp integration
- Slack integration
- Additional business tools
- Website crawling for knowledge ingestion
- Multi-language support
- Custom chatbot branding
- Team roles and permissions
- Subscription and billing
- Usage-based limits
- Production rate limiting
- Background document processing
- RAG evaluation and monitoring

---

## 📌 Project Status

- [x] JWT authentication
- [x] User registration/login
- [x] Chatbot CRUD
- [x] Chatbot configuration
- [x] PostgreSQL database
- [x] Supabase Storage
- [x] Document upload
- [x] PDF/TXT/Markdown processing
- [x] Document chunking
- [x] Gemini embeddings
- [x] Qdrant vector search
- [x] RAG pipeline
- [x] Gemini function calling
- [x] Customer-support tools
- [x] Conversation management
- [x] Conversation search
- [x] Analytics
- [x] Embeddable chatbot widget
- [x] Guest widget conversations
- [x] Stale conversation recovery
- [x] Responsive widget UI

---

## 👨‍💻 Author

**Usman Jami**

Full-Stack Development | AI/ML

GitHub:  
https://github.com/usman0794

---

## 📄 License

This project is currently intended as a portfolio and demonstration project.

Add an appropriate open-source license before distributing the project publicly under an open-source license.
