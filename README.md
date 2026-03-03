# GitHub PR Agent

A GitHub PR review bot powered by Claude. Add the `sre-agent` label to any PR and it will:

1. Post inline review comments on security, reliability, performance, and best-practice issues
2. Approve the PR if no significant concerns are found
3. Send Telegram notifications when reviews start and finish
4. Reply to any comment that mentions `sre-agent`

## Stack

- **Runtime:** Node.js 20 + Express
- **AI:** Claude API (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk`
- **GitHub:** `@octokit/rest` for PR diffs, reviews, and comments
- **Notifications:** Telegram Bot API (native `fetch`, no extra library)

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

### 2. Create a Telegram Bot

You need a Telegram bot to receive review notifications.

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a **name** for your bot (e.g. `SRE Review Bot`)
4. Choose a **username** (must end in `bot`, e.g. `sre_review_bot`)
5. BotFather will reply with your **bot token** — copy it to `TELEGRAM_BOT_TOKEN` in `.env`

**Getting your chat ID** (where the bot will send messages):

- **Private chat:** Send any message to your bot, then open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser. Look for `"chat":{"id": 123456789}` — that number is your chat ID.
- **Group:** Add the bot to the group, send a message in the group, then check `getUpdates` the same way. Group chat IDs are negative numbers (e.g. `-1001234567890`).
- **Channel:** Add the bot as an admin to the channel. The chat ID is the channel's `@username` (e.g. `@my_sre_channel`) or its numeric ID from `getUpdates`.

Copy the chat ID to `TELEGRAM_CHAT_ID` in `.env`.

### 3. Create a GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set a name (e.g. `github-pr-agent`) and expiration
4. Under **Repository access**, select the repos you want the bot to review
5. Under **Permissions**, grant:
   - **Pull requests:** Read and Write
   - **Issues:** Read and Write (needed for posting comments)
   - **Contents:** Read (needed for fetching diffs)
6. Click **Generate token** and copy it to `GITHUB_TOKEN` in `.env`

Alternatively, use a classic PAT with the `repo` scope.

### 4. Set Up the GitHub Webhook

1. Go to your repository (or organization) on GitHub
2. Navigate to **Settings → Webhooks → Add webhook**
3. Fill in the fields:
   - **Payload URL:** `https://<your-domain>/webhook`
     - For local testing: use the `*.trycloudflare.com` URL from cloudflared (see below)
     - For production: use your ALB/domain URL
   - **Content type:** `application/json`
   - **Secret:** generate a random string (e.g. `openssl rand -hex 32`) and paste it here — also set it as `GITHUB_WEBHOOK_SECRET` in `.env`
4. Under **Which events would you like to trigger this webhook?**, select **Let me select individual events** and check:
   - **Pull requests**
   - **Issue comments**
   - **Pull request review comments**
5. Make sure **Active** is checked and click **Add webhook**

GitHub will send a ping event — you should see a green checkmark once your server is running and reachable.

## Run Locally

```bash
npm install
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### Expose with Cloudflare Tunnel (for testing)

```bash
cloudflared tunnel --url http://localhost:3000
```

Use the generated `*.trycloudflare.com` URL as your GitHub webhook payload URL.

## Docker

### Build

```bash
docker build -t github-pr-agent .
```

### Run

```bash
docker run -p 3000:3000 --env-file .env github-pr-agent
```


## How It Works

### Flow 1: PR Review (label trigger)

1. Developer adds `sre-agent` label to a PR
2. GitHub sends `pull_request.labeled` webhook
3. Bot sends "review started" Telegram notification
4. Bot fetches PR diff and file list from GitHub
5. Claude reviews the diff for SRE concerns
6. Bot posts inline review comments on the PR
7. If no issues → approves the PR; otherwise → leaves comments only
8. Bot sends "review complete" Telegram notification

### Flow 2: Comment Reply (mention trigger)

1. Developer comments mentioning `sre-agent` on a PR
2. GitHub sends `issue_comment.created` or `pull_request_review_comment.created` webhook
3. Bot fetches PR context and diff
4. Claude generates a contextual reply
5. Bot posts the reply as a comment on the PR
