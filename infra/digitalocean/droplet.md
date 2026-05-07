# DigitalOcean App Droplet + Spaces + Container Registry — Provisioning Runbook

> Issue #31 — Task 0.14. This document covers the day-1 single-droplet topology for Move-B2B.
> The accompanying script `scripts/provision-droplet.sh` automates steps 3–5.

---

## Prerequisites

| Requirement | How to verify |
|---|---|
| DigitalOcean account with billing enabled | Log in at cloud.digitalocean.com |
| `doctl` CLI installed and authenticated | `doctl auth list` |
| SSH key uploaded to DO | `doctl compute ssh-key list` |
| `jq` installed | `jq --version` |
| Your public IP known | `curl -s ifconfig.me` |

### Install and authenticate doctl

```bash
# macOS
brew install doctl

# Authenticate (generates/pastes a Personal Access Token from DO dashboard)
doctl auth init
# Prompt: Enter your access token: <paste DO Personal Access Token (read+write)>

# Verify
doctl account get
```

---

## Provisioning order

> Matches `migration/04-INFRA-MIGRATION.md §6` exactly.

### Step 1 — Spaces bucket `move-staging`

Spaces is S3-compatible object storage. Create the bucket **in the same region as the Droplet** (NYC3 default) to avoid inter-region egress charges.

```bash
# Create bucket
doctl spaces bucket create move-staging --region nyc3

# Verify
doctl spaces bucket list
```

**Generate Spaces access keys** (DO Control Panel > Spaces > Manage Keys):

1. Go to https://cloud.digitalocean.com/spaces/keys
2. Click "Generate New Key"
3. Name: `move-staging-app`
4. Copy `Access Key` and `Secret Key` immediately — the secret is shown once

**Store keys in Rails credentials:**

```bash
EDITOR=vim bundle exec rails credentials:edit
```

```yaml
digitalocean:
  spaces_access_key: <SPACES_ACCESS_KEY>
  spaces_secret_key: <SPACES_SECRET_KEY>
  spaces_bucket: move-staging
  spaces_endpoint: https://nyc3.digitaloceanspaces.com
  spaces_region: nyc3
```

**Enable CDN** (optional but recommended for v1):

```bash
doctl spaces cdn create move-staging --ttl 3600
```

---

### Step 2 — Container Registry `move`

DigitalOcean Container Registry free tier: 500 MB storage, up to 5 private repositories. Sufficient for Kamal deploys.

```bash
# Create registry
doctl registry create move --subscription-tier basic

# Login (adds Docker credentials to ~/.docker/config.json)
doctl registry login

# Verify
doctl registry get
# Expected: registry.digitalocean.com/move
```

**Configure Kamal** to use this registry in `config/deploy.yml`:

```yaml
registry:
  server: registry.digitalocean.com
  username: <DO_PERSONAL_ACCESS_TOKEN>
  password:
    - KAMAL_REGISTRY_PASSWORD  # set in .env or GitHub secrets
```

---

### Step 3 — App Droplet

Ubuntu 24.04 LTS, **4 vCPU / 8 GB Premium AMD** ($48/mo), region NYC3. Colocates Puma + Sidekiq + Redis + Nginx + Vite static SPA for v1.

```bash
# Find your SSH key ID
doctl compute ssh-key list

# Create droplet
doctl compute droplet create move-staging-app \
  --size s-4vcpu-8gb-amd \
  --image ubuntu-24-04-x64 \
  --region nyc3 \
  --ssh-keys <KEY_ID> \
  --enable-monitoring \
  --user-data-file infra/digitalocean/scripts/cloud-init.yml \
  --wait

# Verify
doctl compute droplet list
```

**Size options and tradeoffs:**

| Size | vCPU | RAM | Storage | Price | Notes |
|---|---|---|---|---|---|
| `s-4vcpu-8gb-amd` | 4 | 8 GB | 160 GB SSD | $48/mo | **Recommended** — Premium AMD, NVMe |
| `s-4vcpu-8gb` | 4 | 8 GB | 160 GB SSD | $24/mo | Regular Intel — fine for first tenants |

---

### Step 4 — Reserved IP

A Reserved IP (formerly Floating IP) is the stable public IP that sits in front of the droplet. Cloudflare points at this IP. During scale-out (adding a second droplet), the Reserved IP can be reassigned without a DNS change.

```bash
# Create Reserved IP in same region
RESERVED_IP=$(doctl compute reserved-ip create --region nyc3 --output json | jq -r '.[0].ip')
echo "Reserved IP: $RESERVED_IP"

# Get droplet ID
DROPLET_ID=$(doctl compute droplet get move-staging-app --output json | jq -r '.[0].id')

# Assign Reserved IP to droplet
doctl compute reserved-ip-action assign "$RESERVED_IP" "$DROPLET_ID"

# Verify assignment
doctl compute reserved-ip get "$RESERVED_IP"
```

**Record this IP** — you will need it for:
- Cloudflare DNS A record (`staging.move-app.com → <RESERVED_IP>`)
- Firewall trusted-sources for Managed PostgreSQL
- `infra/staging.env` (non-secret reference)

---

### Step 5 — Firewall

Restrict inbound access: SSH from your IP only, HTTP/HTTPS from anywhere, Redis (6379) blocked from external access entirely (self only via loopback).

```bash
# Get your current public IP
DEV_IP=$(curl -s ifconfig.me)
echo "Your IP: $DEV_IP"

# Get droplet ID
DROPLET_ID=$(doctl compute droplet get move-staging-app --output json | jq -r '.[0].id')

# Create firewall
doctl compute firewall create move-staging-fw \
  --inbound-rules \
    "protocol:tcp,ports:22,sources:address:${DEV_IP}/32 \
     protocol:tcp,ports:80,sources:address:0.0.0.0/0,address:::/0 \
     protocol:tcp,ports:443,sources:address:0.0.0.0/0,address:::/0" \
  --outbound-rules \
    "protocol:tcp,ports:all,destinations:address:0.0.0.0/0,address:::/0 \
     protocol:udp,ports:all,destinations:address:0.0.0.0/0,address:::/0" \
  --droplet-ids "$DROPLET_ID"

# Verify
doctl compute firewall list
```

> **Note:** Redis (6379) is intentionally not exposed via the DO firewall. It binds to `127.0.0.1` only — see `cloud-init.yml`. If a CI/CD or monitoring agent needs Redis access, use an SSH tunnel, not a firewall rule.

---

### Step 6 — Initial SSH connection and base setup verification

The `cloud-init.yml` user-data script runs automatically on first boot and installs Docker, Nginx, Redis, and fail2ban. Wait ~3 minutes after droplet creation for cloud-init to finish, then verify:

```bash
# SSH into droplet via Reserved IP
ssh root@<RESERVED_IP>

# On the droplet — verify installed services
docker --version
nginx -v
redis-server --version
fail2ban-client version
systemctl is-active docker nginx redis-server fail2ban
```

**Expected output:**

```
Docker version 24.x.x, build ...
nginx version: nginx/1.24.x
Redis server v=7.x.x ...
Fail2Ban v1.x.x
active
active
active
active
```

**One-liner validation from your local machine:**

```bash
ssh root@<RESERVED_IP> 'docker --version && nginx -v && redis-server --version && fail2ban-client version'
```

---

## Cost summary (v1 staging)

| Resource | Spec | Monthly cost |
|---|---|---|
| App Droplet | 4 vCPU / 8 GB Premium AMD, NYC3 | $48 |
| Spaces bucket | 250 GB + 1 TB egress | $5 |
| Container Registry | Basic free tier (500 MB / 5 repos) | $0 |
| Reserved IP | NYC3 (free while assigned to a running droplet) | $0 |
| DO Monitoring | Built-in droplet metrics + alerts | $0 |
| **Total** | | **~$53/mo** |

> Full v1 stack including Managed PostgreSQL, Resend, Sentry: ~$90–115/mo. See `migration/04-INFRA-MIGRATION.md §2.2`.

---

## Scale triggers (when to split web/worker)

Per `migration/04-INFRA-MIGRATION.md §3.2`:

| Metric | Threshold | Action |
|---|---|---|
| Sidekiq queue `latency` p95 | > 60s sustained | Provision Worker Droplet (2 vCPU / 4 GB) |
| Puma response time p95 | > 500ms while Sidekiq backlog > 0 | Provision Worker Droplet |
| Droplet 5-min load average | > 3.5 sustained | Provision Worker Droplet |
| DO Monitoring disk usage | > 80% | Resize droplet volume or clean up |

When the split fires:
1. Provision Worker Droplet with same cloud-init (minus Nginx).
2. Move Sidekiq process there (update Kamal `config/deploy.yml`).
3. Swap self-hosted Redis for DO Managed Redis ($15/mo, 1 GB).
4. Redeploy via `kamal deploy`.

---

## Security checklist

- [ ] SSH key-only authentication (no password auth) — enforced by cloud-init (`PasswordAuthentication no` in sshd_config)
- [ ] DO Firewall applied to droplet: 22 (your IP only), 80/443 (anywhere), all other ports blocked inbound
- [ ] fail2ban installed and enabled (SSH brute-force protection, max 3 retries)
- [ ] ufw installed (secondary layer; cloud-init sets default-deny)
- [ ] Redis binds to 127.0.0.1 only (not exposed externally)
- [ ] Docker daemon socket not exposed over TCP
- [ ] DO Managed PostgreSQL "Trusted Sources" configured to allow only the droplet Reserved IP (+ your dev IP for migrations)
- [ ] Spaces bucket private by default; signed URLs (1h TTL) for avatar/content delivery
- [ ] Container Registry private; access via `doctl registry login` with scoped token
- [ ] Reserved IP documented in `infra/staging.env` (no secret content — just IP reference)
- [ ] Secrets stored in `Rails.application.credentials` only — never in repo or environment dump

---

## Next steps after provisioning

1. Record `RESERVED_IP` in `infra/staging.env` (issue #38 — Cloudflare DNS setup).
2. Configure Cloudflare DNS: `A staging.move-app.com → <RESERVED_IP>` (proxied).
3. Provision Managed PostgreSQL cluster and add droplet IP to trusted sources (issue #32).
4. Configure Rails credentials with Spaces keys, DB URL, Redis URL.
5. Run first Kamal deploy: `kamal setup && kamal deploy`.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| `doctl: error: ...` | Run `doctl auth list` to verify token is valid |
| SSH timeout | Check firewall — your IP may have changed; update firewall rule |
| cloud-init didn't run | `ssh root@<IP> 'cat /var/log/cloud-init-output.log'` |
| Docker not found | Cloud-init may still be running; wait 3 min and retry |
| Reserved IP not reachable | Check assignment: `doctl compute reserved-ip get <IP>` |
| Nginx 502 | Puma not started; check `systemctl status puma` and Kamal deploy logs |
