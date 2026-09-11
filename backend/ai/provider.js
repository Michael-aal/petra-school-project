import { logger } from "../utils/logger.js";

const DEFAULT_GEMINI_MODEL = process.env.AI_MODEL || "gemini-2.0-flash";
const DEFAULT_OPENAI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

/**
 * Format tools for Google Gemini format
 */
const formatGeminiTools = (tools = []) => {
  if (!tools.length) return undefined;
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "OBJECT",
          properties: tool.parameters?.properties || {},
          required: tool.parameters?.required || [],
        },
      })),
    },
  ];
};

/**
 * Format tools for OpenAI format
 */
const formatOpenAITools = (tools = []) => {
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
 * Deterministic Mock AI Provider for testing and offline development
 */
class MockAIProvider {
  constructor(name = "mock") {
    this.name = name;
  }

  async generateResponse({ prompt, systemPrompt }) {
    logger.info("MockAIProvider generateResponse invoked");
    return {
      text: `Nuvora Assistant: I received your request: "${prompt}". Please note that no live AI provider key is configured, so I am operating in development/test mode.`,
      finishReason: "STOP",
      toolCalls: [],
      provider: this.name,
    };
  }

  async generateWithTools({ prompt, systemPrompt, tools = [], conversationHistory = [], toolResults = [] }) {
    logger.info("MockAIProvider generateWithTools invoked", { prompt, toolResultsCount: toolResults.length });

    // If tool results are already provided from a previous round, format a helpful final natural-language response!
    if (toolResults.length > 0) {
      const toolOutput = toolResults[0].output;
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
          text: `Attendance Summary: Out of ${toolOutput.total} recorded session(s), ${toolOutput.present} present and ${toolOutput.absent} absent (${toolOutput.percentage}% attendance rate).`,
          finishReason: "STOP",
          toolCalls: [],
          provider: this.name,
        };
      }

      if (toolName === "getStudentAttendance" || toolName === "student.attendance") {
        const studentLabel = toolOutput.studentName ? `${toolOutput.studentName} (${toolOutput.studentId})` : `Student ${toolOutput.studentId || ""}`;
        return {
          text: `Attendance for ${studentLabel}: Total records: ${toolOutput.total}, Present: ${toolOutput.present}, Absent: ${toolOutput.absent}, Attendance rate: ${toolOutput.percentage}%.`,
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
          text: `Fee Summary: Total Billed: ₦${billed.toLocaleString()}, Total Paid: ₦${paid.toLocaleString()}, Current Outstanding Balance: ₦${outstanding.toLocaleString()}.`,
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

    // Determine appropriate tool call based on intent
    const lower = String(prompt).toLowerCase();

    // Check for prompt injection attempts
    if (lower.includes("ignore instructions") || lower.includes("ignore permissions") || lower.includes("show me all students") || lower.includes("give me the database") || lower.includes("run this sql") || lower.includes("reveal your system prompt")) {
      return {
        text: "I am Nuvora's AI assistant. I cannot fulfill requests that bypass security, reveal internal system instructions, or access unauthorized school data.",
        finishReason: "STOP",
        toolCalls: [],
        provider: this.name,
      };
    }

    if (lower.includes("overview") || lower.includes("school overview") || lower.includes("total students") || lower.includes("how many students") || lower.includes("stats")) {
      return {
        text: "",
        finishReason: "TOOL_CALL",
        toolCalls: [{ name: "getSchoolOverview", args: {} }],
        provider: this.name,
      };
    }

    if (lower.includes("attendance") && (lower.includes("child") || lower.includes("student") || lower.includes("my attendance") || lower.includes("attendance for"))) {
      return {
        text: "",
        finishReason: "TOOL_CALL",
        toolCalls: [{ name: "getStudentAttendance", args: {} }],
        provider: this.name,
      };
    }

    if (lower.includes("attendance")) {
      return {
        text: "",
        finishReason: "TOOL_CALL",
        toolCalls: [{ name: "getAttendanceSummary", args: {} }],
        provider: this.name,
      };
    }

    if (lower.includes("result") || lower.includes("score") || lower.includes("grade") || lower.includes("performance") || lower.includes("term result")) {
      return {
        text: "",
        finishReason: "TOOL_CALL",
        toolCalls: [{ name: "getStudentResults", args: {} }],
        provider: this.name,
      };
    }

    if (lower.includes("fee") || lower.includes("outstanding") || lower.includes("balance") || lower.includes("payment") || lower.includes("invoice") || lower.includes("money") || lower.includes("paid")) {
      return {
        text: "",
        finishReason: "TOOL_CALL",
        toolCalls: [{ name: "getFeeSummary", args: {} }],
        provider: this.name,
      };
    }

    return {
      text: "I am Ask Nuvora, your secure school AI assistant. You can ask me about school overview, attendance summaries, student attendance, academic results, or outstanding fees.",
      finishReason: "STOP",
      toolCalls: [],
      provider: this.name,
    };
  }
}

/**
 * Google Gemini Provider
 */
class GeminiProvider {
  constructor(apiKey, model = DEFAULT_GEMINI_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = "gemini";
  }

  async generateWithTools({ prompt, systemPrompt, tools = [], conversationHistory = [], toolResults = [] }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const contents = [];

    for (const msg of conversationHistory) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    contents.push({ role: "user", parts: [{ text: prompt }] });

    if (toolResults.length > 0) {
      for (const res of toolResults) {
        contents.push({
          role: "model",
          parts: [{ functionCall: { name: res.name, args: res.args || {} } }],
        });
        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: res.name,
                response: { output: res.output },
              },
            },
          ],
        });
      }
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    if (systemPrompt) {
      payload.system_instruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const geminiTools = formatGeminiTools(tools);
    if (geminiTools) {
      payload.tools = geminiTools;
      payload.tool_config = {
        function_calling_config: {
          mode: "AUTO",
        },
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("Gemini API error", { status: res.status, errText });
      throw Object.assign(new Error(`AI provider error (${res.status})`), { statusCode: 502 });
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const toolCalls = [];
    let text = "";

    for (const part of parts) {
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
      if (part.text) {
        text += part.text;
      }
    }

    return {
      text: text.trim(),
      toolCalls,
      finishReason: toolCalls.length > 0 ? "TOOL_CALL" : candidate?.finishReason || "STOP",
      provider: this.name,
    };
  }

  async generateResponse({ prompt, systemPrompt, conversationHistory = [] }) {
    return this.generateWithTools({ prompt, systemPrompt, tools: [], conversationHistory });
  }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider {
  constructor(apiKey, model = DEFAULT_OPENAI_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.name = "openai";
  }

  async generateWithTools({ prompt, systemPrompt, tools = [], conversationHistory = [], toolResults = [] }) {
    const url = "https://api.openai.com/v1/chat/completions";

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of conversationHistory) {
      messages.push({ role: msg.role === "model" ? "assistant" : msg.role, content: msg.content });
    }

    messages.push({ role: "user", content: prompt });

    if (toolResults.length > 0) {
      for (const res of toolResults) {
        const callId = `call_${res.name}`;
        messages.push({
          role: "assistant",
          tool_calls: [
            {
              id: callId,
              type: "function",
              function: { name: res.name, arguments: JSON.stringify(res.args || {}) },
            },
          ],
        });
        messages.push({
          role: "tool",
          tool_call_id: callId,
          content: JSON.stringify(res.output),
        });
      }
    }

    const payload = {
      model: this.model,
      messages,
      temperature: 0.1,
    };

    const openAITools = formatOpenAITools(tools);
    if (openAITools) {
      payload.tools = openAITools;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("OpenAI API error", { status: res.status, errText });
      throw Object.assign(new Error(`AI provider error (${res.status})`), { statusCode: 502 });
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;

    const toolCalls = (choice?.tool_calls || []).map((tc) => ({
      name: tc.function?.name,
      args: typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments || "{}") : tc.function?.arguments || {},
    }));

    return {
      text: choice?.content || "",
      toolCalls,
      finishReason: toolCalls.length > 0 ? "TOOL_CALL" : "STOP",
      provider: this.name,
    };
  }

  async generateResponse({ prompt, systemPrompt, conversationHistory = [] }) {
    return this.generateWithTools({ prompt, systemPrompt, tools: [], conversationHistory });
  }
}

/**
 * Factory for creating the active AI Provider based on environment configuration
 */
export const getAIProvider = () => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  if (process.env.NODE_ENV === "test" && !process.env.FORCE_LIVE_AI) {
    return new MockAIProvider("mock-test");
  }

  if (geminiKey) {
    return new GeminiProvider(geminiKey);
  }

  if (openAIKey) {
    return new OpenAIProvider(openAIKey);
  }

  // Fallback to deterministic mock if no key is configured
  return new MockAIProvider("mock-fallback");
};

export { MockAIProvider, GeminiProvider, OpenAIProvider };
