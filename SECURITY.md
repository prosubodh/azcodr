# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

We take the security of `azcodr` and the architectures scaffolded with it seriously. If you discover a security vulnerability, please report it responsibly:

1. **GitHub Private Vulnerability Reporting (Preferred):**  
   Submit a private advisory directly through [GitHub Security Advisories](https://github.com/prosubodh/azcodr/security/advisories/new).
2. **Email Disclosure:**  
   Email `prosubodh+security@gmail.com` with:
   - Detailed description of the vulnerability and potential impact.
   - Minimal, reproducible steps or proof-of-concept payload.
   - Affected subsystem (`src/guards.ts`, `src/scaffold.ts`, `.agents/scripts/`, etc.).

### Response Commitments
- **Initial Acknowledgment:** Within 48 hours.
- **Triage & Reproduction:** Within 5 business days.
- **Coordinated Disclosure:** Security patch release with accompanying advisory disclosure once remediated.

### Scope & Hardening Invariants
The core supply-chain invariants defended by `azcodr` include:
- **Zero Runtime Dependencies:** Supply chain attack surface bounded to standard library Node.js builtins.
- **Strict Process Isolation:** No shell-string execution (`execSync`/`exec` forbidden; `execFileSync` requires `shell: false`).
- **Filesystem Containment:** Path boundary enforcement (`assertInside`) preventing directory traversal or escape.
- **Target Protection:** Refusal to write into system root, user home directory, or ancestors (`isProtectedTarget`), even with `--force`.
