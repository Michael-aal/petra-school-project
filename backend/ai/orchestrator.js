import { getAIProvider } from "./provider.js";
import { getApprovedTools, executeAITool } from "./aiTools.js";
import { getExtraApprovedTools, executeExtraAITool } from "./extraTools.js";
import { buildAIContext } from "./aiContext.js";
import { buildSystemPrompt } from "./prompts.js";
import { logAIActivity } from "./aiAudit.js";
import { nuvoraKnowledgeService } from "../services/nuvoraKnowledgeService.js";
import { logger } from "../utils/logger.js";
import { logAudit } from "../utils/auditLog.js";

const EXTRA_TOOL_NAMES = new Set(["getRecentActivity", "getPortalOverview", "openPetraPage"]);
const PROMPT_INJECTION_PATTERNS = [
  /ignore your instructions/i,
  /bypass security/i,
  /reveal your system prompt/i,
  /show.*system prompt/i,
  /run arbitrary sql/i,
  /drop table/i,
  /select \* from/i,
  /expose backend database/i,
  /all passwords/i,
];
const AI_REQUEST_LIMIT = 10;
const AI_WINDOW_MS = 60_000;
const AI_TIMEOUT_MS = 30_000;
const aiRequestWindows = new Map();

const enforceAIRateLimit = (userId) => {
  const key = String(userId || "anonymous");
  const now = Date.now();
  const timestamps = (aiRequestWindows.get(key) || []).filter((timestamp) => now - timestamp < AI_WINDOW_MS);
  if (timestamps.length >= AI_REQUEST_LIMIT) {
    const error = new Error("AI request rate limit exceeded. Please try again shortly.");
    error.statusCode = 429;
    throw error;
  }
  timestamps.push(now);
  aiRequestWindows.set(key, timestamps);
};

const classifyLikelyTool = (message = "") => {
  const text = String(message || "");
  const lower = text.toLowerCase();

  if (/(school overview|school stats|overview of the school|how many students|how many teachers)/i.test(text)) return "getSchoolOverview";
  if (/(attendance|present|absent|class attendance|this week|this term)/i.test(text)) return "getAttendanceSummary";
  if (/(result|results|grades?|performance|exam|academic)/i.test(text)) return "getStudentResults";
  if (/(fee|fees|tuition|outstanding|balance|payment|financial)/i.test(text)) return "getFeeSummary";

  if (/(who is|find .*user|user directory|directory of users|users in this school)/i.test(text)) return "getUserDirectory";

  if (lower.includes("school") && lower.includes("overview")) return "getSchoolOverview";
  return null;
};

const executeAIQuery = async ({ user, message, schoolId, conversationHistory = [], selectedStudentId }) => {
  const startTime = Date.now();
  const toolsUsed = [];
  const toolErrors = [];
  let primaryData = null;

  try {
    const promptText = String(message || "");
    const isPromptInjection = PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(promptText));
    const provider = getAIProvider();

    if (isPromptInjection) {
      const refusal = "I cannot fulfill requests that bypass security or reveal protected system information.";
      await logAIActivity({ userId: user?.id, schoolId: schoolId || user?.schoolId, action: "ai.query", toolsUsed: [], success: true, durationMs: Date.now() - startTime, provider: provider?.name || "mock" });
      return { success: true, answer: refusal, data: null, toolsUsed: [], toolErrors: [], provider: provider?.name || "mock" };
    }

    const context = await buildAIContext(user, { schoolId, selectedStudentId });

    const isParentRole = ["parent", "guardian"].includes(String(user?.role || "").trim().toLowerCase());
    const isChildQuery = /(child|children|student|attendance|grades?|results?|fees?|payment|balance)/i.test(promptText);
    if (isParentRole && isChildQuery && (!context.linkedChildren || context.linkedChildren.length === 0)) {
      const errorMessage = "No student is currently linked to your account. Please contact the school administrator.";
      return {
        success: false,
        statusCode: 404,
        answer: errorMessage,
        data: null,
        toolsUsed: [],
        toolErrors: [{ toolName: "linkedChildLookup", statusCode: 404 }],
        provider: provider?.name || "mock",
      };
    }

    const approvedTools = [...getApprovedTools(user), ...getExtraApprovedTools(user)];
    const knowledge = await nuvoraKnowledgeService.getEnabledKnowledge().catch(() => []);
    const systemPrompt = buildSystemPrompt({ user, context, knowledge });

    const initialResponse = await provider.generateWithTools({ prompt: promptText, systemPrompt, tools: approvedTools, conversationHistory });
    let finalAnswer = initialResponse.text;

    const likelyToolName = classifyLikelyTool(promptText);
    if (likelyToolName && (!initialResponse.toolCalls || initialResponse.toolCalls.length === 0)) {
      initialResponse.toolCalls = [{ name: likelyToolName, args: { schoolId: schoolId ?? context.schoolId } }];
    }

    if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
      const toolResults = [];
      for (const toolCall of initialResponse.toolCalls) {
        logger.info("Executing AI tool call", { toolName: toolCall.name, userId: user.id, role: user.role });
        const toolArgs = { ...(toolCall.args || {}) };
        if (!toolArgs.studentId && context.defaultStudentId) toolArgs.studentId = context.defaultStudentId;

        try {
          const toolOutput = EXTRA_TOOL_NAMES.has(toolCall.name)
            ? await executeExtraAITool({ user, toolName: toolCall.name, input: toolArgs })
            : await executeAITool({ user, toolName: toolCall.name, input: toolArgs });
          toolsUsed.push(toolCall.name);
          if (!primaryData) primaryData = toolOutput;
          toolResults.push({ name: toolCall.name, args: toolArgs, output: toolOutput });
        } catch (toolError) {
          const statusCode = toolError?.statusCode || 500;
          logger.warn("Nuvora tool call failed", { toolName: toolCall.name, statusCode, error: toolError?.message, userId: user.id });
          toolErrors.push({ toolName: toolCall.name, statusCode });
          const safeMessage = statusCode === 403
            ? "The requested information is not available to this user because of access permissions."
            : statusCode === 404
              ? "The requested record could not be found or is not linked to this account."
              : statusCode === 400
                ? "The requested tool could not run because its parameters were invalid."
                : "The requested tool could not complete.";
          toolResults.push({ name: toolCall.name, args: toolArgs, output: { success: false, error: safeMessage, statusCode } });
        }
      }

      const followUpResponse = await provider.generateWithTools({ prompt: message, systemPrompt, tools: approvedTools, conversationHistory, toolResults });
      finalAnswer = followUpResponse.text || "I could not retrieve the requested information from the authorized school records.";
    }

    const durationMs = Date.now() - startTime;
    await logAIActivity({ userId: user.id, schoolId: context.schoolId, action: "ai.query", toolsUsed, success: true, durationMs, provider: initialResponse.provider });
    return { success: true, answer: finalAnswer, data: primaryData, toolsUsed, toolErrors, provider: initialResponse.provider };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI query execution failed", { error: error.message, statusCode: error.statusCode, userId: user?.id });
    await logAIActivity({ userId: user?.id, schoolId: schoolId || user?.schoolId, action: "ai.query.error", toolsUsed, success: false, durationMs });
    await logAudit({
      userId: user?.id,
      schoolId: schoolId || user?.schoolId,
      action: "external_api.failure",
      actionType: "EXTERNAL_API_ERROR",
      entity: "AIProvider",
      details: { metadata: { provider: "ai", endpoint: "generateWithTools", error: error.message, retryCount: 0 } },
    }).catch(() => null);
    if (error.statusCode === 403) return { success: false, statusCode: 403, answer: error.message || "You are not authorized to access this information.", data: null, toolsUsed };
    if (error.statusCode === 404) return { success: false, statusCode: 404, answer: error.message || "The requested student or record could not be found.", data: null, toolsUsed };
    if (error.statusCode === 400) return { success: false, statusCode: 400, answer: error.message || "Invalid query parameters.", data: null, toolsUsed };
    return { success: false, statusCode: 500, answer: "We encountered an issue processing your question with Nuvora AI. Please try again or contact support.", data: null, toolsUsed };
  }
};

export const handleAIQuery = async (args) => {
  try {
    enforceAIRateLimit(args?.user?.id);
    let timeoutHandle;
    const timeout = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        const error = new Error("AI provider request timed out");
        error.statusCode = 504;
        reject(error);
      }, AI_TIMEOUT_MS);
      timeoutHandle.unref?.();
    });
    const result = await Promise.race([executeAIQuery(args), timeout]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    await logAudit({
      userId: args?.user?.id,
      schoolId: args?.schoolId || args?.user?.schoolId,
      action: "external_api.failure",
      actionType: "EXTERNAL_API_ERROR",
      entity: "AIProvider",
      details: { metadata: { provider: "ai", endpoint: "generateWithTools", error: error.message, retryCount: 0 } },
    }).catch(() => null);
    return {
      success: false,
      statusCode: error.statusCode || 500,
      answer: error.statusCode === 429 ? error.message : "The AI provider is temporarily unavailable. Please try again.",
      data: null,
      toolsUsed: [],
    };
  }
};
