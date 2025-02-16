---
slug: lazy-loading
title: Lazy Loading
description: Defer loading components until they become visible in the viewport
coverImage: 
---

To improve performance on pages with many components, making many requests, we can defer the loading of certain components until they become visible in the viewport. This reduces the initial page load time and ensures only necessary components are mounted.

This is managed with the [`lazy.directive.ts`](https://github.com/Lissy93/domain-locker/blob/main/src/app/utils/lazy.directive.ts).

### How It Works

The `appLazyLoad` directive observes an element and triggers an event when at least **10% of it is visible**. Once triggered, it disconnects the observer to prevent unnecessary checks.

---

### How to Use

1. **Import the `LazyLoadDirective`** in your component.
2. **Use an `*ngIf` condition** to delay mounting the component.
3. **Place an empty `<div>`** with `appLazyLoad` to detect when the user scrolls past it.

---

### Step 1: Import the Directive

```diff-typescript
+ import { LazyLoadDirective } from '@/app/utils/lazy.directive';

  @Component({
    standalone: true,
    selector: 'app-domain-details',
+   imports: [LazyLoadDirective],
    templateUrl: './domain-details.page.html',
  })
  export class DomainDetailsPage {
+   shouldMountHistory = false;

+   onHistoryVisible(): void {
+     this.shouldMountHistory = true;
+   }
  }
```

---

### Step 2: Use in HTML

```html
<app-domain-updates *ngIf="shouldMountHistory; else historyWaiting" [domainName]="name"></app-domain-updates>

<!-- Lazy load trigger -->
<div appLazyLoad (visible)="onHistoryVisible()"></div>

<ng-template #historyWaiting>
  <p-progressSpinner class="flex mx-auto" ariaLabel="loading" />
</ng-template>
```

--- 

### How It Works

- The `<div appLazyLoad>` acts as a trigger.
- When it enters the viewport, `onHistoryVisible()` is called.
- The `shouldMountHistory` flag switches to `true`, causing `<app-domain-updates>` to render.
- Until then, a loading spinner (`p-progressSpinner`) is shown.

---

### Notes

- **Performance**: This is useful for expensive components like charts, maps, or large tables.
- **Customization**: The threshold (`0.1`) in the directive can be adjusted to trigger sooner or later.
- **Memory Optimization**: The observer disconnects automatically after the component loads.

