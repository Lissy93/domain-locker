---
slug: adding-components
title: Components and Routes
description: Get started with new components, routes and services
coverImage: 
---

This guide explains how to add **new components** and **pages** in Domain Locker, covering Angular, Analog, PrimeNG, and Tailwind.

---

### Creating a Component

To create a reusable Angular component, follow these steps:

1. Create a new file in `src/app/components/` e.g. `example.component.ts`

2. Use the following template:

```typescript
import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  standalone: true, // This component does not require a module
  selector: 'app-example', // The HTML tag to use this component
  imports: [CommonModule, PrimeNgModule], // Required dependencies
  template: `
    <div *ngIf="isBrowser" class="p-card">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  `,
})
export class ExampleComponent {
  @Input() title: string = 'Default Title'; // Accepts a title prop
  @Input() description: string = 'This is a reusable component.'; // Accepts a description prop

  isBrowser: boolean; // Detects if the component is running in the browser

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
}
```

3. Use the component in another file:

```html
<app-example title="Welcome!" description="This is a test component."></app-example>
```

---

### Creating a Page (Analog.js Routing)

Unlike components, **pages are top-level routes**. 

1. **Create a new file** inside `src/app/pages/`, e.g. `example.page.ts`


2. **Define the page component** (Analog expects `export default`):

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  template: `
    <h1>Example Page</h1>
    <p>This is a new route.</p>
  `,
})
export default class ExamplePage {}
```

---

### Analog.js Routing Structure

Analog follows **file-based routing**, meaning the structure determines the URL:

| Path | File Location |
|------|--------------|
| `/about` | `src/app/pages/about.page.ts` |
| `/settings/profile` | `src/app/pages/settings/profile.page.ts` |
| `/domain/:id` | `src/app/pages/domain/[id].page.ts` |

#### Special Cases:
- **Dynamic Params:** Use `[param]` for route variables (`[id].page.ts` → `/domain/123`).
- **Index Routes:** Use `index.page.ts` inside a folder (`/settings/` → `settings/index.page.ts`).
- **Nested Routes:** Create folders (`settings/profile.page.ts` → `/settings/profile`).

---

### Core Angular Concepts

| Concept | Purpose | Where to Put It |
|---------|---------|----------------|
| **Components** | UI Elements | `src/app/components/` |
| **Pages** | Route-based views | `src/app/pages/` |
| **Services** | Shared logic (e.g., API calls) | `src/app/services/` |
| **Directives** | Custom behaviors for elements | `src/app/utils/` |
| **Pipes** | Format values (e.g., dates, text) | `src/app/pipes/` |
| **Guards** | Protect routes based on conditions | `src/app/guards/` |
| **Constants** | Static configurations | `src/app/constants/` |

---

### Additional Notes

- **Standalone Components**: Angular 18 no longer requires `NgModules`.
- **PrimeNG**: UI components are in `PrimeNgModule`, which should be imported where needed.
- **Lazy Loading**: Components can be loaded dynamically for performance (`*ngIf` or `appLazyLoad`).
- **Observables & RXJS**: Used for async state management in services (`BehaviorSubject`).



