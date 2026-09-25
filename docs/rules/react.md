# React & Modern Frontend Architecture

> **Core Mandate:** Enforce modern, production-grade React standards across all web interfaces: `shadcn/ui` with Radix UI primitives, TanStack Query for server-state caching, React Hook Form / TanStack Form with Zod validation, and zero ad-hoc `useState` forms or raw `useEffect` fetch loops.

---

## 1. Component Library & Styling (`shadcn/ui` + Radix UI)

- **Accessible Radix Primitives**: All interactive UI components (dialogs, dropdowns, selects, tabs, tooltips, popovers) must be built on `@radix-ui` headless primitives or `shadcn/ui` components located in `@/components/ui/`.
- **Zero Unstyled Raw Elements**: Never create unstyled raw HTML modals, dropdowns, or custom select tags.
- **Tailwind Utility Styling (`cn` helper)**: Combine Tailwind utility classes using `clsx` and `tailwind-merge` (`cn(...)`) to allow clean prop overrides and consistent theming.
- **Strict Prohibition of Native Dialogs**: As mandated in [`docs/rules/accessibility.md`](./accessibility.md), `window.alert()` and `window.confirm()` are strictly forbidden. Use accessible Radix UI dialogs (`<ConfirmDialog />`).

---

## 2. Server State & Data Fetching (TanStack Query)

- **Mandatory TanStack Query**: All asynchronous data fetching, caching, and mutation must use **TanStack Query (`@tanstack/react-query`)**.
- **No Raw `useEffect` Fetch Loops**:
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

## 3. Form State Management & Validation (Zod + Form Engines)

- **Mandatory Schema Validation**: Every form submission must be validated against a formal **Zod schema** (`z.object({ ... })`) that mirrors the shared DTO/input contracts from shared packages.
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

## 4. State Separation & Data Tables

- **State Hierarchy**:
  1. **Server State (Remote)**: Manage exclusively with **TanStack Query**.
  2. **URL State (Search / Pagination / Filters)**: Manage in URL search params per [`docs/rules/ui_navigation.md`](./ui_navigation.md).
  3. **Form State (Transient Edits)**: Manage via **React Hook Form / TanStack Form**.
  4. **Global Client State (Session/UI)**: Manage via **Zustand** (or React Context for theme/auth).
- **Data Grids & Tables**: When building sortable, paginated, or virtualized tables, standardize on **TanStack Table (`@tanstack/react-table`)**.

---

## 5. Theme Architecture & Design Token Completeness

- **Symmetric Design Tokens**: Ensure foundational CSS variables (`--background`, `--foreground`, `--card`, `--border`, `--popover`) are symmetrically declared across `:root` and `.dark`. Omitted root tokens in `.dark` result in unstyled backgrounds and illegible text when switching themes.
- **System Preference Detection & Reactive Synchronization**: `ThemeProvider` implementations must listen to `window.matchMedia('(prefers-color-scheme: dark)')` with dynamic event listeners so OS appearance toggles seamlessly propagate in real-time, and synchronize `document.documentElement.style.colorScheme = resolvedTheme` to ensure browser-native elements (scrollbars, input widgets) match the active theme.
