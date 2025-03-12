---
slug: debugging
title: Debugging Starter
description: Resolve issues in Domain Locker Self-Hosted
coverImage: 
---

### Debugging

1. Confirm that you've correctly followed the setup, either in the [Developing Docs](/about/developing) or [Self-Hosting Docs](/about/self-hosting)
2. And ensure you are using the latest version of Domain Locker / Docker / Node, etc
3. Check the logs (in your terminal) for any obvious errors or warnings
4. In the app, navigate to `/advanced/debug-info` to view system status and logs
5. Using the info from the logs, deduce if it's:
  <br>A) A domain locker issue, in which case check the source code [here](https://github.com/lissy93/domain-locker)
  <br>B) A third-party issue, in which case check the [Third-Party Docs](/about/developing/third-party-docs)

---

### Reporting

If you're unable to resolve the issue, and you believe it is a bug with Domain Locker,
you can report it to us via our [GitHub Issues](https://github.com/lissy93/domain-locker/issues) page. (Note that there is no guarantee of a response or fix)

Please include the following information in your report:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any error messages or warnings
- Your system information (OS, Browser, etc)
- Any other relevant information
- Screenshots or videos if possible
- If you're a Pro user or sponsor, please mention that in your report

**Important**: In your report, you must also include the output of the environment details, error log and diagnostic report which you can find on the
 [`/advanced/debug-info`](https://domain-locker.com/advanced/debug-info) page.

---

<a href="/advanced/debug-info" style="text-align:center; display:block; font-size: 0.8rem; max-width: 500px; margin: 0 auto;">
<img src="https://i.postimg.cc/sx9j7ZJ7/Screenshot-2025-03-12-021627.png" alt="Domain Locker Debug Tool" title="Domain Locker Debug Tool" />
<span>Screenshot of Debug Tool</span>
</a>
