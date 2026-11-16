_This project has been created as part of the 42 curriculum by ayel-mou, yait-lhi, aattak, abait-ou, rkhatim._

# ft_transcendence — *ublog* Articles Platform

A containerized, microservice-based **articles publishing platform** (brand name: **ublog**) built for **42’s ft_transcendence** (v20).

this application is a Medium-like platform with authentication, user profiles, an articles feed, reading pages, and an editor—plus an AI service foundation and a full monitoring stack.

---

## Table of Contents

- [1. Project Context (ft_transcendence)](#1-project-context-ft_transcendence)
- [2. Team Information](#2-team-information)
- [3. Project Management](#3-project-management)
- [4. Description](#4-description)
- [5. Features List](#5-features-list)
- [6. Technical Stack](#6-technical-stack)
- [7. Architecture Overview](#7-architecture-overview)
- [8. Database Schema (high-level)](#8-database-schema-high-level)
- [9. Instructions (Local / Docker)](#9-instructions-local--docker)
  - [9.1 Prerequisites](#91-prerequisites)
  - [9.2 Setup](#92-setup)
  - [9.3 Run](#93-run)
  - [9.4 Useful Make targets](#94-useful-make-targets)
  - [9.5 Service URLs / Ports](#95-service-urls--ports)
  - [9.6 Environment variables & secrets](#96-environment-variables--secrets)
- [10. Modules (ft_transcendence)](#10-modules-ft_transcendence)
- [11. Privacy Policy & Terms of Service](#11-privacy-policy--terms-of-service)
- [12. Resources (and AI usage)](#12-resources-and-ai-usage)
- [13. License](#13-license)

---

## 1. Project Context (ft_transcendence)

**ft_transcendence** is a long group project where we must deliver a complete web application with:

- frontend + backend + database
- containerized deployment runnable with a **single command**
- multi-user support
- secure authentication
- **HTTPS everywhere** (backend side)
- accessible **Privacy Policy** and **Terms of Service** pages (non-placeholder)

This repository is our implementation: **ublog**, an articles platform.

---

## 2. Team Information

We are a team of **5** and assigned the required roles from the subject:

### Team roles (as required by the subject)

- **Product Owner (PO) — AI member**
  - Defines feature priorities (feed, editor, auth flows, AI service goals)
  - Validates user stories and evaluation readiness
  - Maintains the “modules we claim” list (only what we can demo)

- **Project Manager / Scrum Master (PM) — Backend member**
  - Plans milestones, runs check-ins, tracks blockers
  - Keeps integration stable across services and compose

- **Technical Lead / Architect — DevOps member**
  - Owns infrastructure choices (Docker, Nginx TLS, monitoring)
  - Ensures service boundaries and deployment are consistent
  - Reviews critical infra/security changes

- **Developers**
  - **Backend developer (PM also contributes as developer)**
	- Youness Ait Lhir
  - **2× Frontend developers**
	- Abdelmajid Ait Ouaziz
	- Rekia Khatim
  - **DevOps developer (Tech Lead also contributes as developer)**
	- Anass Attak
  - **AI developer (PO also contributes as developer)**:
	- Ayoub ElMouafik

---

## 3. Project Management

**How we organized work**
- Weekly planning (scope, priorities, module readiness)
- Small tasks with clear owners (frontend pages, auth endpoints, compose wiring, monitoring)
- Review of “evaluation demo” checklist before merging larger changes

**Tools**
- GitHub Issues / Projects (or equivalent board) for task distribution
- Pull requests for review of critical code (auth + infra + DB changes)

**Communication**
- Discord (daily async) + short weekly sync call

---

## 4. Description

**ublog** is a publishing platform where users can:
- create an account / sign in
- browse an articles feed
- read articles by slug
- edit and publish content from an authenticated editor
- view user profiles

The backend is decomposed into multiple NestJS services and exposed via a gateway behind an HTTPS Nginx reverse proxy.

---

## 5. Features List

### Frontend (React)
- **Feed page** (public) — *Frontend Developers*
- **Article reader** (`/article/:slug`) (public) — *Frontend Developers*
- **Profile page** (`/profile/:username`) (public) — *Frontend Developers*
- **Login/Register page** (`/login`) — *Frontend Developers*
  - form validation (HTML constraints like min length, required)
  - legal links surfaced during onboarding (Terms/Privacy)
- **Dashboard** (`/dashboard`) (protected) — *Frontend Developers*
- **Article editor** (`/editor/:id`) (protected) — *Frontend Developers*
- **Privacy Policy page** (`/privacy`) — *Frontend Developers*
- **Terms of Service page** (`/terms`) — *Frontend Developers*
- **Protected routing** — *Frontend Developers*

### Backend / Services
- **Gateway (NestJS)**
  - central API entrypoint (internal service proxying patterns) — *Backend Developer*
- **Auth service (NestJS + PostgreSQL + TypeORM)**
  - JWT token generation — *Backend Developer*
  - password hashing with Argon2 — *Backend Developer*
  - password reset flow (token + email sending) — *Backend Developer*
- **Users service (NestJS + PostgreSQL + TypeORM)**
  - user storage foundation — *Backend Developer*
  - uploads volume support — *Backend Developer*
- **Articles service (NestJS + PostgreSQL)**
  - service + dedicated DB container foundation — *Backend Developer*

### DevOps / Infrastructure
- **Docker Compose orchestration (single-command run)** — *DevOps / Tech Lead*
- **Nginx reverse proxy + HTTPS in dev** — *DevOps / Tech Lead*
- **JWT key generation & TLS cert generation scripts** — *DevOps / Tech Lead*
- **Monitoring stack (Prometheus + Grafana + cAdvisor + Alertmanager)** — *DevOps / Tech Lead*

### AI Foundations
- **RAG article questions** — semantic retrieval across indexed articles or within one article, followed by a streamed, source-grounded answer — *AI Developer / PO*
- **General chat** — streamed LLM responses without article retrieval — *AI Developer / PO*
- **Full-article summaries** — reads the complete stored article; long inputs use hierarchical map/reduce before streaming the final summary, rather than summarizing only the first chunks — *AI Developer / PO*
- **Content moderation** — checks title, content, and categories in overlapping segments before indexing; rejects flagged submissions and returns an unavailable error if moderation fails or produces invalid output — *AI Developer / PO*
- **Article indexing and deletion** — MongoDB stores article documents and chunks; Qdrant stores model-tagged embeddings and source metadata, with revision-based vector upserts — *AI Developer / PO + DevOps / Tech Lead*
- **Atomic daily quota** — a shared MongoDB counter per user and UTC day covers questions, chat, and summaries (30 requests by default); exhausted quotas return HTTP 429 and quota-storage failures return HTTP 503 — *AI Developer / PO*
- **Internal service authentication** — the gateway supplies a shared `X-AI-Service-Key`; AI application routes require it, and the AI API has no published host port — *AI Developer / PO + DevOps / Tech Lead*

---

## 6. Technical Stack

### Frontend
Source location: `services/ublog/frontend`.

- React (Vite)
- React Router
- Bootstrap
- Axios

### Backend
- NestJS (TypeScript)
- Validation: `class-validator`, `joi`
- Auth: Passport, JWT
- ORM: TypeORM

### Datastores
- PostgreSQL (separate DB containers per service)
- MongoDB (AI service)
- Qdrant (vector database)

### AI tools, models, and libraries

| Tool / library | Role in the current AI service |
|---|---|
| Python 3.11 + Docker | `python:3.11-slim` runtime for the AI container |
| FastAPI + Uvicorn | Internal HTTP API, dependency-based service-key checks, and plain-text streaming responses |
| Pydantic v2 + `pydantic-settings` | Request / moderation validation and environment-backed settings |
| Groq SDK (`AsyncGroq`) | Hosted generation, chat, summaries, and structured moderation; generation and moderation both default to `llama-3.3-70b-versatile` |
| `google-genai` | Hosted Gemini embeddings; settings default to `gemini-embedding-001`, 768 dimensions, and batches of 32 inputs |
| `langchain-text-splitters` | `RecursiveCharacterTextSplitter`: 500-character chunks with 50-character overlap, not token counts |
| Motor + MongoDB | Async article / chunk persistence and atomic daily quota counters |
| `qdrant-client` (`AsyncQdrantClient`) + Qdrant | Async dense-vector storage and cosine-similarity retrieval |
| `anyio` / `asyncio` | Async I/O, bounded provider waits, streaming, and cancellation-aware cleanup |

The direct dependencies are listed in `services/ai-system/requirements.txt`. LangChain is used only for text splitting: the current service does not use LangChain agents or agent orchestration. Models are consumed through hosted APIs; ublog does not train or fine-tune them.

### DevOps / Observability
- Docker + Docker Compose
- Nginx (reverse proxy + TLS termination)
- Prometheus + Grafana + cAdvisor + Alertmanager

---

## 7. Architecture Overview

Runtime composition is defined in:

- `infrastructure/docker-compose.yml`

High-level request flow:

1. **Browser → Nginx (HTTPS)**
2. Nginx routes:
   - frontend UI
   - API traffic to **Gateway**
3. Gateway forwards requests to internal services (Auth, Users, Articles, AI…)
4. Each domain service owns its persistence layer (Postgres per service)
5. Monitoring stack observes containers and exposes dashboards

### AI request and indexing flow

All paths below are internal AI routes under `/api/data`; browser requests go through the gateway, not directly to `ai-api`.

| Endpoint | Behavior |
|---|---|
| `POST /upload`, `PUT /update` | Moderate the submission, split content, generate document embeddings, upsert the MongoDB article, replace its MongoDB chunks, then upsert the Qdrant revision and remove older vectors for that model |
| `DELETE /delete` | Delete article vectors across embedding models in the configured collection, then delete MongoDB chunks and the article document |
| `POST /ask` | Consume quota, retrieve relevant context (optionally filtered by `article_id`), then stream an answer |
| `POST /chat` | Consume quota and stream general chat without retrieval |
| `POST /summarize` | Consume quota, load the complete article from MongoDB, and stream its final summary after any required reduction steps |

The gateway exposes these AI features to authenticated users as:

| Gateway route | Internal AI route | Purpose |
|---|---|---|
| `POST /article/:slug/ask` | `POST /api/data/ask` | Answer using the selected article |
| `POST /article/ai/chat` | `POST /api/data/chat` | General chat |
| `POST /article/:slug/summarize` | `POST /api/data/summarize` | Summarize the selected article |

The AI service streams tokens internally, but the current gateway proxy buffers the
response before returning it to the frontend. The frontend therefore receives a
completed `answer` string rather than progressively rendered tokens.

**RAG retrieval:** document chunks use Gemini's `RETRIEVAL_DOCUMENT` task type; questions use `RETRIEVAL_QUERY`. Qdrant searches within the configured embedding-model tag and optional article filter. By default, retrieval overfetches up to 20 candidates with cosine score at least 0.35, validates and sorts them, and removes duplicate chunk identities and exact / near-duplicate text. Global searches select at most 3 chunks per article; article-scoped searches do not apply that diversity cap. At most 5 passages are retained within a 16,000-character context budget, including metadata headers.

Each passage carries its title, article ID, and chunk index. The generation prompt assigns numbered source IDs, requests citations such as `[1]`, treats sources as untrusted data, and asks the model to abstain when evidence is insufficient. An empty retrieval returns a no-context message rather than a general-knowledge answer. Citations and grounding are prompt instructions, not a verified citation API or a guarantee of accuracy or resistance to prompt injection; review generated answers and moderation decisions.

**Storage and retries:** MongoDB and Qdrant operations are not one atomic cross-store transaction. Indexing or deletion can fail after partial writes; retry the same request after resolving the failure. Stable vector point IDs and article upserts support retries, but do not provide transactional isolation. Vector upsert and stale-revision cleanup are separate operations, so readers can briefly see both revisions. Serialize indexing, deletion, and retries for the same article across service instances; concurrent writers can otherwise interfere.

---

## 8. Database Schema (high-level)

## Database Schema (from TypeORM entities)

### Auth Service (PostgreSQL)

#### `auth`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated (`PrimaryGeneratedColumn('uuid')`) |
| `email` | varchar | no | **UNIQUE** |
| `username` | varchar | no | **UNIQUE** |
| `password_hash` | varchar | no | password hash (argon2 in service code) |
| `is_active` | boolean | no | default `true` |
| `created_at` | timestamp | no | auto (`CreateDateColumn`) |
| `updated_at` | timestamp | no | auto (`UpdateDateColumn`) |
| `password_reset_token` | varchar(256) | yes | nullable |
| `password_reset_token_expiration_date` | timestamp | yes | nullable |

---

### Users Service (PostgreSQL)

#### `users`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `authId` | varchar/text | no | **UNIQUE**, immutable (`update: false`); links to `auth.id` (cross-service) |
| `firstName` | varchar/text | no |  |
| `lastName` | varchar/text | no |  |
| `username` | varchar/text | no | **UNIQUE** |
| `profilePicture` | text | yes | nullable |
| `bio` | text | yes | nullable |
| `createdAt` | timestamp | no | auto (`CreateDateColumn`) |
| `updatedAt` | timestamp | no | auto (`UpdateDateColumn`) |


---

### Articles Service (PostgreSQL)

#### `articles`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `body` | text | yes | nullable |
| `displayImg` | text | yes | nullable |
| `slug` | text | yes | **UNIQUE** (nullable in entity) |
| `excerpt` | text | yes | nullable |
| `title` | text | yes | nullable |
| `author` | text | no | user identifier (stored as text, no FK) |
| `published` | boolean | no | default `false` |
| `views` | integer | no | default `0` |
| `createdAt` | timestamp | no | auto (NOTE: entity uses `@UpdateDateColumn()` on this field) |
| `updatedAt` | timestamp | no | auto (NOTE: entity uses `@CreateDateColumn()` on this field) |

> Note: `createdAt` / `updatedAt` decorators appear swapped in the entity. This table reflects the code as-is.

#### `likes`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `slug` | text | yes | nullable |
| `articleId` | uuid | no | logical ref to `articles.id` (no FK in entity) |
| `author` | varchar(100) | no | user identifier (likely username), no FK |

#### `comments`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `slug` | text | yes | nullable |
| `articleId` | uuid | no | logical ref to `articles.id` (no FK in entity) |
| `author` | varchar(100) | no | user identifier (likely username), no FK |
| `content` | text | no |  |

#### `saves`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `slug` | text | yes | nullable |
| `articleId` | uuid | no | logical ref to `articles.id` (no FK in entity) |
| `author` | varchar(100) | no | user identifier (likely username), no FK |


#### `article_categories`
| Column | Type | Null | Constraints / Notes |
|---|---|---:|---|
| `id` | uuid | no | **PK**, generated |
| `articleId` | uuid | no | logical ref to `articles.id` |
| `categoryId` | uuid | no | logical ref to `categories.id` |
| `published` | boolean | no | default `false` |

### Auth DB (PostgreSQL)
- `auth` (or equivalent)
  - `id`
  - `email`
  - `username`
  - `password_hash`
  - `password_reset_token`
  - `password_reset_token_expiration_date`
  - timestamps

### Users DB (PostgreSQL)
- `users`
  - `id`
  - profile fields (name, username, avatar/path, etc.)
  - timestamps
- uploads stored on mounted volume (`users-uploads-volume`)

### Articles DB (PostgreSQL)
- `articles`
  - `id`
  - `slug`
  - `title`
  - `body/content`
  - `author_id`
  - timestamps
- uploads stored on mounted volume (`articles-uploads-volume`)

### AI datastore
- MongoDB:
  - `projects`: article UUID as `project_id`, title, full content, and categories
  - `chunks`: article ID, ordered chunk index, and chunk content
  - `rate_limits`: atomic user / UTC-day counters with TTL cleanup after seven days; reset correctness does not depend on TTL cleanup timing
- Qdrant: chunk embeddings with article ID, content, chunk index, title, revision, and embedding-model metadata; cosine distance and configured vector dimensions are validated without automatically recreating incompatible collections

Startup creates a **unique index on `projects.project_id`**. Existing installations must clean up duplicate project IDs before starting the updated service, otherwise index creation can fail.

Reindex existing articles when changing the embedding model or dimensions. Use a new compatible `QDRANT_COLLECTION` or perform an explicit migration if dimensions change; the service will not delete and recreate an incompatible collection. By default, searches require the configured `embedding_model` payload tag: legacy untagged points are excluded and need reindexing even if their dimensions match.

---

## 9. Instructions (Local / Docker)

### 9.1 Prerequisites
- Docker + Docker Compose (v2)
- GNU Make (recommended)
- OpenSSL (for generating local dev TLS certs)

### 9.2 Setup
From the repository root:

```bash
make setup
```

This will (only if missing):
- copy `*.example` → real config files
- generate the shared AI service key at `infrastructure/secrets/ai-system/service.key`
- create local bind-mount storage directories under `./storage`
- generate JWT keypair under `infrastructure/secrets/jwt`
- generate self-signed TLS certs for Nginx under `infrastructure/secrets/nginx`

### 9.3 Run

Build & run everything:

> make sure to run `make setup` before building

```bash
make build
```

Or run without rebuild:

```bash
make up
```

Run in foreground (attached logs):

```bash
make live
```

Stop:

```bash
make down
```

### 9.4 Useful Make targets
- `make setup` — generate local secrets/configs + storage dirs
- `make up` — start stack (detached)
- `make build` — start stack and rebuild images
- `make down` — stop stack
- `make clean` — stop + remove images for this compose file
- `make fclean` — aggressive docker image cleanup

### 9.5 Service URLs / Ports

| Service | URL / Port (host) | Notes |
|--------|--------------------|------|
| Nginx (entrypoint) | `https://localhost` (443) / `http://localhost` (80) | Use HTTPS for subject compliance |
| Gateway | `http://localhost:8088` → container `:3000` | Internal API routing |
| Auth service | `http://localhost:3000` | Dev exposed |
| Users service | `http://localhost:3001` | Dev exposed |
| Articles service | `http://localhost:3002` | Dev exposed |
| AI API | Internal only: `http://ai-api:8000` (not published to the host) | Gateway supplies the service key; depends on MongoDB + Qdrant |
| Qdrant | `http://localhost:6333` | Vector DB |
| Prometheus | `http://localhost:9090` | Metrics |
| Grafana | `http://localhost:3333` | Dashboards |
| Alertmanager | `http://localhost:9093` | Alerts |

> Expect a browser warning for the **self-signed certificate** in local dev.

### 9.6 Environment variables & secrets

Main locations:
- `infrastructure/env/**/.env`
- `infrastructure/secrets/**`

### AI configuration

Configure provider credentials and AI settings in `infrastructure/env/ai-api/.env` before using AI features. The names and defaults below come from `services/ai-system/app/src/config/settings.py`; constructor fallback values are not the application settings defaults.

Never commit the generated `.env` file or provider credentials. The tracked
`.env.example` contains placeholders only; if the example credentials were ever
used, revoke and replace them at the provider immediately.

| Variable | Default / requirement |
|---|---|
| `APP_NAME` | Required application name |
| `MONGODB_URL`, `MONGODB_DATABASE` | Required MongoDB connection URL and database name |
| `QDRANT_URL` | Required Qdrant URL; Compose service address: `http://qdrant:6333` |
| `QDRANT_COLLECTION` | `article_chunks` |
| `QDRANT_API_KEY` | Optional; unset by default |
| `GROQ_API_KEY`, `GEMINI_API_KEY` | Required hosted-provider credentials; keep server-side |
| `AI_SERVICE_API_KEY` / `AI_SERVICE_API_KEY_FILE` | Shared internal key / path to a key file; the file takes precedence when configured |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `GROQ_MODERATION_MODEL` | `llama-3.3-70b-versatile` |
| `PROVIDER_TIMEOUT_SECONDS` | `30.0` |
| `LLM_MAX_TOKENS` | `2048` output tokens per completion |
| `MODERATION_CHUNK_SIZE` | `6000` characters |
| `SUMMARY_CHUNK_SIZE` | `12000` characters |
| `MAX_CONTEXT_CHARS` | `24000` characters; overall provider context-content budget |
| `NUMBER_OF_REQUESTS_PER_DAY` | `30`; shared across ask, chat, and summarize per user / UTC day |
| `EMBEDDING_MODEL` | `gemini-embedding-001` |
| `EMBEDDING_DIMENSIONS` | `768` |
| `EMBEDDING_BATCH_SIZE` | `32` inputs; allowed range 1–100 |
| `RAG_TOP_K` | `5` selected passages |
| `RAG_CANDIDATE_LIMIT` | `20` candidates; must be at least `RAG_TOP_K` |
| `RAG_SCORE_THRESHOLD` | `0.35` minimum cosine score |
| `RAG_MAX_CHUNKS_PER_ARTICLE` | `3`, applied only to global retrieval |
| `RAG_MAX_CONTEXT_CHARS` | `16000`, including passage metadata; must not exceed `MAX_CONTEXT_CHARS` |

The internal service key must contain **at least 32 characters** and be identical in the gateway and AI API. `make setup` generates it if missing; Compose mounts that shared secret into both services and sets `AI_SERVICE_API_KEY_FILE=/run/secrets/ai-service-key`. For a deployment outside Compose, configure the same `AI_SERVICE_API_KEY` in both processes or point each process's `AI_SERVICE_API_KEY_FILE` to a file containing that same key. Never expose it or provider keys in the frontend. The gateway supplies the authenticated user identity for quota accounting; the service key authenticates the gateway, not an individual end user. Quota is consumed before retrieval / generation, so failed downstream operations can still use a request.

**Privacy and cost:** article content and metadata are sent to Groq for moderation, full article content / partial summaries for summarization, and retrieved passages plus questions for RAG answers. Google receives document chunks and search questions for embeddings; Groq receives general-chat questions. These hosted calls require network access and may incur costs or provider rate limits, especially for long articles requiring multiple calls. ublog performs inference, not model training; provider retention and training-use policies depend on the selected service and account terms, so review those terms before sending private or sensitive content.

If you need to regenerate TLS:
```bash
rm infrastructure/secrets/nginx/selfsigned.crt infrastructure/secrets/nginx/selfsigned.key
./scripts/generate-ssl-certs.sh
```

If you need to regenerate JWT keys:
```bash
rm -rf infrastructure/secrets/jwt
./scripts/generate-jwt-keys.sh
```

---

## 10. Modules (ft_transcendence)

### Web
- **Major (framework frontend + backend)**:
  - Frontend: React (Vite)
  - Backend: NestJS
- **Minor**: TypeORM
- **Major**: A public API to interact with the database
- **Minor**: Custom-made design system with reusable components
- **Minor**: File upload and management system
- **Minor**: Support for additional browsers

### User Management
- **Major**: Standard user management and authentication
- **Minor**: User activity analytics and insights dashboard

### AI
- **Major**: Implement a complete RAG (Retrieval-Augmented Generation) system
- **Major**: Implement a complete LLM system interface
- **Minor**: Content moderation AI — pre-indexing checks and rejection, not automatic deletion or warning workflows

#### AI implementation modules

Paths are relative to this README's directory; the schema directory is named `src/shemas` in the current codebase.

| Module | Responsibility |
|---|---|
| `services/ai-system/app/src/main.py` | FastAPI lifecycle, shared-key authentication, MongoDB connection and startup indexes |
| `services/ai-system/app/src/config/settings.py` | Environment-backed configuration and validation |
| `services/ai-system/app/src/routers/request_router.py` | Moderation, article upload / update / deletion, and indexing coordination |
| `services/ai-system/app/src/routers/response_router.py` | Quota checks, RAG / chat / summary endpoints, and response streaming |
| `services/ai-system/app/src/services/rag_service.py` | Retrieval orchestration, filtering, deduplication, diversity, and context budgeting |
| `services/ai-system/app/src/services/vectordatabase.py` | Async Qdrant collection validation, revision-based writes, deletion, and metadata retrieval |
| `services/ai-system/app/src/services/project_service.py` | MongoDB article upserts and lookups |
| `services/ai-system/app/src/services/llm_service.py` | Generation / summary service interface |
| `services/ai-system/app/src/embedding/Embedding.py` | Async Gemini document / query embeddings, batching, and vector validation |
| `services/ai-system/app/src/llm/GroqProvider.py` | Groq completions, streaming, structured moderation, hierarchical summaries, and RAG prompts |
| `services/ai-system/app/src/utils/chunking.py` | Character-based splitting and MongoDB chunk persistence |
| `services/ai-system/app/src/utils/rate_limiter.py` | Atomic per-user UTC-day quota consumption |
| `services/ai-system/app/src/models/` | Request and moderation-result validation models |
| `services/ai-system/app/src/shemas/` | Stored article, chunk, and quota data schemas |
| `services/ai-system/requirements.txt`, `services/ai-system/infra/ai.Dockerfile` | Minimal direct dependencies and Python 3.11 container runtime |

### Devops
- **Major**: Monitoring system with Prometheus and Grafana
- **Major**: Backend as microservices.

~> Total 20 points

---

## 11. Privacy Policy & Terms of Service

Required by the subject and implemented as accessible pages in the frontend:
- Privacy Policy: `/privacy`
- Terms of Service: `/terms`

These are linked in the UI footer and referenced during registration/login UI.

---

## 12. Resources (and AI usage)

### Core resources
- NestJS docs
- React docs
- Docker / Docker Compose docs
- Nginx docs
- Prometheus / Grafana docs
- PostgreSQL docs
- MongoDB docs
- Qdrant docs

### How AI was used (required by subject)
We used AI tools to **reduce repetitive tasks** while keeping full ownership of the final code:
- summarizing configuration options (Docker/Nginx/Prometheus)
- generating checklists for security (JWT, cookies, password reset considerations)
- drafting documentation structure and refining wording for this README

We did **not** blindly copy-paste critical logic without review; all AI-assisted outputs were reviewed, tested, and adjusted by the team.

---

## 13. License

UNLICENSED (school project).
