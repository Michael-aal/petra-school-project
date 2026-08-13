import fetch from 'node-fetch';

const QUIZLAB_MCP_URL = process.env.QUIZLAB_MCP_URL || 'https://quizlab.in/mcp';
const API_KEY = process.env.QUIZLAB_API_KEY || '';

let mcpSessionId = null;
let mcpSessionExpiresAt = 0;

const ensureSession = async () => {
  if (mcpSessionId && Date.now() < mcpSessionExpiresAt - 30000) return mcpSessionId;
  // Initialize MCP session
  const payload = {
    jsonrpc: '2.0',
    id: 'init-session',
    method: 'init',
    params: { api_key: API_KEY },
  };
  const res = await fetch(QUIZLAB_MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`QuizLab init failed status=${res.status}`);
  const data = await res.json();
  const sid = data?.result?.sessionId || data?.result?.session_id || data?.result?.mcp_session_id || null;
  if (!sid) throw new Error('QuizLab did not return a session id');
  mcpSessionId = sid;
  // default TTL 30 minutes
  mcpSessionExpiresAt = Date.now() + (data?.result?.expiresInMs || (30 * 60 * 1000));
  return mcpSessionId;
};

const callMcp = async (method, params = {}) => {
  if (!API_KEY) throw new Error('QUIZLAB_API_KEY not configured');
  const session = await ensureSession();
  const payload = { jsonrpc: '2.0', id: `${method}-${Date.now()}`, method, params };
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
  return data.result;
};

export const quizlabService = {
  listQuizzes: async (opts = {}) => callMcp('quiz_list', opts),
  getQuiz: async (quizId) => callMcp('quiz_get', { quizId }),
  createQuiz: async (payload) => callMcp('quiz_create', payload),
  publishQuiz: async (quizId) => callMcp('quiz_publish', { quizId }),
  createInvitation: async (quizId, candidate) => callMcp('invitation_create', { quizId, candidate }),
  listInvitations: async (quizId, opts = {}) => callMcp('invitation_list', Object.assign({ quizId }, opts)),
  listAttempts: async (quizId, opts = {}) => callMcp('result_list_attempts', Object.assign({ quizId }, opts)),
  getAttempt: async (quizId, attemptId) => callMcp('result_get_attempt', { quizId, attemptId }),
};

export default quizlabService;
