# Community Comments for Emby

![Community Comments](Resources/Community%20Comments.png)

A community comments, ratings, and moderation plugin for [Emby](https://emby.media) media servers. Users can post comments and star ratings on movies and TV shows, with AI-powered moderation, real-time notifications, and a full admin dashboard.

---

## Features

- **Comments & ratings** — Post comments with 1–10 star ratings on any media item. Comments are paginated (20 per page) and sortable by newest, oldest, best, worst, popular, and most-replied.
- **Reply threading** — Threaded replies for all comments.
- **Reactions** — Like and dislike individual comments.
- **AI moderation** — Every comment and display name is reviewed by Cloudflare AI (Llama 3.1 8B) before being published.
- **Multi-language** — UI and comment content supports 16+ languages (English, Spanish, French, German, Portuguese, Italian, Dutch, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Polish, Swedish).
- **Translation** — Translate any comment to another language on demand (Cloudflare m2m100 model).
- **Real-time updates** — WebSocket connections push ban notifications and moderation decisions instantly to connected clients.

---

## Architecture

The system has three layers that communicate in sequence:

```
Browser → Emby Plugin (C# REST API) → Cloudflare Worker → D1 (SQLite)
```

### 1. Emby Plugin (C#, .NET 6.0)

The server-side plugin (`Plugin.cs`) registers REST endpoints under `/communitycomments/*` and serves the embedded frontend resources. It handles:

- **Server provisioning** — On the first admin login, it auto-creates an Emby API key, fetches the server's WAN address and Server ID, and stores them in plugin configuration.
- **User initialization** — Issues a 24-hour token from the Cloudflare Worker for each user.
- **Proxying** — Forwards moderation checks, activity feed requests, and ban appeals to the worker.

Configuration is XML-serialized by Emby and stored in `PluginConfiguration.cs`. Key fields include the worker API endpoint, the Emby API key, the server's WAN address, and per-user display names and avatars.

### 2. Frontend (Vanilla JS)

Two embedded resources power the UI:

| File | Purpose |
|------|---------|
| `Web/plugin.js` | Main comment widget rendered in Emby's media detail pages |
| `Configuration/configPage.js` + `configPage.html` | Admin settings page |

`plugin.js` handles comment display, posting, reactions, reporting, moderation-status badges, the guidelines acceptance flow, ban handling, and WebSocket connections for real-time updates.

`configPage.js` handles user display-name management, name-moderation polling, the moderation activity feed (auto-refreshed every 60 seconds), and server ban appeal submission.

### 3. Cloudflare Worker (JS)

`emby-comments-worker/src/index.js` is the backend. It:

- Verifies every request's origin by calling back to the Emby server's `/emby/System/Info` endpoint.
- Stores all data in **Cloudflare D1** (SQLite).
- Moderates comments and display names using **Cloudflare AI** (Llama 3.1 8B).
- Streams real-time events via **Durable Objects** (`BanNotifier`, `ModerationNotifier`, `FeedNotifier`).
- Archives audit logs to **Cloudflare R2**.
- Runs an **hourly cron** to clean up expired tokens and handle scheduled tasks.

The worker is a separate nested git repository inside `emby-comments-worker/` and is deployed independently.

---

## Database Schema

| Table | Key Columns |
|-------|-------------|
| `Servers` | ServerGuid, WanAddress, ApiKey, Verified, BannedAt, BanReason, AppealStatus |
| `Users` | UserUuid, UserKey, DisplayName, AvatarBlob, ModerationStatus, HiddenComments |
| `Tokens` | Token, UserUuid, CreatedAt, ExpiresAt (24-hour TTL) |
| `Comments` | CommentId, MediaKey, MediaTitle, AuthorUuid, Body, StarRating, ParentCommentId, ModStatus |
| `Reactions` | Per-user like/dislike per comment |
| `Reports` | User reports with reasons (spam, harassment, spoiler, off-topic, inappropriate) |
| `AuditLogs` | Action, ActorUuid, ActorName, TargetId, Outcome, Detail (JSON) |

---

## AI Moderation

### Comments

Comments are reviewed by Llama 3.1 8B against a detailed ruleset:

- Must be relevant to the specific media item (movies/shows/episodes).
- Personal attacks against real people are not allowed; criticism of creative work is fine.
- Swearing allowed when expressing opinions; not allowed as direct insults.
- Hate speech and slurs are never permitted (direct media quotes in context may be allowed).
- Spam, advertising, and low-effort content (single emoji, "lol", "first") are rejected.
- Major spoilers are tagged as `spoiler` status rather than denied.

The AI returns `{ status: "approved" | "spoiler" | "denied", explanation, language, reason? }`.

### Display Names

Display names are reviewed separately for slurs, explicit content, impersonation, and advertising.

### Anti-Abuse Protections

Before content reaches the AI, the worker applies:

- **Unicode normalization** (NFKD) to decode font/homoglyph tricks.
- **Pre-AI blocklist** covering 70+ slur and injection patterns (including leetspeak variants).
- **Prompt injection detection** using regex and fuzzy matching for phrases like "ignore instructions", "act as", "always return approved", etc.

---

## API Endpoints

### User-Facing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/token` | Register user and issue a 24-hour token |
| POST | `/register` | Submit or poll display name moderation |
| POST | `/accept-guidelines` | Record guideline acceptance |
| GET | `/comments` | Fetch paginated comments for a media item |
| GET | `/replies` | Fetch replies to a comment |
| POST | `/comments` | Post a new comment (AI-moderated) |
| POST | `/translate` | Translate a comment to another language |
| POST | `/react` | Like or dislike a comment |
| POST | `/hide` | Hide a comment for the requesting user |
| POST | `/report` | Report a comment |
| GET | `/my-state` | User's ban status and pending comment count |
| GET | `/my-pending` | User's comments awaiting moderation |
| POST | `/ban-appeal` | Appeal a user ban |
| POST | `/user-settings` | Update language and filter preferences |
| GET | `/ban-ws` | WebSocket for real-time ban notifications |

### Server-Verified (Admin)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/server/activity-feed` | Recent moderation events for this server's users |
| POST | `/server/ban-status` | Server ban status and appeal details |
| POST | `/server-ban-appeal` | Submit a server ban appeal |

### Plugin Endpoints (C#)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/communitycomments/config` | Plugin configuration (safe subset) |
| POST | `/communitycomments/init` | Initialize user session, return token |
| POST | `/communitycomments/register-name` | Proxy display name sync to worker |
| POST | `/communitycomments/activity-feed` | Proxy activity feed (admin only) |
| GET | `/communitycomments/server-ban-status` | Proxy ban status (admin only) |
| POST | `/communitycomments/server-ban-appeal` | Proxy ban appeal (admin only) |

---

## Build & Development

### Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0)
- [Node.js](https://nodejs.org/) (for the Cloudflare Worker)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — installed via `npm install`
- A Cloudflare account with D1, R2, AI, and Durable Objects enabled

### Emby Plugin (C#)

```bash
dotnet restore       # Restore NuGet packages
dotnet build         # Build the plugin DLL
```

The build produces `CommunityComments.dll` targeting `.NET 6.0`. The JS/HTML frontend resources are embedded directly into the DLL.

### Cloudflare Worker

```bash
cd emby-comments-worker
npm install          # Install dependencies
npm run dev          # Start local dev server (wrangler)
npm run test         # Run vitest test suite
npm run deploy       # Deploy to Cloudflare
```

Worker configuration is in `emby-comments-worker/wrangler.jsonc`.

---

## Installation

1. Build the plugin (`dotnet build`) and copy the DLL into your Emby plugin directory.
2. Restart the Emby server. The plugin registers automatically.
3. Open Emby's admin dashboard → Plugins → Community Comments.
4. The plugin provisions itself on the first admin login: it creates an API key, fetches your server's WAN address, and registers with the Cloudflare Worker.
5. Optionally, set display names for your server's users in the settings page.

> **Note:** The Cloudflare Worker must be deployed and reachable at the URL configured in `ApiEndpoint` (default: `https://emby-comments-worker.embycomments.workers.dev`). The worker verifies your Emby server by calling back to your configured WAN address, so the server must be publicly reachable.

---

## Configuration

All plugin settings are stored by Emby in its standard plugin configuration XML.

| Field | Description |
|-------|-------------|
| `ApiEndpoint` | URL of the Cloudflare Worker |
| `EmbyApiKey` | Auto-generated API key used by the worker to verify your server |
| `WanAddress` | Your server's public address (fetched automatically) |
| `ServerId` | Your server's unique GUID |
| `ServerLocalCommentsOnly` | If enabled, only shows comments posted from this server |
| `UserDisplayNames` | Per-user display names and avatar URLs |

---

## Repository Structure

```
EmbyComments/
├── Api/
│   ├── ApiModels.cs          # Request/response DTOs
│   ├── CommentsApiClient.cs  # HTTP client for the Cloudflare Worker
│   └── CommentsService.cs    # REST API route handlers
├── Configuration/
│   ├── configPage.html       # Admin settings form
│   └── configPage.js         # Admin settings logic
├── Model/
│   ├── Comment.cs
│   └── User.cs
├── Resources/
│   └── Community Comments.png
├── Web/
│   └── plugin.js             # Main comment widget
├── Plugin.cs                 # Plugin entry point
├── PluginConfiguration.cs    # Config schema and helpers
├── EmbyComments.csproj
└── emby-comments-worker/     # Cloudflare Worker (separate git repo)
    ├── src/index.js          # Worker handler (~5200 lines)
    ├── migrations/           # D1 schema migrations
    ├── test/                 # Vitest tests
    └── wrangler.jsonc        # Worker configuration
```

The `emby-comments-worker/` directory is a separate nested git repository and is ignored by the main repo's `.gitignore`. It has its own commit history and is deployed independently via Wrangler.

---

## Limits

| Constraint | Value |
|------------|-------|
| Comment length | 1,200 characters |
| Display name length | 50 characters |
| Comments per page | 20 |
| Token TTL | 24 hours |
| Name moderation poll timeout | 50 seconds (10 × 5s) |
| Auto-ban threshold | 5 denied comments/hour; permanent at 100 |

---

## License

This project is not currently open-licensed. All rights reserved.
