---
slug: ips  
index: 3  
title: IP Addresses  
description: Understand what IP addresses are, how we track them, and why they matter  
coverImage:  
---

### What is an IP Address?

An **IP address** is a bit like a postal address for your website — it tells the internet where to find it.

When someone types your domain (e.g. `example.com`) into their browser, that name is translated into an IP address behind the scenes. That IP address points to the server where your website lives.

There are two types of IP address:

- **IPv4** – The older format, looks like `192.0.2.1`  
- **IPv6** – A newer format, designed to allow for more addresses. Looks like `2001:0db8:85a3:0000:0000:8a2e:0370:7334`

Both serve the same purpose, but IPv6 is gradually replacing IPv4 as the internet grows. Some domains have both — and that's perfectly normal.

Why the switch to IPv6? Because IPv4 addresses are running out. There are only around **4.3 billion** of them in total, and many have already been allocated. That’s why IPv6 exists — with enough addresses to give **every grain of sand** on Earth its own IP (no joke).

---

### How Domain Locker Tracks IPs

When you add a domain, Domain Locker automatically checks its DNS records and fetches the current **A** (IPv4) and **AAAA** (IPv6) records. These are saved and kept up to date over time.

You don’t need to add or configure anything — we’ll do this for you in the background. It’s all based on public DNS data.

You can view all of your IP data under [**/assets/ips**](/assets/ips), split across four tabs:

- **IPv4** – Lists each IPv4 address once, with all domains that point to it
- **IPv6** – Same, but for IPv6 addresses
- **Domains IPv4** – Each of your domains, showing its associated IPv4 addresses
- **Domains IPv6** – Each domain’s IPv6 addresses (if any)

---

### Why is this Useful?

Knowing which IP addresses your domains point to can help with:

- **Troubleshooting** – If your site is down, you can check whether the IP has changed or if the DNS is pointing somewhere unexpected
- **Security** – Keep an eye out for sudden IP changes, which can sometimes be a sign of a hijack or misconfiguration
- **Server Management** – If you’re self-hosting, it’s good to see which domains are using your server’s IP(s)
- **Organisation** – Quickly see if you’ve got domains scattered across different providers or CDNs

---

### IP Monitoring Tips

- **CDN/Proxy Services** (like Cloudflare, Fastly, Netlify) often rotate IP addresses regularly. If you’re using one, it's advisable not to enable IP change notifications on Domain Locker (unless you want a lot of noise).
- If you **host your own server**, tracking IP changes can be especially useful. If your public IP changes unexpectedly, it might break your site.
- Use [reverse DNS lookups](https://www.nslookup.io/) to see what other domains are pointing to the same IP, which is occasionally handy for debugging or research.
- Not every domain will have an IPv6 address, and that's okay. IPv4 is still dominant, but it's a good idea to support both when possible.

---

Domain Locker keeps all this data automatically updated in the background, so you always know where your domains are pointing — even if you didn’t set it up yourself.

Want to get notified if an IP changes? Just enable the "IP Change" alert on the domain page (only recommended if your domain uses a static IP).

---

### View your IP Address Portfolio

You can view all your IP addresses, sorted either by IP or Domain, by navigating to [assets → ips](/assets/ips)

![](https://storage.googleapis.com/as93-screenshots/domain-locker/Screenshot%202025-04-08%20at%2020.14.21.png)

![](https://storage.googleapis.com/as93-screenshots/domain-locker/Screenshot%202025-04-08%20at%2020.14.26.png)
