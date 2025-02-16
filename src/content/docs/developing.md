---
slug: developing
title: Development Setup
description: My First Post Description
coverImage: https://images.unsplash.com/photo-1493612276216-ee3925520721?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=464&q=80
---

## App Setup

### Get the Code

```
git clone git@github.com:Lissy93/domain-locker.git
cd domain-locker
npm install
```

### Start Development Server

```
npm run dev
```

### Run Tests

```
npm run test
```

### Build for Production

```
npm run build
```

Or to build for a particular platform, use the `build:vercel`, `build:netlify` commands.

---

## Database Setup

You'll need either a Posthres database, or a Supabase instance.
Follow the instructions below, to deploy an instance with the required schema and config, and then set the environmental variables in your domain locker app.

### Option 1) Postgres

With Postgres, follow the setup instructions in [Postgres Setup](/about/developing/postgres-setup),
then init the schema and start the DB with `./db/setup-postgres.sh`
(to import the [`schema.sql`](https://github.com/Lissy93/domain-locker/blob/main/db/schema.sql)).
You'll then just need to pass the following env vars to the app, so it can connect to your Postgres instance.

```
DL_PG_HOST='localhost'
DL_PG_PORT='5432'
DL_PG_USER='postgres'
DL_PG_PASSWORD='supersecret'
DL_PG_NAME='domain_locker'
```

### Option 2) Supabase

Deploy a new Supabase instance, apply the config from [dl-edge-config](https://github.com/Lissy93/dl-edge-config) and set the following environmental variables:

```
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xx
```

<details>
<summary>Schema</summary>

The schema can be downloaded from [here](https://github.com/Lissy93/domain-locker/blob/main/db/schema.sql).

Below is a high-level class-diagram.

![Schema](https://gist.github.com/user-attachments/assets/4ddf35df-dad6-4820-b667-6417ef406277)

</details>


---

## Architecture

### Self-Hosted Version

The self-hosted app is very simple, and consists of 3 containers:
- The app itself (client, server and optional webhooks for notifications)
- A Postgres database (to store your data)
- A cron service (optional, to keep domains up-to-date and trigger notifications)

<img width="360" src="https://gist.github.com/user-attachments/assets/9d0769f3-a09a-4cb1-94f3-91c83ff9ab75" />

### Managed Version

This differs slightly from the managed instance, which has the same core web app, but is reliant upon some non-free services for extra features and security.

Below is a high-level architecture diagram to show what I mean.

<img src="https://gist.github.com/user-attachments/assets/81e19b5a-5a69-4790-9b73-95450fc70904" />


Why the difference? Running a SaaS app requires some additional components/layers in order to offer users the best possible experience. For example, the managed app also needs to cover the following areas:
- Multiple environments, automated CI/CD
- An ORM between client and server
- Feature flagging and role-based features
- Domain name, DNS, Captcha, WAF, cache, SSL
- Billing and user plan management
- Authentication, authorization and SSO
- STMP mailer service, and Twilio SMS
- Notification channels for WhatsApp, SMS, Signal, etc
- Backups for database, config, logs, assets
- Observability for bugs, payments, availability, traces
- User support for queries, billing, bugs, feedback, etc

<!-- ![architecture](https://gist.github.com/user-attachments/assets/00b8b790-ab9d-49f8-ae88-a5dca4120e73) -->
