---
slug: dns  
index: 6  
title: DNS Records  
description: Understand what DNS records are, and how Domain Locker helps you track and manage them  
coverImage:  
---

### What is DNS?

**DNS** stands for *Domain Name System* — it’s what translates your domain name into something a computer understands, like an IP address.

Think of it like a phonebook for the internet. You type in `example.com`, and DNS tells your browser where to go.

Behind the scenes, your domain has a list of **DNS records** that define how it works — where to send web traffic, email, verification requests, and more.

---

### Common DNS Records

There are many different types of DNS records. Here are the most common ones you’ll come across:

- **A Record** – Maps your domain to an IPv4 address (e.g. `93.184.216.34`)
- **AAAA Record** – Like A, but for IPv6 addresses
- **CNAME** – Points your domain to another domain (often used for subdomains)
- **MX** – Tells the internet where to send your email
- **TXT** – Used for verification, security policies (like SPF, DKIM), and more
- **NS** – Lists the nameservers managing your DNS
- **SOA** – Technical metadata about your domain’s zone
- **PTR, SRV, CAA**, etc – Less common, but used in specific setups

Every domain will have slightly different records depending on what it's being used for.

---

### Why DNS Records Matter

DNS is often invisible until something goes wrong.

But keeping an eye on your DNS records is useful for:

- **Troubleshooting issues** – Is your domain pointing to the right place? Are email records set up properly?
- **Spotting changes** – A DNS change might indicate a migration, misconfiguration, or in rare cases, a hijack
- **Compliance and security** – Email security records like SPF, DKIM, and DMARC live here
- **Auditing** – Useful to see if everything’s set up correctly, especially across multiple domains

Even if you’re not managing DNS yourself, it’s helpful to know what records exist.

---

### How Domain Locker Helps

When you add a domain, Domain Locker automatically looks up all public DNS records and keeps them in sync.

We break them down into tabs so you can quickly explore:

- **TXT** – Includes security (SPF, DKIM), Google/Apple verification, and other metadata
- **NS** – Shows which DNS provider is managing the domain
- **MX** – Helps you check if email is configured and where it's delivered
- **CNAME** – Points used for redirects or services like GitHub Pages
- **Domains → NS / MX / TXT** – Flip the view to see all your domains and what records they each have

These views help you spot inconsistencies, missing records, or unusual changes at a glance.

---

### Where to View DNS Records

Head to [**/assets/dns**](/assets/dns) to view and filter your DNS records. You’ll find grouped tabs for different record types, and can click through for more detail.

We also show associated domains, so you can see which records are in use where.

---

### A Few DNS Tips

- **Don’t panic if some records are missing** — not every domain needs MX or TXT
- If you use a **website builder** (like Wix, Squarespace, etc.), they likely manage DNS for you
- **DNS changes can take time to propagate** — up to 48 hours globally
- If you spot a change you didn’t expect, check if someone updated the domain or hosting

---

DNS can be complex under the hood, but Domain Locker helps surface the important bits — so you always know what your domains are doing, without digging through your registrar or DNS provider dashboard.
