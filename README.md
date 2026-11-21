# RatzBot — Discord Bot + Game API for RATZ

Full Discord bot with **live stats**, **leaderboards**, and a **REST API** so your Unity game can push/pull player data.

## Features

### Stats & Leaderboard
- `/stats` — View detailed player stats
- `/leaderboard` — Rank by Points, Kills, Wins, K/D, Win Rate, Headshots, Playtime
- `/link` — Link Discord ↔ in-game account (code or ID)
- Admins: `/setstats`, `/addstats`

### Game Connection (API)
Your Unity game can:
1. Request a link code → player types `/link code XXXXXX` in Discord
2. Push match results (kills, wins, etc.) at the end of a round
3. Pull a player's stats or the global leaderboard

### Lots of Commands
- Rat-themed fun: `/ratfact` `/howrat` `/ratname` `/squeak` `/cheese` `/ratzquote`
- Fun: `/coinflip` `/8ball` `/rps` `/rate` `/choose` `/joke` `/roll` `/poll`
- Utility: `/avatar` `/banner` `/servericon` `/invite` `/membercount` `/uptime` ...
- Moderation: `/kick` `/ban` `/timeout` `/purge` `/warn` `/warnings` `/clearwarns` `/say`

---

## Setup

### 1. Discord Bot
1. Create application at https://discord.com/developers/applications
2. Add a Bot → copy token
3. Enable **Server Members Intent** + **Message Content Intent**
4. Invite bot with `bot` + `applications.commands` scopes

### 2. Install
```bash
npm install
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_server_id
API_PORT=3000
API_SECRET=make-this-a-long-random-string
```

### 3. Deploy commands & start
```bash
npm run deploy
npm start
```

You should see:
```
Ready! Logged in as YourBot#1234
API server running on port 3000
```

---

## Connecting Your Unity Game

See `unity-examples/RatzDiscordAPI.cs` for a ready-to-use script.

### Flow for players
1. In-game: player clicks "Link Discord"
2. Game calls `POST /link/request` with their `gameId` → gets a 6-char code
3. Player goes to Discord and types `/link code ABC123`
4. Done — stats now sync

### Pushing match results
At the end of a round, call:
```
POST /match
Header: x-api-key: YOUR_SECRET
Body:
{
  "players": [
    {
      "gameId": "playfab-or-custom-id",
      "kills": 8,
      "deaths": 3,
      "headshots": 2,
      "won": true,
      "killstreak": 5,
      "playtimeMinutes": 12
    }
  ]
}
```

### Reading stats in-game
```
GET /stats/game/{gameId}
Header: x-api-key: YOUR_SECRET
```

### Leaderboard
```
GET /leaderboard?type=kills&limit=10
Header: x-api-key: YOUR_SECRET
```

---

## API Endpoints (all require `x-api-key` header except /health)

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /stats/:discordId | Stats by Discord ID |
| GET | /stats/game/:gameId | Stats by in-game ID |
| POST | /stats/game/:gameId | Update stats (`{ "add": {...} }` or `{ "set": {...} }`) |
| GET | /leaderboard?type=points&limit=10 | Leaderboard |
| POST | /link/request | Request link code `{ "gameId": "..." }` |
| GET | /link/:gameId | Check if linked |
| POST | /match | Submit full match results |

---

## Hosting Notes
- For the game to reach the API, host the bot on a VPS / Railway / Render with a public URL (or use a tunnel like ngrok while testing).
- Change `API_SECRET` to something strong.
- The bot stores data in `data/*.json`. For production you can later swap to a real database.

Stay sharp. Stay Ratz. 🐀🔫
