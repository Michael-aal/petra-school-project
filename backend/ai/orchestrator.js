import { getAIProvider } from "./provider.js";
import { getApprovedTools, executeAITool } from "./aiTools.js";
import { buildAIContext } from "./aiContext.js";
import { buildSystemPrompt } from "./prompts.js";
import { logAIActivity } from "./aiAudit.js";
import { logger } from "../utils/logger.js";

export const handleAIQuery = async ({
  user,
  message,
  schoolId,
  conversationHistory = [],
  selectedStudentId,
}) => {
  const startTime = Date.now();
  const toolsUsed = [];
  let primaryData = null;

  try {
    // 1. Build minimal authorized context
    const context = await buildAIContext(user, { schoolId, selectedStudentId });
    const approvedTools = getApprovedTools(user);
    const systemPrompt = buildSystemPrompt({ user, context });

    // 2. Initialize provider
    const provider = getAIProvider();

    // 3. Step 1: Query provider with available tools
    const initialResponse = await provider.generateWithTools({
      prompt: message,
      systemPrompt,
      tools: approvedTools,
      conversationHistory,
    });

    let finalAnswer = initialResponse.text;

    // 4. Handle tool calls if returned by model
    if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
      const toolResults = [];

      for (const toolCall of initialResponse.toolCalls) {
        logger.info("Executing AI tool call", {
          toolName: toolCall.name,
          userId: user.id,
          role: user.role,
        });

        // Merging user's default/selected studentId if omitted by model
        const toolArgs = { ...(toolCall.args || {}) };
        if (!toolArgs.studentId && context.defaultStudentId) {
          toolArgs.studentId = context.defaultStudentId;
        }

        const toolOutput = await executeAITool({
          user,
          toolName: toolCall.name,
          input: toolArgs,
        });

        toolsUsed.push(toolCall.name);
        if (!primaryData) primaryData = toolOutput;

        toolResults.push({
          name: toolCall.name,
          args: toolArgs,
          output: toolOutput,
        });
      }

      // Step 2: Get natural-language explanation of authoritative data from provider
      const followUpResponse = await provider.generateWithTools({
        prompt: message,
        systemPrompt,
        tools: approvedTools,
        conversationHistory,
        toolResults,
      });

      finalAnswer = followUpResponse.text || "Here is the authorized school information requested.";
    }

    const durationMs = Date.now() - startTime;

    // 5. Safe audit logging
    await logAIActivity({
      userId: user.id,
      schoolId: context.schoolId,
      action: "ai.query",
      toolsUsed,
      success: true,
      durationMs,
      provider: initialResponse.provider,
    });

    return {
      success: true,
      answer: finalAnswer,
      data: primaryData,
      toolsUsed,
      provider: initialResponse.provider,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("AI query execution failed", {
      error: error.message,
      statusCode: error.statusCode,
      userId: user?.id,
    });

    await logAIActivity({
      userId: user?.id,
      schoolId: schoolId || user?.schoolId,
      action: "ai.query.error",
      toolsUsed,
      success: false,
      durationMs,
    });

    // Provide clean, safe user-facing message
    if (error.statusCode === 403) {
      return {
        success: false,
        statusCode: 403,
        answer: error.message || "You are not authorized to access this information.",
        data: null,
        toolsUsed,
      };
    }

    if (error.statusCode === 404) {
      return {
        success: false,
        statusCode: 404,
        answer: error.message || "The requested student or record could not be found.",
        data: null,
        toolsUsed,
      };
    }

    if (error.statusCode === 400) {
      return {
        success: false,
        statusCode: 400,
        answer: error.message || "Invalid query parameters.",
        data: null,
        toolsUsed,
      };
    }

    return {
      success: false,
      statusCode: 500,
      answer: "We encountered an issue processing your question with Nuvora AI. Please try again or contact support.",
      data: null,
      toolsUsed,
    };
  }
};
