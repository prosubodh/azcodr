# DevSecOps, Secret Scanning & SBOM Standards

> **Core Mandate:** Enforce automated pre-commit secret gating via Secretlint, CycloneDX 1.6 SBOM generation, and vulnerability scanning with open-source tools.

---

## 1. Automated Pre-Commit Secret Gating

- Run open-source `secretlint --no-glob` on every staged commit via `lint-staged`.
- Never bypass git commit hooks or commit secrets, private keys, or API tokens to the repository.

---

## 2. Software Bill of Materials (SBOM) Generation

- Generate reproducible CycloneDX 1.6 SBOMs for backend and frontend builds using open-source `syft` or `@cyclonedx/cyclonedx-npm`:
  ```bash
  syft dir:. -o cyclonedx-json=bom.json
  ```
- Archive the generated `bom.json` alongside release artifacts.

---

## 3. Dependency & Container CVE Scanning

- Scan dependencies and container base images using open-source `trivy` and `grype`:
  ```bash
  trivy fs --severity HIGH,CRITICAL .
  grype sbom:bom.json
  ```
- Any unpatched Critical or High CVE halts the build pipeline.
