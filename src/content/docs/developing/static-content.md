---
slug: static-content
title: Static Content
description: Adding documentation, articles or other static content
coverImage: 
---

Domain Locker has some static content (like the page you are viewing right now!), which is intended to provide useful info to the user.

This is consisted of markdown files, which are placed into `src/content/docs/`, and managed with Analog.js, Marked (for markdown parsing), and Prism.js (for syntax highlighting).

---

### Adding a New Doc to an Existing Category

1. Create a new `.md` file in the appropriate category folder:
    - For example, `src/content/docs/[category]/your-doc.md`.

2. Add the required frontmatter at the top of the file:
```yaml
---
slug: your-doc
title: Document Title
description: A short description of the document content
coverImage: (optional URL to cover image)
---
```

3. Write your content below the metadata in standard Markdown format.

4. It should automatically show up on the About page index, and be accessible via the sidebar.

---

### Creating a New Category

1. **Add a new page file** inside `src/app/pages/about/`, following this format: `src/app/pages/about/[category-name].[slug].page.ts`

2. Use the following template, replacing `"category"` with the correct name:

```typescript
import { injectContent, injectContentFiles } from '@analogjs/content';
import { Component } from '@angular/core';
import { DocsViewerComponent, DocAttributes } from '~/app/components/about-things/doc-viewer.component';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DocsViewerComponent],
  template: `<app-docs-viewer [doc$]="doc$" [allDocs]="files" [categoryName]="category" />`,
})
export default class DocsComponent {
  public category = 'category';
  readonly doc$ = injectContent<DocAttributes>({ param: 'slug', subdirectory: \`docs/\${this.category}\` });
  readonly files = injectContentFiles<DocAttributes>((file) => file.filename.includes(\`/\${this.category}/\`));
}
```

3. Create a directory under `src/content/docs/` for the new category and add markdown files inside as before. Don't forget the frontmatter in `---`!

---

### Linking to a Non-Markdown Page

If you need to manually add a link inside an existing category, just update: `src/app/pages/about/data/about-page-list.ts`.
This is not necessary for standard Markdown files.



