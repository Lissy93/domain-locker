---
slug: subdomains  
index: 7  
title: Subdomains  
description: What subdomains are, why they exist, and how Domain Locker helps you keep track  
coverImage:  
---

### What is a Subdomain?

A **subdomain** is a prefix added to your main domain to separate parts of your site or services — like `blog.example.com`, `shop.example.com`, or `login.example.com`.

In simple terms, it's like having different rooms in the same house. You’ve got `example.com` as your main domain, and subdomains to handle different purposes.

Some common examples:

- `www.` – the most well-known subdomain
- `mail.` – often used for webmail or email services
- `api.` – for backend APIs
- `dev.` or `staging.` – for test environments
- `m.` – for mobile-specific sites

Subdomains can point to the same server as your main domain, or something entirely different — they’re very flexible.

---

### Why Subdomains Matter

Subdomains let you separate parts of your site or infrastructure without needing a new domain name. They're commonly used by:

- Businesses running multiple services from one domain
- Developers testing new features (e.g. `staging.example.com`)
- Marketing teams launching temporary campaigns (`promo.example.com`)
- SaaS platforms giving users a custom subdomain (`yourname.service.com`)

While they’re handy, subdomains can also be easy to forget — especially if you’ve got a large team, multiple environments, or older projects still hanging around.

---

### How Domain Locker Tracks Subdomains

When you add a domain to Domain Locker, we’ll scan its DNS records and automatically detect active subdomains.

We check for common DNS types (A, AAAA, CNAME, etc) and keep this list up to date as things change.

You can view all subdomains from [**/assets/subdomains**](/assets/subdomains), where you’ll see:

- The full subdomain (e.g. `api.example.com`)
- Its DNS record type and value
- Any associated IP address or alias
- Which domain it belongs to

We’ll also flag subdomains with unusual patterns or overlapping records, which might be worth reviewing.

---

### Why This is Useful

Keeping tabs on subdomains helps with:

- **Security** – Unused or forgotten subdomains can become a target for subdomain takeover attacks
- **Organisation** – Know exactly which subdomains exist and what they’re for
- **Debugging** – Catch misconfigured records or unexpected redirects
- **Auditing** – Useful for internal reviews or when handing over projects

If you’ve ever inherited a domain from someone else, this view can be a lifesaver for understanding what’s going on.

---

### Good to Know

- Subdomains can be created at your DNS provider — no need to register them separately
- You can nest subdomains too (`dev.api.example.com`), though it’s best to keep things simple
- Search engines treat subdomains like separate websites in many cases
- If you're using services like GitHub Pages, Netlify, or Cloudflare Pages, you’ll often point subdomains via a CNAME record

---

Domain Locker keeps your subdomains automatically updated, so you’ll never be caught off guard by rogue or forgotten records. You can easily export the list, set up alerts for changes, or dig deeper into each one — all without touching your DNS dashboard.
