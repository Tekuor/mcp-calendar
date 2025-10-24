# MCP Calendar Server

A local [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that connects **Claude Desktop** to your **Google Calendar**.

This lets Claude manage calendar events, check schedules, and even calculate travel time between meetings — all locally and securely.

---

## Features

- **Manage Events** — Add, update, delete, or view Google Calendar events
- **Get Event Details** — Fetch details for specific events
- **Get Coordinates** — Retrieve coordinates for a given place using [OpenRouteService](https://openrouteservice.org/)
- **Travel Estimates** — Calculate distance and time between two points
- **Runs Locally** — No data leaves your computer

---

## How It Works

Claude Desktop supports MCP (Model Context Protocol) to interact with local or remote tools.  
This project implements an MCP server in **Node.js** that communicates with Claude over `stdio`.

---

## Tools Implemented

| Tool                    | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `get_events`            | List Google Calendar events within a date range      |
| `get_event`             | Fetch details of a specific event                    |
| `add_event`             | Add a new event                                      |
| `update_event`          | Update an existing event                             |
| `delete_event`          | Delete an event                                      |
| `get_coordinates`       | Get coordinates of a place                           |
| `get_distance_and_time` | Get distance and travel time between two coordinates |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/username/mcp-calendar.git
cd mcp-calendar
```

### 2. Install dependencies

`npm install`

### 3. Create a .env file

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
OPENROUTESERVICE_API_KEY=your_openrouteservice_api_key
```

### 4. Run the MCP server

```bash
npm run build
npm start
```

### 5. Connecting to Claude Desktop

Open Claude Desktop
Go to Settings → Developer → Local MCP servers
Add a new local server configuration like:

```
{
  "command": "node",
  "args": ["C:\\path\\to\\build\\index.js"],
  "env": {}
}
```

Restart Claude, it should automatically detect and connect to your MCP server.

### Tech Stack

Node.js + TypeScript
Google Calendar API
OpenRouteService API
Claude MCP SDK
