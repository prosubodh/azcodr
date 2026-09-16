# UI Navigation & URL State Synchronization

> **Core Mandate:** Enforce bidirectional URL state synchronization for all interactive view states, preserving deep linkability, bookmarkability, and native browser navigation.

---

## 1. Bidirectional URL State Synchronization

Every view state that represents navigation, active tab, filtering, sorting, pagination, or search query must synchronize bidirectionally with URL search parameters (`useSearchParams`):
- **Bookmarkability**: A user copying the browser URL must be able to restore the exact view, active tab, filter selections, and pagination page on any device.
- **Browser History Integration**: The browser's back and forward buttons must navigate between state transitions smoothly without triggering full page reloads.

---

## 2. Deep Linking Standards

- **Tabbed Interfaces**: Encode active tab keys in query params (e.g. `?tab=security` or `/settings/security`).
- **Data Tables & Lists**: Preserve table states in URL parameters:
  - `?page=2&limit=25&sort=createdAt&order=desc&status=ACTIVE`
- **Modal & Drawer States**: If a modal or drawer represents an actionable sub-view (e.g. `?modal=edit-user&userId=123`), synchronize it with the URL so direct links open the intended context.
