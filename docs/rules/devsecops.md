# DevSecOps, Secret Scanning & SBOM Standards

> **Core Mandate:** Enforce automated pre-commit secret gating, CycloneDX SBOM generation, polyglot SAST via Semgrep, and container/lockfile scanning with Trivy.

---

## 1. Automated Pre-Commit Secret Gating

- Run open-source secret scanning (**`gitleaks`** or **`secretlint`**) on every staged commit via pre-commit hooks.
- Never bypass git commit hooks (`--no-verify`). Strictly forbid committing credentials, private keys, certificates, or API tokens to version control.

---

## 2. Software Bill of Materials (SBOM) Generation

- Generate reproducible **CycloneDX 1.6** or **SPDX** SBOMs for all build artifacts using open-source **`syft`**:
  ```bash
  syft dir:. -o cyclonedx-json=sbom.json
  ```
- Archive the generated `sbom.json` alongside release binaries and container registries.
- Sign release artifacts and container images cryptographically using **Cosign** (Sigstore) with SLSA provenance attestation.

---

## 3. Polyglot SAST & Vulnerability Scanning

- **Static Analysis (SAST)**: Standardize on **Semgrep** for cross-language security and quality linting across Go, Rust, Python, Java, and TypeScript.
- **Dependency & Container CVE Scanning**: Scan lockfiles (`go.mod`, `Cargo.lock`, `package-lock.json`, `poetry.lock`, `pom.xml`) and OCI container base images using open-source **`trivy`** and **`grype`**:
  ```bash
  trivy fs --severity HIGH,CRITICAL .
  grype sbom:sbom.json
  ```
- Any unpatched `HIGH` or `CRITICAL` Common Vulnerabilities and Exposures (CVE) halts the continuous integration pipeline immediately.
