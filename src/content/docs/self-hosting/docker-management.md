---
slug: general-docker-advice
title: Docker Tips
description: Securing, monitoring, backing up and generally maintaining your container
noShowInContents: true
index: 7
coverImage: 
---


## Providing Assets

Mount static assets using volumes:

```bash
-v ~/my-custom-logo.svg:/app/src/assets/logo.svg
```

---

## Running Commands

Use `exec` to run commands inside a container:

```bash
docker exec -it domain-locker-app /bin/sh
```

To view running containers:

```bash
docker ps
```

---

## Healthchecks

Domain Locker defines healthchecks for the app and database. View health status:

```bash
docker inspect --format '{{json .State.Health}}' domain-locker-app
```

Use Autoheal to restart unhealthy containers:

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

### Logs

```bash
docker logs domain-locker-app --follow
```

### Stats

```bash
docker stats
```

Use [cAdvisor](https://github.com/google/cadvisor), [Prometheus](https://prometheus.io/), or [Grafana](https://grafana.com/) for container metrics.

---

## Auto-Start at Boot

All containers use `restart: unless-stopped` to start after reboot or crash.

---

## Updating

### Manual Update

```bash
docker compose pull

docker compose up -d
```

### Auto Updates

Use [Watchtower](https://containrrr.dev/watchtower/):

```bash
docker run -d \
  --name watchtower \
  --restart=unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower
```

---

## Backing Up

Back up the Postgres data volume:

```bash
docker run --rm \
  -v domain_locker_postgres_data:/volume \
  -v /tmp:/backup alpine \
  tar -cjf /backup/pgdata.tar.bz2 -C /volume .
```

Automate with cron or use [offen/docker-volume-backup](https://github.com/offen/docker-volume-backup) for scheduled backups.

And store backups offsite using rclone, restic, or S3-compatible services.

---

## Secrets Management

Avoid hardcoding secrets in `docker-compose.yml`. Use a `.env` file:

```bash
DL_PG_PASSWORD=strongpassword
DL_JWT_SECRET=random-long-token
```

Restrict `.env` file permissions to prevent leaks:

```bash
chmod 600 .env
```

For production, consider Docker Secrets or Kubernetes Secrets.

---

## Authentication

Domain Locker supports Supabase Auth. Enable RLS and secure JWT handling. Set `DL_JWT_SECRET` and use HTTPS in production.

---

## Remote Access

Use secure tools for access:

* [Tailscale](https://tailscale.com/) for mesh VPN
* [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) for public URLs
* Never expose Postgres directly to the internet

---

## SSL Certificates

Use a reverse proxy with automatic HTTPS:

### With Traefik

Labels:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.domainlocker.rule=Host(`locker.example.com`)"
  - "traefik.http.routers.domainlocker.entrypoints=https"
  - "traefik.http.routers.domainlocker.tls=true"
  - "traefik.http.services.domainlocker.loadbalancer.server.port=3000"
```

Ensure `acme` and a `certResolver` are configured in Traefik.

### With Caddy

```text
locker.example.com {
  reverse_proxy localhost:3000
}
```

Caddy will handle certs via Let's Encrypt automatically.

---

## Custom Domain

Set an A or CNAME record pointing to your server.

Use the domain in your proxy config (e.g. Traefik or Caddy).

Optionally edit `/etc/hosts` for local testing:

```bash
127.0.0.1 locker.local
```

---

## Monitoring

Recommended tools:

* [GlitchTip](https://glitchtip.com/) for error reporting
* [Uptime Kuma](https://github.com/louislam/uptime-kuma) for uptime
* [Grafana + Prometheus](https://grafana.com/oss/grafana/) for metrics
* [Loki](https://grafana.com/oss/loki/) for logs
* [Docker Scout](https://docs.docker.com/scout/) for image security insights

---

## Metrics and Observability

Expose metrics for dashboards and alerting:

* Add Prometheus exporter sidecars
* Log to file, and ship to Grafana Loki or ELK stack
* Consider OpenTelemetry if integrating with external tools

---

## Compose Management

### Starting

```bash
docker compose up -d
```

### Stopping

```bash
docker compose down
```

Use `--env-file` to override env vars:

```bash
docker compose --env-file .env.production up -d
```

---

## Kubernetes Setup (Optional)

Use Helm for deploys. Define:

* Separate deployments for app, db, and updater
* Use ConfigMaps for config and Secrets for sensitive values
* Ingress controller (e.g. Traefik or NGINX) with TLS enabled
* PersistentVolumeClaim for Postgres storage
* HorizontalPodAutoscaler for load-based scaling

---

## Running a Modified Version

1. Clone the repo
2. Install dependencies:

```bash
yarn install
```

3. Build:

```bash
yarn build
```

4. Build Docker image:

```bash
docker build -t domain-locker .
```

5. Run locally:

```bash
docker run -p 3000:3000 domain-locker
```

---

## CI/CD Recommendations

* Use GitHub Actions or GitLab CI to build and push Docker images
* Pin image versions in production
* Run vulnerability scans with Trivy or Snyk
* Publish images to DockerHub and GHCR

---

## Security Best Practices

* Never run containers as root
* Set user with `USER appuser`
* Use read-only file systems where possible
* Keep your base images minimal (e.g. Alpine)
* Limit exposed ports
* Enable logging and monitoring
* Regularly rotate secrets

---

## Helpful Tools

* **Portainer** – GUI for container management
* **Lazydocker** – Terminal UI for Docker
* **Watchtower** – Auto-updates
* **Uptime Kuma** – Status monitoring
* **pgAdmin / Postico** – Database browsing
* **Snyk / Trivy** – Image scanning
* **Caddy** – Simple TLS reverse proxy


