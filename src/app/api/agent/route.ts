import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * Agent API - Main router for AI agent tools
 *
 * This API is designed to be called by n8n workflows and is structured
 * for future migration to MCP (Model Context Protocol).
 *
 * Tools are organized by domain:
 * - FASE: Big Rocks, TARs, Activities, Key Meetings
 * - OKR: Objectives, Key Results, Teams
 * - Common: Calendar, Planning, Profile
 */

// Re-export for reference - tools are in separate files
export async function GET() {
  return NextResponse.json({
    name: "FASE Agent API",
    version: "1.0.0",
    description: "AI Agent tools for FASE and OKR applications",
    domains: {
      fase: {
        description: "FASE methodology tools for Big Rocks and TARs",
        tools: [
          "list_big_rocks",
          "get_big_rock",
          "create_big_rock",
          "list_tars",
          "get_tar",
          "create_tar",
          "update_tar_progress",
        ],
      },
      okr: {
        description: "OKR tools for Objectives and Key Results",
        tools: [
          "list_teams",
          "list_objectives",
          "get_objective",
          "create_objective",
          "list_key_results",
          "update_key_result",
        ],
      },
      common: {
        description: "Common tools for calendar and planning",
        tools: [
          "get_planning_status",
          "get_calendar_data",
          "get_user_profile",
        ],
      },
    },
    mcp_ready: true,
    mcp_migration_notes: "Each domain can become a separate MCP server",
  });
}

// Validate agent API key (for n8n calls)
export async function validateAgentRequest(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  // Check for API key header (for n8n)
  const apiKey = request.headers.get("x-agent-api-key");
  const userIdHeader = request.headers.get("x-user-id");

  if (apiKey && apiKey === process.env.AGENT_API_KEY) {
    if (!userIdHeader) {
      return { valid: false, error: "Missing x-user-id header" };
    }
    return { valid: true, userId: userIdHeader };
  }

  // Fall back to session auth (for direct calls)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { valid: true, userId: session.user.id };
  }

  return { valid: false, error: "Unauthorized" };
}
