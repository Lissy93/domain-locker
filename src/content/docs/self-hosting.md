---
title: Self-Hosting Domain Locker
slug: self-hosting  
meta:
  - name: description
    content: About Page Description
  - property: og:title
    content: About
---

I have documented and open sourced Domain Locker for free. You can find the source on GitHub, at [lissy93/domain-locker](https://github.com/lissy93/domain-locker).

### ⚠️ Important Disclaimer
<blockquote class="warning">
The self-hosted edition comes with no warranty. There are no guarantees for functionality and maintaining, securing and managing the infrastructure will be your responsibility. The developer cannot be held liable for any damages or losses caused by the use of the self-hosted edition.
It is not intended to be publicly exposed, unless secured it behind a firewall, with correct access controls implemented.
</blockquote>

---

## Prerequisites

In order to self-host Domain Locker, you will need a server.
This can be anything from a low-powered SBC like a Raspberry Pi  to a dedicated VPS.


Domain Locker is intended to be run as a Docker stack. You will need to have Docker and Docker Compose installed on your server.
You may also need a domain name and a valid SSL certificate for that domain.

---

## Deployment

```
TODO
```
- Domain Locker is intended to be run in a container, so you'll need Docker [installed](https://docs.docker.com/engine/install/) on your host system.
- We have a Docker image published to [`lissy93/domain-locker`](https://hub.docker.com/r/lissy93/domain-locker).
You'll also need a Postgres database, such as the [`postgres:15-alpine`](https://hub.docker.com/_/postgres?tab=tags&name=15-alpine) container.
- When starting the container, bind `PORT` to `3000`. Then specify the Postgres environmental variables: `DL_PG_HOST`, `DL_PG_PORT`, `DL_PG_USER`, `DL_PG_PASSWORD` and `DL_PG_NAME`.
- As an example, you can view our [`docker-compose.yml`](https://github.com/Lissy93/domain-locker/blob/main/docker-compose.yml) file.

---

## Support

See: [Support: Self-Hosted](/about/support/self-hosted-support)

---

## Developing

See: [Developing Docs](/about/developing)

---

## Managing the Container

See our [Domain Locker Docker Guide](/about/developing/general-docker-advice)

---

## Architecture

Self-hosted architecture is pretty simple; you have the pre-built app, served with Deno in one container, which then connects to Postgres in another container. The app includes some API endpoints which can be called to keep data updated, monitor domains and trigger notifications (via webhooks), so you might want a third container to manage crons to call these endpoints periodically.

<details>
<summary>How this differs from the managed instance?</summary>

This differs slightly from the managed instance, as self-hosted is designed to be standalone, and run in a Docker stack. Whereas the managed instance has dependencies on external services. You can switch the version at anytime, using the `DL_ENV_TYPE` environmental variable, which is set to `selfHosted` by default. (but note that you will need to configure the third-party platforms and services if you switch to managed). Either way, you can find the docs for all the services used [here](/about/developing/third-party-docs).

<div class="screenshots-wrap">
<img src="/articles/domain-locker-arch-self-hosted.svg" >
<img src="/articles/domain-locker-arch-managed.svg" >
</div>

</details>


---

## Publishing a Public Instance

While you're free to do as you please on private self-hosted instances, if you intend to deploy a public instance of Domain Locker, there are some etiquette guidelines that we'd appreciate you try and follow.

#### Do
- ✅ Fork the repo (instead of copying it, or using our repo directly)
- ✅ Keep the original MIT license, and credit the original authors
- ✅ Take responsibility for securing your instance and protecting user data
- ✅ Make it clear to your users that your version is an independent fork and not affiliated with the original project
- ✅ Consider contributing back improvements, fixes, or features that could benefit the upstream project
- ✅ Have fun, and use Domain Locker for something cool!

#### Don't
- ❌ Don't charge for your service if you have deployed the code as-is (aka without substantial changes)
- ❌ Don't use our hosted APIs (they may be subject to change, rate limiting and auth)- run your own
- ❌ Don't expect unpaid support from the original authors for your own instance
- ❌ Don't misrepresent your fork as the official Domain Locker—your branding and domain should reflect that it's an independent instance
- ❌ Don't modify and redistribute under a more restrictive license—the MIT license ensures continued freedom to modify and share
- ❌ Don't use any of Domain Locker's code for illegal or unethical purposes
- ❌ And, pretty please - don't sue us


<style>
  .warning {
    background-color: var(--yellow-200);
    color: var(--yellow-800);
    border: 1px solid var(--yellow-600);
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin: 0.25rem 0 1rem 0;
    font-size: 0.8rem;
    line-height: 1rem;
    p {
      margin: 0.2rem 0 0 0;
    }
  }
.screenshots-wrap {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  img {
    height: 550px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    margin: 0;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  @media (max-width: 600px) {
  flex-direction: column;
  align-items: center;
    img {
      height: auto;
      width: 100%;
      max-height: 550px;
    }
}
}


</style>
