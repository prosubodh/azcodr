# Frontend Architecture & Client State Management

> **Core Mandate:** Enforce production-grade web client architecture: headless accessible component primitives, server-state query caching (TanStack Query), declarative schema form validation (Zod/standard-schema), explicit state separation (server vs URL vs form vs global), and symmetrical design tokens.

---

## 1. The YAGNI Gate: Semantic HTML & Headless Primitives vs. Premature Sprawl

Frontend engineering is frequently derailed by two opposing anti-patterns: **reinventing the wheel** (hand-rolling custom dialogs and CSS frameworks) or **premature framework sprawl** (installing heavy global state machines for simple data flows).

```
                 FRONTEND ARCHITECTURE YAGNI GATE
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. SIMPLE BASELINE (Day 1)                                             │
  │    • Semantic HTML styled with Tailwind CSS utility classes.           │
  │    • Battle-tested accessible headless primitives (shadcn / Radix UI). │
  │    • Zero bespoke CSS architectures, unstyled `<div>` modals, or Redux.│
  ├────────────────────────────────────────────────────────────────────────┤
  │ 2. ANTI-TRIGGERS (When Frontend Architecture is Strictly Forbidden)    │
  │    • Headless backends, REST/gRPC microservices, or cloud workers.     │
  │    • Terminal CLI utilities, embedded libraries, or game engines.      │
  │    • Ad-hoc global state stores (Redux, MobX) before separating server │
  │      state (TanStack Query) and URL search parameters.                 │
  ├────────────────────────────────────────────────────────────────────────┤
  │ 3. THE TIPPING POINT (When to Apply this Architectural Discipline)     │
  │    • Dynamic web interfaces with asynchronous server data fetching,    │
  │      declarative form submissions, and multi-step UI workflows.        │
  │    • Requirements for strict WCAG 2.2 AA accessibility, focus trapping,│
  │      and full keyboard navigation.                                     │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Primitives & Headless Accessibility

- **Accessible Headless Primitives**: All interactive UI components (dialogs, dropdowns, selects, tabs, tooltips, popovers) must be built on battle-tested headless primitives (`@radix-ui` / `shadcn/ui` components in `@/components/ui/` or framework equivalents in Vue/Svelte).
- **Zero Unstyled Raw Elements**: Never create unstyled raw HTML modals, dropdowns, or custom select tags using raw `<div>` and ad-hoc state.
- **Tailwind Utility Styling (`cn` helper)**: Combine Tailwind utility classes using `clsx` and `tailwind-merge` (`cn(...)`) to allow clean prop overrides and consistent theming.
- **Strict Prohibition of Native Dialogs**: As mandated in [`docs/rules/accessibility.md`](./accessibility.md), `window.alert()` and `window.confirm()` are strictly forbidden. Use accessible headless dialogs (`<ConfirmDialog />`).

---

## 3. Server State & Remote Data Fetching (TanStack Query)

- **Mandatory Server State Manager**: All asynchronous data fetching, caching, and background refetching must use **TanStack Query (`@tanstack/react-query`, `@tanstack/vue-query`, `@tanstack/svelte-query`)**.
- **No Raw `useEffect` / Lifecycle Fetch Loops**:
  - *Anti-Pattern:* `useEffect(() => { fetch(...).then(setData) }, [])` with manual `loading` and `error` state.
  - *Standard Pattern:*
    ```tsx
    const { data: resources, isLoading, error } = useQuery({
      queryKey: ['resources', tenantId],
      queryFn: () => api.getResources(),
    });
    ```
- **Declarative Mutations & Invalidation**:
  - Mutations must define `useMutation` with `onSuccess` cache invalidation:
    ```tsx
    const queryClient = useQueryClient();
    const createResourceMutation = useMutation({
      mutationFn: (newResource: CreateResourceInput) => api.createResource(newResource),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
      },
    });
    ```
- **Query Key Conventions**: Format query keys hierarchically as tuples: `['entity', id, ...filters]`, e.g., `['orders', orderId]`, `['users', tenantId]`.

---

## 4. Form State Management & Fail-Fast Schema Validation

- **Mandatory Schema Validation**: Every form submission must be validated against a formal declarative schema (Zod or standard-schema) that mirrors the shared DTO/input contracts.
- **Form State Engines**: Use **React Hook Form (`react-hook-form` + `@hookform/resolvers/zod`)** or **TanStack Form (`@tanstack/react-form`)**.
- **Zero Unvalidated `useState` Multi-Field Objects**:
  - *Anti-Pattern:*
    ```tsx
    const [form, setForm] = useState({ name: '', email: '' });
    // manual validation in submit handler...
    ```
  - *Standard Pattern:*
    ```tsx
    const form = useForm<CreateUserInput>({
      resolver: zodResolver(createUserSchema),
      defaultValues: { name: '', email: '' },
    });
    ```
- **Accessible Error Linking**: Form inputs must bind validation errors to `aria-invalid="true"` and `aria-describedby="<field>-error"`.

---

## 5. The 4-Tier State Separation Hierarchy

Never dump all application state into a single global state container. Enforce strict categorical separation:

1. **Server State (Remote)**: Manage exclusively with **TanStack Query**.
2. **URL State (Search / Pagination / Filters)**: Manage in URL search params per [`docs/rules/ui_navigation.md`](./ui_navigation.md).
3. **Form State (Transient Edits)**: Manage via **React Hook Form / TanStack Form**.
4. **Global Client State (Session/UI)**: Manage via **Zustand** (or React Context for theme/auth).
5. **Data Grids & Tables**: When building sortable, paginated, or virtualized tables, standardize on **TanStack Table (`@tanstack/react-table`)**.

---

## 6. Theme Architecture & Symmetrical Design Tokens

- **Symmetric Design Tokens**: Ensure foundational CSS variables (`--background`, `--foreground`, `--card`, `--border`, `--popover`) are symmetrically declared across `:root` and `.dark`. Omitted root tokens in `.dark` result in unstyled backgrounds and illegible text when switching themes.
- **System Preference Detection & Reactive Synchronization**: `ThemeProvider` implementations must listen to `window.matchMedia('(prefers-color-scheme: dark)')` with dynamic event listeners so OS appearance toggles seamlessly propagate in real-time, and synchronize `document.documentElement.style.colorScheme = resolvedTheme` to ensure browser-native elements (scrollbars, input widgets) match the active theme.
