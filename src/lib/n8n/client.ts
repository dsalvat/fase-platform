// n8n API Client
// Integration to be implemented in a future phase

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export class N8NClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    if (!N8N_API_URL || !N8N_API_KEY) {
      throw new Error("N8N_API_URL and N8N_API_KEY must be defined in environment variables");
    }
    this.baseUrl = N8N_API_URL;
    this.apiKey = N8N_API_KEY;
  }

  // TODO: Implement n8n API methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async executeWorkflow(_workflowId: string, _data: Record<string, unknown>) {
    // Implementation coming in future phase
    throw new Error("Not implemented yet");
  }

  async getWorkflows() {
    // Implementation coming in future phase
    throw new Error("Not implemented yet");
  }
}

export const n8nClient = new N8NClient();
