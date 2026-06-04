
# FlowForge

**Production-ready no-code AI workflow builder** — a better alternative to n8n.

FlowForge is a fully open-source, self-hosted workflow automation platform with built-in AI capabilities, real-time collaboration, and a modern architecture designed for scale.

## Why FlowForge over n8n?

| Feature | n8n | FlowForge |
|---------|-----|-----------|
| AI/LLM Integration | Basic nodes | Built-in AI gateway (OpenAI, Anthropic, Ollama) + AI Agent nodes |
| Real-time Collaboration | None | WebSocket-based live editing |
| Execution Engine | Single-process | Distributed workers with BullMQ |
| Visual Debugging | Basic | Step-by-step execution visualization |
| Version Control | None | Git-like workflow versioning |
| Plugin System | Limited | Full connector SDK + marketplace |
| Performance | Node.js only | Optimized with connection pooling, caching |
| Deployment | Docker | Docker + Kubernetes + Edge |
| API | REST | REST + WebSocket + GraphQL-ready |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FlowForge                            │
├──────────┬──────────┬──────────┬────────────────────────┤
│   Web    │   API    │  Worker  │    AI Engine           │
│  (React) │ (Fastify)│ (BullMQ) │  (Multi-provider LLM)  │
├──────────┴──────────┴──────────┴────────────────────────┤
│  Core Engine  │  Connectors  │  Types                   │
│  (Executor)   │  (100+)      │  (Shared)               │
├───────────────┴──────────────┴──────────────────────────┤
│  PostgreSQL  │  Redis  │  MinIO (files)                │
└──────────────┴─────────┴────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Redis 7+

### Development

```bash
# Clone
git clone https://github.com/your-org/flowforge.git
cd flowforge

# Install dependencies
pnpm install

# Setup database
cp .env.example .env
# Edit .env with your database credentials
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev
```

### Docker

```bash
docker compose up -d
# Web: http://localhost:3000
# API: http://localhost:3001
```

### Kubernetes

```bash
kubectl apply -f infrastructure/k8s/
```

## Project Structure

```
flowforge/
├── apps/
│   ├── api/          # Fastify REST API + WebSocket server
│   ├── web/          # React frontend with visual workflow editor
│   └── worker/       # BullMQ background job worker
├── packages/
│   ├── core/         # Workflow engine, registry, expressions, validation
│   ├── types/        # Shared TypeScript types
│   ├── ai-engine/    # LLM gateway, AI agents, prompt builder
│   ├── connectors/   # 100+ app connectors (Slack, GitHub, etc.)
│   └── ui-components/# Shared UI components
├── infrastructure/
│   ├── docker/       # Dockerfiles for API, Web, Worker
│   └── k8s/          # Kubernetes manifests
└── .github/
    └── workflows/    # CI/CD pipeline
```

## Core Features

### Workflow Engine
- **Topological execution** with parallel node support
- **Expression engine** with `{{ $json.field }}` syntax
- **Retry logic** with exponential backoff
- **Timeout handling** per node and per workflow
- **Event system** for real-time monitoring

### Built-in Nodes (20+)
- **Triggers**: Webhook, Schedule (cron), Manual
- **Actions**: HTTP Request, Set, Code (JS), Email
- **Logic**: IF, Switch
- **AI**: OpenAI (GPT-4o), Anthropic (Claude)
- **Communication**: Slack, Discord

### Connectors (8+ included)
- HTTP, Slack, Discord, GitHub, Google Sheets, Notion, Airtable, Stripe
- Easy to extend with the Connector SDK

### AI Engine
- **Multi-provider LLM gateway**: OpenAI, Anthropic, Ollama (local)
- **AI Agent nodes** with tool calling
- **Prompt builder** for structured prompts
- **Conversation memory** for multi-turn interactions

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| GET | /auth/me | Get current user |
| GET | /api/workflows | List workflows |
| POST | /api/workflows | Create workflow |
| PUT | /api/workflows/:id | Update workflow |
| DELETE | /api/workflows/:id | Delete workflow |
| POST | /api/workflows/:id/execute | Execute workflow |
| GET | /api/executions | List executions |
| GET | /api/executions/:id | Get execution details |
| POST | /api/executions/:id/cancel | Cancel execution |
| GET | /api/nodes | List available node types |
| GET | /api/projects | List projects |
| WS | /ws/executions/:id | Real-time execution updates |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| JWT_SECRET | dev-secret | JWT signing secret |
| PORT | 3001 | API server port |
| OPENAI_API_KEY | - | OpenAI API key |
| ANTHROPIC_API_KEY | - | Anthropic API key |

## License

MIT
nothing
