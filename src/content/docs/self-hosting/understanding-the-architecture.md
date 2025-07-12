---
slug: understanding-the-architecture
title: Self-Hosted Architecture
description: Overview of Domain Locker's architecture and components
noShowInContents: true
index: 7
coverImage: 
---

Self-hosted architecture is pretty simple; you have the pre-built app, served with Deno in one container, which then connects to Postgres in another container. The app includes some API endpoints which can be called to keep data updated, monitor domains and trigger notifications (via webhooks), so you might want a third container to manage crons to call these endpoints periodically.

<details>
<summary>How this differs from the managed instance?</summary>

This differs slightly from the managed instance, as self-hosted is designed to be standalone, and run in an easy docker-compose without being reliant upon external services.

Whereas the managed instance has dependencies on third-parties, which must be configured. You can switch the version at anytime, using the `DL_ENV_TYPE` environmental variable, which is set to `selfHosted` by default. (but note that you will need to configure the third-party platforms and services if you switch to managed). Either way, you can find the docs for all the services used [here](/about/developing/third-party-docs).

<div class="screenshots-wrap">
<img src="/articles/domain-locker-arch-self-hosted.svg" >
<img src="/articles/domain-locker-arch-managed.svg" >
</div>

</details>
