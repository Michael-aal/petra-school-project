# Nuvora Developer Knowledge

Nuvora has a developer-managed knowledge layer at `/api/ai/knowledge`.

Developers and SuperAdmins can create, edit, enable/disable, and remove guidance that explains how Petra works. Enabled entries are loaded by the Nuvora orchestrator and supplied to the AI as product guidance.

This is **not model fine-tuning**. It is controlled application knowledge, so updates take effect without changing model weights.

## Safety

- Live school records returned by authorized tools always take priority over this knowledge.
- Knowledge is never used to bypass role, school, or data permissions.
- Secrets, passwords, tokens, private credentials, and unrestricted database instructions must not be stored here.
- The knowledge table is created by the Prisma migration `20260915000400_add_nuvora_knowledge`.

## API

- `GET /api/ai/knowledge`
- `POST /api/ai/knowledge`
- `PATCH /api/ai/knowledge/:id`
- `DELETE /api/ai/knowledge/:id`

All endpoints require developer/SuperAdmin authorization.
