import fetch from 'node-fetch';

const QUIZLAB_MCP_URL = process.env.QUIZLAB_MCP_URL || 'https://quizlab.in/mcp';
const API_KEY = process.env.QUIZLAB_API_KEY || '';
const ATS_API_KEY = process.env.ATS_API_KEY || '';

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
  const res = await fetch(QUIZLAB_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`QuizLab init failed status=${res.status}`);
  const data = await res.json();
  const sid = res.headers.get('Mcp-Session-Id') || data?.result?.sessionId || data?.result?.session_id || data?.result?.mcp_session_id || null;
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
  const res = await fetch(QUIZLAB_MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': session,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`QuizLab ${method} failed status=${res.status} ${text}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const result = data.result ?? data;
  if (result && Array.isArray(result.content) && result.content.length === 1 && typeof result.content[0]?.text === 'string') {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }
  }
  return result;
};

const callAts = async (path, { method = 'GET', body } = {}) => {
  if (!ATS_API_KEY) throw new Error('ATS_API_KEY not configured');
  const res = await fetch(`https://quizlab.in${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ATS_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text().catch(() => '');
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }
  }

  if (!res.ok) {
    const error = new Error(data.message || data.error || `QuizLab ATS request failed status=${res.status}`);
    error.status = res.status;
    error.response = data;
    throw error;
  }

  return data;
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
  createInvitation: async (quizId, candidate) => callMcp('invitation_create', { quiz_id: Number(quizId) || quizId, ...candidate }),
  listInvitations: async (quizId, opts = {}) => callMcp('invitation_list', Object.assign({ quiz_id: Number(quizId) || quizId }, opts)),
  listAttempts: async (quizId, opts = {}) => callMcp('result_list_attempts', Object.assign({ quiz_id: Number(quizId) || quizId }, opts)),
  getAttempt: async (quizId, attemptId) => callMcp('result_get_attempt', { quiz_id: Number(quizId) || quizId, attempt_id: attemptId }),
  createAssessment: async (payload) => callAts('/api/ats/assessments', { method: 'POST', body: payload }),
  getAssessment: async (idOrExternalId) => callAts(`/api/ats/assessments/${encodeURIComponent(idOrExternalId)}`),
  listAssessments: async (status) => callAts(`/api/ats/assessments${status ? `?status=${encodeURIComponent(status)}` : ''}`),
};

export default quizlabService;
