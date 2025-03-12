---
slug: general-docker-advice
title: Docker Tips
description: Securing, monitoring, backing up and generally maintaining your container
noShowInContents: true
coverImage: 
---

## Providing Assets

Although not mandatory, you might want to provide a few assets to your Domain Locker instance. This is simple to do using [Docker Volumes](https://docs.docker.com/storage/volumes/), which let you share files or directories between your host system and the container.

For example:

```bash
-v ~/my-custom-logo.svg:/app/src/assets/logo.svg
```

The path on the left is on your host, and the path on the right is inside the container. Any files you need for Domain Locker can be mounted in this way.

---

## Running Commands

If Domain Locker is running in a Docker container, pass commands like so:

```bash
docker exec -it [container-id] bash
```

Find the container ID by running:

```bash
docker ps
```

You can also enter the container shell directly:

```bash
docker exec -it [container-id] /bin/sh
```

For self-hosted (non-Docker) setups, simply SSH into your server and run commands there.

---

## Healthchecks

By default, Domain Locker may configure healthchecks to verify the app is running. If you’re using Docker, you can customize how often these checks run with the `--health-interval` option. Check health status by running:

```bash
docker inspect --format "{{json .State.Health }}" [container-id]
```

Use the `--no-healthcheck` flag if you’d like to disable these checks altogether.

To automatically restart containers marked as unhealthy, consider [Autoheal](https://hub.docker.com/r/willfarrell/autoheal/). For instance:

```bash
docker run -d \
    --name autoheal \
    --restart=always \
    -e AUTOHEAL_CONTAINER_LABEL=all \
    -v /var/run/docker.sock:/var/run/docker.sock \
    willfarrell/autoheal
```

---

## Logs and Performance

### Container Logs

View logs for a running container:

```bash
docker logs [container-id]
```

Add `--follow` to stream logs in real time. For more details, see the [Docker Logging Docs](https://docs.docker.com/config/containers/logging/).

### Container Performance

Check resource usage:

```bash
docker stats
```

For a graphical view of container performance, [cAdvisor](https://github.com/google/cadvisor) or [Portainer](https://github.com/portainer/portainer) might help.

### Advanced Logging and Monitoring

You can integrate Domain Locker logs with [Prometheus](https://prometheus.io/) for deeper analytics, or forward logs to external services like Splunk, Sematext, or Grafana Loki.

---

## Auto-Starting at System Boot

Use Docker’s [restart policies](https://docs.docker.com/engine/reference/run/#restart-policies---restart) to restart containers on system boot or after a crash. For example:

```bash
docker run --restart=always -d [image-name]
```

For Podman, see its [systemd integration docs](https://podman.io/blogs/2018/09/13/systemd.html).

---

## Updating

Domain Locker is under active development. To get the latest features, occasionally update your instance.

### Updating Docker Container

1. Pull the latest image:
   ```bash
   docker pull domain-locker:latest
   ```
2. Stop and remove the existing container:
   ```bash
   docker stop [container-id]
   docker rm [container-id]
   ```
3. Spin up a new container:
   ```bash
   docker run [params] domain-locker:latest
   ```

### Automatic Docker Updates

[Watchtower](https://github.com/containrrr/watchtower) can automatically pull new images and replace your old container:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower
```

---

## Backing Up

### Backing Up Containers

A container can be backed up by:

```bash
docker commit [container-id] my-backup
docker save -o ~/locker-backup.tar my-backup
```

This only saves container layers, not volumes.

### Backing Up Volumes

If you store data in Docker volumes, you can back them up manually:

```bash
docker run --rm \
  -v domain_locker_data:/volume \
  -v /tmp:/backup alpine \
  tar -cjf /backup/locker_volume.tar.bz2 -C /volume ./
```

Or use a tool like [offen/docker-volume-backup](https://github.com/offen/docker-volume-backup) for automated S3 backups.

---

## Scheduling

To schedule tasks (like backups, updates, or logs) in Docker, [ofelia](https://github.com/mcuadros/ofelia) is a handy container-based cron solution:

```yaml
version: '3'
services:
  ofelia:
    image: mcuadros/ofelia:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    # define your jobs here
```

---

## SSL Certificates

If your instance is public-facing, enable HTTPS:

### Auto-SSL with NGINX Proxy Manager

Set up a proxy host, select “Request a new SSL certificate,” and follow the prompts. [Let’s Encrypt](https://letsencrypt.org/) is free and easy.

### Self-Signed

Generate or obtain a certificate, then pass it into your container:

```bash
docker run -d \
  -p 443:443 \
  -v ~/locker-privkey.key:/etc/ssl/certs/locker.key:ro \
  -v ~/locker-cert.crt:/etc/ssl/certs/locker.crt:ro \
  domain-locker:latest
```

---

## Authentication

Domain Locker supports multiple authentication methods, including integrated solutions with external providers (e.g., OAuth) or internal user management. Refer to the official docs or environment variables to configure your chosen auth system.

---

## Managing with Compose

When multiple containers are involved (e.g., a database, Domain Locker, a reverse proxy), [docker-compose](https://docs.docker.com/compose/) simplifies management. For instance:

```yaml
version: "3.8"
services:
  domain-locker:
    container_name: domain-locker
    image: domain-locker:latest
    volumes:
      - ./locker-config.yml:/app/configs/main-config.yml
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Then just run:

```bash
docker compose up -d
```

---

## Passing in Environmental Variables

Domain Locker uses environment variables for configuration. With docker-compose, define them under `environment`:

```yaml
environment:
  - DL_ENV_TYPE=managed
  - DL_PG_HOST=postgres-db
```

You can also place them in a `.env` file:

```bash
DL_ENV_TYPE=managed
DL_PG_HOST=postgres-db
```

---

## Setting Headers

If you’re hosting Domain Locker behind a reverse proxy (NGINX, Traefik, etc.), ensure the correct headers are set for cross-domain requests (CORS). For NGINX, for example:

```text
location / {
  add_header Access-Control-Allow-Origin *;
}
```

Replace `*` with your actual domain for production.

---

## Remote Access

- **WireGuard**: A lightweight VPN solution for remote access.
- **Reverse SSH Tunnel**: Initiate SSH from inside your network to a remote server.
- **Tunneling Tools**: [Ngrok](https://ngrok.com/), [Inlets](https://inlets.dev), or [Local Tunnel](https://localtunnel.me/) provide instant secure tunnels to your local instance.

---

## Custom Domain

### Using DNS

Create a DNS A record pointing `locker.example.com` to your server’s IP. For local networks, set a DNS entry or edit `/etc/hosts`:

```bash
192.168.0.2 locker.local
```

### Using NGINX

```text
server {
  listen 80;
  server_name domain-locker.mydomain.com;

  location / {
    proxy_pass http://localhost:3000;
  }
}
```

---

## Container Security

Keep Docker updated, run containers with least privilege, and set resource quotas. For more specific guidance, see [Docker’s Security Docs](https://docs.docker.com/engine/security/).

---

## Web Server Configuration

> This section only applies if you’re **not** using Docker and want to run Domain Locker behind your own server.

Domain Locker is a Node.js app that, once built, serves static content plus API routes. You can host it with NGINX, Apache, or Caddy. Make sure to configure your reverse proxy and environment variables accordingly.

---

## Running a Modified Version of the App

If you need to customize Domain Locker:

1. **Fork** the GitHub repo.
2. **Install dependencies**:
   ```bash
   yarn
   ```
3. **Develop**:
   ```bash
   yarn dev
   ```
4. **Build**:
   ```bash
   yarn build
   ```
5. Deploy the contents of `./dist` using your container or web server.

---

## Building your Own Container

1. **Clone** Domain Locker’s repository.
2. **Build** the image:
   ```bash
   docker build -t domain-locker .
   ```
3. **Run**:
   ```bash
   docker run -p 3000:3000 domain-locker
   ```
4. If desired, **push** to a container registry:
   ```bash
   docker push ghcr.io/YOUR_USERNAME/domain-locker:latest
   ```


