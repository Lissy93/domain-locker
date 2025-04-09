---
slug: ssl  
index: 4  
title: SSL Certificates  
description: What SSL certificates are, how Domain Locker tracks them, and why it matters  
coverImage:  
---

### What is an SSL Certificate?

An **SSL certificate** is what keeps your website secure.

When you see that little padlock icon in your browser next to the URL — that means the website has a valid SSL certificate, and your connection is encrypted. It helps protect any data sent between the visitor and the website, like passwords or credit card details.

It also helps with trust — modern browsers now show scary warnings if a site doesn’t have one.

---

### How Domain Locker Tracks SSL

As soon as you add a domain to Domain Locker, we’ll automatically check if it has an SSL certificate. If it does, we’ll fetch the details and store them f  or you — no action needed.

We keep this data up to date, so if your certificate changes or is about to expire, you’ll know about it.

You can view all your SSL certificates at [assets → certs](/assets/certs), and see:

- The domain(s) it covers  
- Expiry date  
- Issuer (who issued it — like Let's Encrypt, Cloudflare, etc.)  
- Whether it’s valid right now  
- How long until it expires  
- If the certificate has changed since the last check

Clicking into a domain shows even more detail on its SSL status.

---

### Why is This Useful?

A few good reasons to keep an eye on your SSL certificates:

- **Avoid downtime** – If your certificate expires, your site may break or show a warning to users. We'll alert you before this happens.
- **Security** – Track who issued your certificate and spot if it’s been changed unexpectedly.
- **Trust** – Some phishing attacks involve swapping out certificates or misconfigured HTTPS — this helps spot those cases early.
- **Auditing** – If you run multiple sites, you can check they’re all using HTTPS and valid certs — all in one place.

---

### Expiry Reminders

SSL certs don't last forever — most are valid for 90 days or 1 year.

Let's Encrypt (which powers a huge chunk of the web) issues certificates that last 90 days. That means they need to be renewed regularly, often by an automated tool. If something goes wrong and it doesn't auto-renew, your site could suddenly stop working.

Domain Locker will warn you well before expiry, so you’ve got time to fix it.

---

### Best Practices

- Use **HTTPS** on all your sites — even ones without login forms.
- Set up **auto-renewal** if you're using a provider like Let's Encrypt or Cloudflare.
- Don’t mix secure and insecure content on a page (called “mixed content”) — browsers may block parts of the site.
- Keep your cert chain clean — ensure intermediate certificates are included where needed.
- Use a **trusted issuer** — all major browsers have a list of trusted certificate authorities. Don’t get yours from some random site.

---

### Quick Stats

- Over **80%** of websites now use HTTPS (SSL) by default  
- **Google penalises** sites without SSL in search rankings  
- The average user now expects the padlock to be there — especially on login pages, forms, or anything involving money

---

Domain Locker makes it easy to stay on top of all this. You don’t need to manually check expiry dates or run `openssl` commands — we’ll do the heavy lifting, and just show you the important stuff.
