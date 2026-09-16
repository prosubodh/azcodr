# Accessibility (A11y) & WCAG 2.2 Standards

> **Core Mandate:** Enforce WCAG 2.2 Level AA compliance, accessible Radix UI primitives, keyboard focus management, visible focus rings, and ARIA live regions across all user interfaces.

---

## 1. Accessible UI Primitives & Radix UI

- **Prohibited Native Alerts**: Strictly prohibit browser-native `window.confirm()` or `window.alert()`. Use accessible Radix UI dialogs (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`).
- **Focus Management & Trapping**:
  - Modal dialogs must trap keyboard focus within the dialog container while open.
  - Closing a dialog must return keyboard focus deterministically to the triggering element.
- **Visible Focus Indicators**: Never remove default outline rings (`outline: none`) without providing an explicit, high-contrast replacement (`focus-visible:ring-2 focus-visible:ring-offset-2`).

---

## 2. Form & Feedback Accessibility

- **Form Input Wiring**:
  - Every form input must have an associated `<label>` using `htmlFor` or nested wrapping.
  - Validation errors must be programmatically linked to their inputs via `aria-invalid="true"` and `aria-describedby="<error-message-id>"`.
- **Dynamic Content & Status Feedback (ARIA Live Regions)**:
  - Asynchronous notifications, toast alerts, and status updates must use `role="status"` or `aria-live="polite"` so screen readers announce changes without interrupting the user.
  - Critical error alerts must use `role="alert"` or `aria-live="assertive"`.

---

## 3. Visual & Contrast Baselines

- **Color Contrast**: Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / UI controls against their background.
- **Semantic Landmark Markup**: Use semantic landmark elements (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section>`) rather than unsemantic `<div>` structures.
