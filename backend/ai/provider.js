import { logger } from "../utils/logger.js";

const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * OpenAI-compatible tool format used by OpenRouter.
 */
const formatTools = (tools = []) => {
  if (!tools.length) return undefined;

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || { type: "object", properties: {} },
    },
  }));
};

/**
 * Deterministic Mock AI Provider for tests and offline development.
 * This remains intentionally provider-free; production requests use OpenRouter.
 */
class MockAIProvider {
  constructor(name = "mock") {
    this.name = name;
  }

  async generateResponse({ prompt, systemPrompt }) {
    logger.info("MockAIProvider generateResponse invoked");
    return {
      text: this.getIdentityResponse(prompt, systemPrompt) || `Nuvora Assistant: I received your request: "${prompt}". No live AI provider is configured, so I am operating in development/test mode.`,
      finishReason: "STOP",
      toolCalls: [],
      provider: this.name,
    };
  }

  /**
   * Extract the authenticated user's name from the trusted system prompt.
   * The orchestrator builds this prompt from the authenticated request context;
   * the client cannot supply or override it.
   */
  getAuthenticatedName(systemPrompt = "") {
    const match = systemPrompt.match(/^[-*]?\s*Name:\s*(.+?)\s*$/im);
    const name = match?.[1]?.trim();
    return name && name !== "User" ? name : null;
  }

  getIdentityResponse(prompt = "", systemPrompt = "") {
    const normalizedPrompt = prompt.trim().toLowerCase().replace(/[?!.,]+$/g, "");
    const identityQuestion = /^(what(?:'s| is) my name|what is my full name|who am i|do you know my name|tell me my name|remember my name)$/.test(normalizedPrompt);

    if (!identityQuestion) return null;

    const name = this.getAuthenticatedName(systemPrompt);
    if (!name) {
      return "I don't have your name available in this session.";
    }

    return `Your name is ${name}.`;
  }

  async generateWithTools({ prompt, systemPrompt, tools = [], toolResults = [] }) {
    logger.info("MockAIProvider generateWithTools invoked", {
      prompt,
      toolResultsCount: toolResults.length,
    });

    if (toolResults.length > 0) {
      const toolOutput = toolResults[0].output || {};
      const toolName = toolResults[0].name;

      if (toolName === "getSchoolOverview" || toolName === "school.overview") {
        return {
          text: `Here is the current overview for your school: There are ${toolOutput.students ?? toolOutput.totalStudents ?? 0} students, ${toolOutput.teachers ?? toolOutput.totalTeachers ?? 0} teachers, ${toolOutput.staff ?? 0} staff members, and ${toolOutput.classes ?? toolOutput.totalClasses ?? 0} classes. The overall attendance rate is ${toolOutput.attendanceRate ?? toolOutput.attendancePercentage ?? 100}%. Current academic session: ${toolOutput.academicSession || "Active"}.`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      if (toolName === "getAttendanceSummary" || toolName === "attendance.summary") {
        return {
          text: `Attendance Summary: Out of ${toolOutput.total ?? 0} recorded session(s), ${toolOutput.present ?? 0} present and ${toolOutput.absent ?? 0} absent (${toolOutput.percentage ?? 0}% attendance rate).`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      if (toolName === "getStudentAttendance" || toolName === "student.attendance") {
        const studentLabel = toolOutput.studentName
          ? `${toolOutput.studentName} (${toolOutput.studentId})`
          : `Student ${toolOutput.studentId || ""}`;
        return {
          text: `Attendance for ${studentLabel}: Total records: ${toolOutput.total ?? 0}, Present: ${toolOutput.present ?? 0}, Absent: ${toolOutput.absent ?? 0}, Attendance rate: ${toolOutput.percentage ?? 0}%.`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      if (toolName === "getStudentResults" || toolName === "student.results") {
        const avg = toolOutput.averageScore ?? toolOutput.average ?? 0;
        const totalSubs = toolOutput.results?.length ?? toolOutput.subjects?.length ?? 0;
        return {
          text: `Academic Results: The overall average score is ${avg}%. A total of ${totalSubs} subject result(s) are recorded.`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      if (toolName === "getFeeSummary" || toolName === "fees.outstanding" || toolName === "finance.summary") {
        const billed = toolOutput.totalBilled ?? toolOutput.billed ?? 0;
        const paid = toolOutput.totalPaid ?? toolOutput.paid ?? 0;
        const outstanding = toolOutput.outstandingBalance ?? toolOutput.outstandingFees ?? toolOutput.outstanding ?? 0;
        return {
          text: `Fee Summary: Total Billed: ₦${Number(billed).toLocaleString()}, Total Paid: ₦${Number(paid).toLocaleString()}, Current Outstanding Balance: ₦${Number(outstanding).toLocaleString()}.`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      return {
        text: `Here is the information from your school records: ${JSON.stringify(toolOutput)}`,
        finishReason: "STOP",
        toolCalls: [],
        provider: this.name,
      };
    }

    const identityResponse = this.getIdentityResponse(prompt, systemPrompt);
    if (identityResponse) {
      return {
        text: identityResponse,
        finishReason: "STOP",
        toolCalls: [],
        provider: this.name,
      };
    }

    if (!tools.length) {
      return {
        text: "I am Nuvora, your secure school AI assistant.",
        finishReason: "STOP",
        toolCalls: [],
        provider: this.name,
      };
    }

    return {
      text: "I am Nuvora, your secure school AI assistant. Live AI is disabled in the current test mode.",
      finishReason: "STOP",
      toolCalls: [],
      provider: this.name,
    };
  }
}

/**
 * OpenRouter provider.
 * OpenRouter exposes an OpenAI-compatible Chat Completions interface, so the
 * existing Nuvora orchestrator and tool-permission system can remain unchanged.
 */
class OpenRouterProvider {
  constructor(apiKey, model = DEFAULT_OPENROUTER_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = "openrouter";
  }

  async generateWithTools({ prompt, systemPrompt, tools = [], conversationHistory = [], toolResults = [] }) {
    const messages = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of conversationHistory) {
      const role = msg.role === "model" ? "assistant" : msg.role;
      if (["system", "user", "assistant"].includes(role)) {
        messages.push({ role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: prompt });

    if (toolResults.length > 0) {
      for (const result of toolResults) {
        const callId = `call_${result.name}`;

        messages.push({
          role: "assistant",
          tool_calls: [
            {
              id: callId,
              type: "function",
              function: {
                name: result.name,
                arguments: JSON.stringify(result.args || {}),
              },
            },
          ],
        });

        messages.push({
          role: "tool",
          tool_call_id: callId,
          content: JSON.stringify(result.output ?? {}),
        });
      }
    }

    const payload = {
      model: this.model,
      messages,
      temperature: 0.1,
      max_tokens: 1024,
    };

    const openRouterTools = formatTools(tools);
    if (openRouterTools) {
      payload.tools = openRouterTools;
      payload.tool_choice = "auto";
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    // Optional OpenRouter metadata; neither value is required for the request.
    if (process.env.OPENROUTER_HTTP_REFERER) {
      headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
    }
    if (process.env.OPENROUTER_APP_NAME) {
      headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error("OpenRouter API error", {
        status: response.status,
        model: this.model,
        error: errorText,
      });
      throw Object.assign(new Error(`AI provider error (${response.status})`), { statusCode: 502 });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    const toolCalls = (choice?.tool_calls || []).map((toolCall) => {
      let args = {};
      const rawArguments = toolCall.function?.arguments;

      if (typeof rawArguments === "string" && rawArguments.trim()) {
        try {
          args = JSON.parse(rawArguments);
        } catch (error) {
          logger.error("OpenRouter returned invalid tool arguments", {
            toolName: toolCall.function?.name,
            error: error.message,
          });
          throw Object.assign(new Error("AI returned invalid tool arguments"), { statusCode: 502 });
        }
      } else if (rawArguments && typeof rawArguments === "object") {
        args = rawArguments;
      }

      return {
        name: toolCall.function?.name,
        args,
      };
    });

    return {
      text: choice?.content || "",
      toolCalls,
      finishReason: toolCalls.length > 0 ? "TOOL_CALL" : "STOP",
      provider: this.name,
      model: this.model,
    };
  }

  async generateResponse({ prompt, systemPrompt, conversationHistory = [] }) {
    return this.generateWithTools({
      prompt,
      systemPrompt,
      tools: [],
      conversationHistory,
    });
  }
}

/**
 * Factory for the single production Nuvora provider.
 */
export const getAIProvider = () => {
  if (process.env.NODE_ENV === "test" && !process.env.FORCE_LIVE_AI) {
    return new MockAIProvider("mock-test");
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    return new MockAIProvider("mock-fallback");
  }

  return new OpenRouterProvider(openRouterKey);
};

export { MockAIProvider, OpenRouterProvider };
