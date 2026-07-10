# Vitrina Service

Showcase platform for LifeSync Games framework. NestJS rewrite of the `bGames-Mail-Service-And-API` prototype.

## Architecture

This service is one component of the LifeSync Games platform, operating as a Self-Contained System (SCS) behind an Nginx reverse proxy. Authentication and authorization are handled by **Auth Service** via a shared JWT secret. Vitrina never issues tokens and never calls an auth provider directly.

### Service-to-service communication

| Direction               | Protocol                | When                                         |
| ----------------------- | ----------------------- | --------------------------------------------- |
| Client to Vitrina       | JWT (local validation)  | Every authenticated request                    |
| Vitrina to Auth Service | HTTP + API Key          | `grant-developer` on first publication         |
| Vitrina to Auth Service | HTTP + API Key          | Get OAuth token for GitLab/GitHub API calls    |

### Data model

Vitrina owns these MongoDB collections:

- `contributor_profiles`: public contributor profiles (linked to Auth Service via `authServiceUserId`)
- `publications`: games/sensors catalog
- `publication_details`: releases, statuses, downloads
- `reviews`: comments and ratings

## Setup

### Prerequisites

- Node.js v20+
- MongoDB
- Auth Service running on port 3000

### Install

```bash
npm install
```

### Environment

```bash
cp .env.example .env
```

### Run

```bash
# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

### API Docs

Swagger UI:
- Direct (local dev, no Nginx): `http://localhost:3020/v1/docs`
- Behind Nginx: `http://localhost/vitrina/api/v1/docs`
