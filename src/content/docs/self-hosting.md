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


Domain Locker is intended to be run with Docker, so you will need to have Docker and Docker Compose installed on your server.
You may also need a domain name and a valid SSL certificate for that domain.

---

## Deployment

- [With Docker](/about/self-hosting/deploying-with-docker-compose)
- [With Kubernetes](/about/self-hosting/deploying-with-kubernetes-helm-charts)
- [From Umbrel](/about/self-hosting/umbrel-os-app)
- [From Source](/about/self-hosting/deploying-from-source)

#### One-Liner

```
curl -fsSL https://install.domain-locker.com | bash
```

---

## Support

- [Debugging Docs](/about/developing/debugging)
- [Checking Logs](/about/developing/checking-logs)
- [3rd-party Docs](/about/developing/third-party-docs)

---

## Developing

- [Dev Setup](/about/developing)
- [Source Code](https://github.com/lissy93/domain-locker)

---

## See Also

- [Docker Best Practices](/about/developing/general-docker-advice)
- [Architecture Overview](/about/self-hosting/understanding-the-architecture)
- [Conditions for Public Instances](/about/self-hosting/guidelines-for-public-instance)




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
