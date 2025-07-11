---
slug: deploying-from-source
title: Deploy from Source
description: Building the app manually from source code
index: 5
coverImage: 
---

## The App Setup

#### 1. Get the code

```bash
git clone https://github.com/your-org/domain-locker.git
cd domain-locker

```

#### 2. Install dependencies

```bash
corepack enable
yarn install --immutable
```

#### 3. Configure the environment

Create a `.env` file in the root of the project.
Here you'll add the environment variables needed to configure build preferences, and the database connection.
Be sure these match your database setup (see next section, below).


```bash
touch .env
```

```bash
# Database connection
DL_PG_HOST=localhost
DL_PG_PORT=5432
DL_PG_USER=postgres
DL_PG_PASSWORD=your-password
DL_PG_NAME=domain_locker

# Build + Runtime
DL_ENV_TYPE=selfHosted
NITRO_PRESET=node_server
```

#### 4. Build the app

```bash
yarn build
```

#### 5. Start the app

```bash
node dist/analog/server/index.mjs
```

#### 6. Access the app
Visit `http://localhost:3000` in your browser to access the app.

---

## The Database Setup

The app needs a database to store its data.
You can either use a Postgres database or a Supabase instance. Postgres is significantly easier to set up on self-hosted environments.

1. [Postgres Setup](/about/developing/postgres-setup)
2. [Supabase Setup](/about/developing/supabase-setup)

During development, you can skip the database setup, and connect to our hosted dev db instance, by using [these environment variables](https://github.com/Lissy93/domain-locker/blob/main/.env.sample). This is NOT suitable for production.
