import "../config/loadEnv.js";
import { createResilientProviderClient } from "../utils/axiosWithRetry.js";

const QUIZLAB_MCP_URL = process.env.QUIZLAB_MCP_URL || 'https://quizlab.in/mcp';
const API_KEY = process.env.QUIZLAB_API_KEY || '';
const ATS_API_KEY = process.env.QUIZLAB_ATS_API_KEY || process.env.ATS_API_KEY || '';
const quizlabClient = createResilientProviderClient({
  provider: "classmarker",
  baseURL: "https://quizlab.in",
  timeoutEnv: process.env.QUIZLAB_TIMEOUT_MS,
});

let mcpSessionId = null;
let mcpSessionExpiresAt = 0;

const ensureSession = async () => {
  if (mcpSessionId && Date.now() < mcpSessionExpiresAt - 30000) return mcpSessionId;
  // Initialize MCP session
  const payload = {
    jsonrpc: '2.0',
    id: 'init-session',
    method: 'initialize',
    params: {},
  };
  const res = await quizlabClient.request({
    method: 'POST',
    url: new URL(QUIZLAB_MCP_URL).pathname,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    data: payload,
    retryable: false,
  });
  const data = res.data;
  const sid = res.headers?.get?.('Mcp-Session-Id') || res.headers?.['mcp-session-id'] || data?.result?.sessionId || data?.result?.session_id || data?.result?.mcp_session_id || null;
  if (!sid) throw new Error('QuizLab did not return a session id');
  mcpSessionId = sid;
  // default TTL 30 minutes
  mcpSessionExpiresAt = Date.now() + (data?.result?.expiresInMs || (30 * 60 * 1000));
  return mcpSessionId;
};

const callMcp = async (method, params = {}) => {
  if (!API_KEY) throw new Error('QUIZLAB_API_KEY not configured');
  const session = await ensureSession();
  const payload = {
    jsonrpc: '2.0',
    id: `${method}-${Date.now()}`,
    method: 'tools/call',
    params: { name: method, arguments: params },
  };
  const res = await quizlabClient.request({
    method: 'POST',
    url: new URL(QUIZLAB_MCP_URL).pathname,
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': session,
    },
    data: payload,
    retryable: false,
  });
  const data = res.data;
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const result = data.result ?? data;

  const throwProviderError = (value) => {
    if (!value?.error) return value;

    const message =
      typeof value.error === 'string'
        ? value.error
        : value.error?.message || JSON.stringify(value.error);

    throw new Error(`QuizLab ${method} failed: ${message}`);
  };

  if (result && Array.isArray(result.content) && result.content.length === 1 && typeof result.content[0]?.text === 'string') {
    let parsed;

    try {
      parsed = JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }

    return throwProviderError(parsed);
  }
  return throwProviderError(result);
};

const callAts = async (path, { method = 'GET', body } = {}) => {
  if (!ATS_API_KEY) throw new Error('ATS_API_KEY not configured');
  const res = await quizlabClient.request({
    method,
    url: path,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ATS_API_KEY}`,
    },
    data: body,
    retryable: false,
  });

  return res.data;
};

export const quizlabService = {
  listQuizzes: async (opts = {}) => callMcp('quiz_list', opts),
  getQuiz: async (quizId) => callMcp('quiz_get', { quiz_id: Number(quizId) || quizId }),
  createQuiz: async (payload) => callMcp('quiz_create', {
    title: payload?.title,
    description: payload?.description,
    duration_minutes: payload?.duration_minutes ?? payload?.durationMinutes,
    timer_enabled: payload?.timer_enabled ?? payload?.timerEnabled,
    shuffle_questions: payload?.shuffle_questions ?? payload?.shuffleQuestions,
    shuffle_options: payload?.shuffle_options ?? payload?.shuffleOptions,
    passing_percent: payload?.passing_percent ?? payload?.passingPercent,
    allow_retakes: payload?.allow_retakes ?? payload?.allowRetakes,
    starts_at: payload?.starts_at ?? payload?.startsAt,
    ends_at: payload?.ends_at ?? payload?.endsAt,
  }),
  publishQuiz: async (quizId) => callMcp('quiz_publish', { quiz_id: Number(quizId) || quizId }),
  createInvitation: async (quizId, candidate = {}) => callMcp('invitation_create', {
    quiz_id: Number(quizId) || quizId,
    email: candidate.email,
    full_name: candidate.full_name || candidate.fullName || candidate.name,
    ...(candidate.expiry_days || candidate.expiryDays
      ? { expiry_days: Number(candidate.expiry_days || candidate.expiryDays) }
      : {}),
  }),
  listInvitations: async (quizId) => callMcp('invitation_list', { quiz_id: Number(quizId) || quizId }),
  listAttempts: async (quizId) => callMcp('result_list_attempts', { quiz_id: Number(quizId) || quizId }),
  getAttempt: async (_quizId, attemptId) => callMcp('result_get_attempt', { attempt_id: Number(attemptId) || attemptId }),
  createAssessment: async (payload) => callAts('/api/ats/assessments', { method: 'POST', body: payload }),
  getAssessment: async (idOrExternalId) => callAts(`/api/ats/assessments/${encodeURIComponent(idOrExternalId)}`),
  listAssessments: async (status) => callAts(`/api/ats/assessments${status ? `?status=${encodeURIComponent(status)}` : ''}`),
};

export default quizlabService;
