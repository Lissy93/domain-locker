---
slug: debugging
title: Debugging Starter
description: Resolve issues in Domain Locker Self-Hosted
coverImage: 
index: 6
---

### Debugging

1. Confirm that you've correctly followed the setup, either in the [Developing Docs](/about/developing) or [Self-Hosting Docs](/about/self-hosting)
2. And ensure you are using the latest version of Domain Locker / Docker / Node, etc
3. Check the logs (in your terminal) for any obvious errors or warnings
4. If applicable, check the [Service Status](/advanced/status) for ongoing issues or maintenance
5. If the web app loads, but data does not work, then check:
  <br>A) The database connection, which can be tested at [`/advanced/database-connection`](/advanced/database-connection)
  <br>B) The backend/API using [`/advanced/diagnostic-actions`](/advanced/diagnostic-actions)
  <br>C) The client app's logs, at [`/advanced/error-logs`](/advanced/error-logs)
6. Using the info from the logs, deduce if it's:
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

### Debug Tools

We've taken the time to build out a suit of embedded debugging and diagnostic tools, built into the app, to make building features, fixing issues, and understanding the app easier for developers and users alike. These can be accessed via the [`/advanced`](/advanced) page.

1. **Log Viewer** - recent errors, build logs and guides for runtime logs
  <br>Path: [`/advanced/error-logs`](/advanced/error-logs)
2. **Service Status** - current status for frontend app, API, database, crons and third-party services. This also shows historical uptime and upcoming maintenance
  <br>Path: [`/advanced/status`](/advanced/status)
3. **Debug Tool** - client, server, database and user info. This data should be included when raising a bug report
  <br>Path: [`/advanced/debug-info`](/advanced/debug-info)
4. **Diagnostic Actions** - execute scripts to fix, test and debug common issues relating to data updates and your user configuration
  <br>Path: [`/advanced/diagnostic-actions`](/advanced/diagnostic-actions)
5. **Database Connections** - view and edit which database the app is connected to, and test the connection
  <br>Path: [`/advanced/database-connection`](/advanced/database-connection)
6. **Admin Links** - links to all third-party services, settings and dashboards, as well as docs and sources for developers
  <br>Path: [`/advanced/admin-links`](/advanced/admin-links)

---

<a href="/advanced/debug-info" style="text-align:center; display:block; font-size: 0.8rem; max-width: 500px; margin: 0 auto;">
<img src="https://i.postimg.cc/sx9j7ZJ7/Screenshot-2025-03-12-021627.png" alt="Domain Locker Debug Tool" title="Domain Locker Debug Tool" />
<span>Screenshot of Debug Tool</span>
</a>
