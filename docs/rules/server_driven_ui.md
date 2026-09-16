# Server-Driven UI (SDUI) & Dynamic Theming

> **Core Mandate:** Enforce metadata-driven UI rendering from declarative backend schemas, eliminating client-side tenant code forks, and inject white-label branding via dynamic CSS Custom Properties.

---

## 1. Declarative SDUI Schema

The backend provides a declarative UI schema describing fields, layouts, visibility rules, and allowed actions (`_actions`), eliminating client-side tenant branching:

```json
{
  "view": "OrderEdit",
  "layout": "two-column",
  "sections": [
    {
      "id": "general",
      "title": "General Details",
      "fields": [
        { "name": "orderNumber", "component": "TextInput", "readOnly": true },
        { "name": "custom_attributes.poNumber", "component": "TextInput", "required": true }
      ]
    },
    {
      "id": "tax",
      "title": "Tax Exemption",
      "visibleIf": { "field": "custom_attributes.isTaxExempt", "operator": "equals", "value": true },
      "fields": [
        { "name": "custom_attributes.taxExemptionId", "component": "TextInput", "required": true }
      ]
    }
  ],
  "_actions": [
    { "action": "SUBMIT_FOR_APPROVAL", "label": "Submit Order", "method": "POST", "href": "/api/v1/orders/123/submit" }
  ]
}
```

---

## 2. Frontend Component Registry

The client maps backend component descriptors dynamically to accessible **Radix UI** and Tailwind primitives, keeping the frontend codebase 100% tenant-agnostic.

---

## 3. Dynamic Design Tokens (White-Label Theming)

Apply unique tenant branding dynamically at runtime using CSS Custom Properties without bundler rebuilds:

```typescript
export interface TenantThemeTokens {
  primaryColor: string;
  accentColor: string;
  borderRadius: string;
  fontFamily: string;
}

export function applyTenantTheme(tokens: TenantThemeTokens): void {
  const root = document.documentElement;
  root.style.setProperty('--color-brand-primary', tokens.primaryColor);
  root.style.setProperty('--color-brand-accent', tokens.accentColor);
  root.style.setProperty('--radius-base', tokens.borderRadius);
  root.style.setProperty('--font-brand', tokens.fontFamily);
}
```
