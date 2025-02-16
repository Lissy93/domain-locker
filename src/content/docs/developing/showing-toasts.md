---
slug: toast-messages
title: Toast Messages
description: Showing pop-up toast notifications to users
coverImage: 
---

We have a global messaging service (in [`messaging.service.ts`](https://github.com/Lissy93/domain-locker/blob/main/src/app/services/messaging.service.ts)) that displays toast notifications using PrimeNG's `ToastModule`. This ensures config is consistent, and also that messages can persist even after page navigation.

### How to Use

1. **Import the `GlobalMessageService`.**
2. **Inject it into the component.**
3. **Call the appropriate method to show a toast.**

---

### Example: Basic Success Message

```diff
  import { Component } from '@angular/core';
+ import { GlobalMessageService } from '~/app/services/messaging.service';

  @Component({
    standalone: true,
    selector: 'app-example',
    template: \`
      <button (click)="showMessage()">Show Message</button>
    \`,
  })
  export class ExampleComponent {
+   constructor(private messagingService: GlobalMessageService) {}

+   showMessage() {
+     this.messagingService.showSuccess(
+       'Action Successful',
+       'Your request has been completed successfully.'
+     );
+   }
  }
```

---

### Other Message Types

You can also display different types of messages:

```typescript
this.messagingService.showInfo('Information', 'This is an informational message.');
this.messagingService.showWarn('Warning', 'Please check your input.');
this.messagingService.showError('Error', 'Something went wrong.');
```

---

### Customizing Toast Messages

If you need more customization, use `showMessage`:

```typescript
this.messagingService.showMessage({
  severity: 'success',
  summary: 'Success',
  detail: 'Domain deleted successfully',
}, { position: 'bottom-left', life: 5000 });
```

Available options:
- **`position`**: Controls the toast position (`top-right`, `bottom-left`, etc.).
- **`life`**: Sets how long the message remains visible (in milliseconds).

---

### Notes

- **Persistence**: Since the service is global, messages remain visible even when navigating between pages.
- **Performance**: Messages are stored in a `BehaviorSubject` and automatically cleared when replaced.
- **Usage Recommendation**: Use `showSuccess`, `showInfo`, `showWarn`, and `showError` for common cases, and `showMessage` for advanced customization.

