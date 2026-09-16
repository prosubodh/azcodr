# Continuous Deployment (CD) & Release Engineering

> **Core Mandate:** Enforce zero-downtime deployment rollouts, cryptographic container signing with Cosign, and minimal attack surface container baselines.

---

## 1. Zero-Downtime Deployment Strategies

- **Blue-Green / Rolling Deployments**: Deploy new application versions alongside active instances, verify readiness healthchecks, and shift traffic seamlessly without dropping connections.
- **Rollback Automation**: If error rates or latency spike beyond thresholds immediately post-deployment, automate an instant rollback to the previous stable release.

---

## 2. Container Signing & Provenance (Cosign)

- Utilize open-source **Cosign** (Sigstore) to cryptographically sign all release container images in the deployment pipeline.
- Production Kubernetes / Docker hosts must verify Cosign image signatures and provenance attestations before pulling and launching containers.

---

## 3. Container Minimization

- Standardize on minimal container base images (`node:24-alpine` or distroless images).
- Purge all devDependencies, compilers, and package managers from the final production container layer.
