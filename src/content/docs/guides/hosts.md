---
slug: hosts  
index: 5
title: Hosts
description: Learn what a host is, how Domain Locker tracks them, and why it matters
coverImage:  
---

# Understanding Hosts

When you visit a website—like yourcompany.com—your computer doesn’t go directly to that domain name. Instead, it first needs to figure out the IP address of the server that’s actually hosting the site. That IP address belongs to a *host*.

## So, what exactly is a host?

A **host** is the server (or group of servers) that a domain points to. It’s where your website’s files, apps, emails, or services live. When someone types in your domain name, DNS records tell their browser which host to connect to.

In simple terms:  
**Domain = name**  
**Host = physical location / server behind it**

### Why should I care about hosts?

- **Security**: Knowing where your domains point helps you avoid hijacking or misconfiguration
- **Reliability**: Some hosts are known for being faster, safer, or more stable than others
- **Compliance**: You might need to know if your services are hosted in a particular country (e.g. GDPR, UK-only, etc)
- **Auditing**: Great for keeping an eye on vendors or tracking usage across teams or clients

---

## How Domain Locker helps

Domain Locker automatically fetches host information when you add a domain. It does this by looking up the domain’s IP address and mapping it to known hosting providers.

From there, we help you keep track of:

- **ISP (Internet Service Provider)** – the company behind the IP address
- **IP Address** – where the domain actually points to
- **Organisation** – often the parent company or cloud provider (like AWS or Cloudflare)
- **Country** – where the host is physically based
- **Domain Count** – how many of your domains point to this host

We update this info regularly in the background, so if a domain starts pointing somewhere else (e.g. a different host or region), you’ll know about it.

---

## Use cases

- Want to know how many of your domains rely on Cloudflare, Microsoft, or Google?
- Curious which providers your dev team is actually using?
- Checking if a recent change moved one of your domains to the wrong place?
- Need to review vendors or infrastructure before a big project?

All of that becomes much easier when your host data is centralised, visualised, and kept up to date.

---

📍 You'll find all this under [Assets → Hosts](/assets/hosts) in your Domain Locker dashboard.


![domain locker hosts screenshot](https://storage.googleapis.com/as93-screenshots/domain-locker/hosts.png)
