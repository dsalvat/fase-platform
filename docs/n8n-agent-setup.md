# FASE AI Agent - n8n Setup Guide

This guide explains how to set up the AI chat assistant for FASE using n8n workflows.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FASE Application                            │
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│   │   Chat UI   │───▶│  API Route  │───▶│  n8n Webhook        │   │
│   │             │◀───│  /api/chat  │◀───│  (Agent Workflow)   │   │
│   └─────────────┘    └─────────────┘    └─────────────────────┘   │
│                                                  │                  │
│                                                  ▼                  │
│                                         ┌───────────────┐          │
│                                         │   AI Agent    │          │
│                                         │   (GPT-4o)    │          │
│                                         └───────┬───────┘          │
│                                                 │                   │
│   ┌─────────────────────────────────────────────┼─────────────────┐│
│   │                     Agent Tools             │                 ││
│   │  ┌─────────────┐  ┌─────────────┐  ┌───────┴───────┐        ││
│   │  │ FASE Tools  │  │  OKR Tools  │  │ Common Tools  │        ││
│   │  │             │  │             │  │               │        ││
│   │  │ • Big Rocks │  │ • Teams     │  │ • Profile     │        ││
│   │  │ • TARs      │  │ • Objectives│  │ • Planning    │        ││
│   │  │             │  │ • Key Results│ │               │        ││
│   │  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘        ││
│   │         │                │                 │                 ││
│   │         └────────────────┼─────────────────┘                 ││
│   │                          ▼                                    ││
│   │                 /api/agent/* endpoints                       ││
│   └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## MCP Migration Path

The API structure is designed for easy migration to MCP (Model Context Protocol):

| Current (HTTP Tools) | Future (MCP Server) |
|---------------------|---------------------|
| `/api/agent/fase/*` | `fase://` MCP server |
| `/api/agent/okr/*` | `okr://` MCP server |
| `/api/agent/common/*` | `common://` MCP server |

When ready to scale, each domain can become an independent MCP server with:
- **Resources**: Read-only data access (lists, details)
- **Tools**: Actions that modify data (create, update)
- **Prompts**: Pre-defined prompt templates

## Setup Steps

### 1. Environment Variables

Add to your `.env`:

```env
# Agent API Key (for n8n to authenticate)
AGENT_API_KEY="generate-a-secure-key-here"

# FASE API URL (for n8n callbacks)
FASE_API_URL="https://your-app.vercel.app"
```

### 2. n8n Configuration

#### Required Credentials

Create an **HTTP Header Auth** credential in n8n:

- **Name**: `FASE Agent Auth`
- **Header Name**: `x-agent-api-key`
- **Header Value**: `{{ $env.AGENT_API_KEY }}`

#### Environment Variables in n8n

Set these in your n8n environment:

```
FASE_API_URL=https://your-app.vercel.app
AGENT_API_KEY=your-secure-key
```

### 3. Import Workflow

1. Open n8n
2. Go to Workflows → Import from file
3. Select `docs/n8n-workflow-agent.json`
4. Configure the OpenAI credentials
5. Update the HTTP Header Auth credential
6. Activate the workflow

### 4. AI Agent System Prompt

Configure the AI Agent node with this system prompt:

```
You are FASE Assistant, an AI helper for the FASE strategic planning platform.

## Your Role
You help users manage their objectives using two methodologies:
1. **FASE (Big Rocks)**: Monthly objectives broken into TARs (High-Performance Tasks)
2. **OKR**: Quarterly Objectives and Key Results with team collaboration

## First Steps
Always start by calling `get_user_profile` to understand:
- Which apps the user has access to (FASE, OKR, or both)
- Their teams and roles
- Current planning status

## FASE Methodology
- **Big Rocks**: Monthly objectives (max 3-5 per month)
- **TARs**: High-performance tasks within each Big Rock
- **Key People**: Important contacts for achieving objectives
- **Key Meetings**: Critical meetings to schedule

## OKR Methodology
- **Objectives**: Qualitative goals for the quarter
- **Key Results**: Measurable outcomes (with targets)
- **Teams**: Collaborative groups with roles (RESPONSABLE, EDITOR, VISUALIZADOR)

## Guidelines
1. Only suggest creating objectives after understanding the user's needs
2. Ask for confirmation before creating any Big Rock or Objective
3. Use Spanish as the primary language
4. Be encouraging but realistic about goal-setting
5. Help users break down large objectives into manageable tasks

## Creating Objectives
When the user wants to create an objective:
1. Clarify the goal and success criteria
2. Suggest an indicator/metric
3. Propose key people and meetings if relevant
4. Ask for confirmation before calling the create tool

## Language
Respond in the same language the user uses (Spanish by default).
```

## Available Tools

### FASE Tools
| Tool | Description |
|------|-------------|
| `list_big_rocks` | List user's monthly objectives |
| `create_big_rock` | Create a new Big Rock |
| `list_tars` | List tasks for objectives |
| `create_tar` | Create a new task |
| `update_tar_progress` | Update task progress |

### OKR Tools
| Tool | Description |
|------|-------------|
| `list_okr_teams` | List user's teams |
| `list_okr_objectives` | List objectives |
| `create_okr_objective` | Create objective with KRs |
| `update_key_result` | Update KR progress |

### Common Tools
| Tool | Description |
|------|-------------|
| `get_user_profile` | Get user context and apps |
| `get_planning_status` | Get monthly planning status |

## Testing the Agent

Send a POST request to the webhook:

```bash
curl -X POST https://your-n8n.com/webhook/fase-agent-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-webhook-auth" \
  -d '{
    "userId": "user-id-here",
    "message": "¿Cuáles son mis Big Rocks de este mes?",
    "conversationId": "conv-123"
  }'
```

## Webhook Request Format

```json
{
  "userId": "string",
  "message": "string",
  "conversationId": "string (optional)",
  "context": {
    "currentMonth": "YYYY-MM (optional)",
    "currentApp": "FASE | OKR (optional)"
  }
}
```

## Response Format

```json
{
  "response": "AI agent response text",
  "conversationId": "string"
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check AGENT_API_KEY matches in both apps
2. **404 Not Found**: Verify FASE_API_URL is correct
3. **Empty user profile**: Ensure userId header is being passed

### Debugging

Enable verbose logging in n8n to see:
- Tool calls being made
- API responses
- Memory state

## Security Considerations

1. **API Key**: Keep AGENT_API_KEY secret, rotate regularly
2. **User Context**: Always pass userId from authenticated session
3. **Rate Limiting**: Consider adding rate limits to webhook
4. **Validation**: API routes validate user ownership of resources
