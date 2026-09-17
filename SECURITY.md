# Security Policy

## Supported versions

Security fixes are applied to the current `main` branch. Older commits and branches should be treated as unsupported unless explicitly maintained.

## Reporting a vulnerability

Please do not publish exploitable security details in a public GitHub issue.

For a private report, contact the project maintainer through the private contact channel used by the project team. Include:

- affected component or endpoint
- steps to reproduce
- expected and observed behavior
- security impact
- any safe mitigation already identified

Do not include passwords, API keys, private keys, access tokens, or other secrets in a report.

## Secret rotation

If a credential is suspected to be exposed, rotate it immediately rather than only changing the application configuration.

### JWT keys

Rotate the configured JWT signing key pair (`JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`) together. Update the deployment secret store, restart the affected services, and verify that new sessions/tokens can be issued and validated.

### Origin secret

If `ORIGIN_SECRET` is exposed, generate a new high-entropy value, update the deployment secret store, restart the backend, and verify authenticated requests and trusted-origin checks.

### General rule

Never commit secrets to Git. If a secret appears in Git history, treat it as compromised and rotate it even if the file is later removed.

## Safe verification

Security changes should be tested against the existing test suite before deployment. Tenant-isolation tests are intended to verify that school-owned data cannot cross school boundaries.
