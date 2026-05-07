#!/usr/bin/env bash
set -euo pipefail

# Provisions DO App Droplet + Reserved IP + Firewall + Spaces + Registry for Move-B2B.
#
# Prerequisites:
#   - doctl installed and authenticated (`doctl auth init`)
#   - jq installed (`brew install jq` or `apt install jq`)
#   - SSH_KEY_ID env var set (run: `doctl compute ssh-key list` to find your key ID)
#   - DEV_IP env var set to your public IP for SSH whitelisting
#
# Usage:
#   SSH_KEY_ID=12345678 DEV_IP=1.2.3.4 ./infra/digitalocean/scripts/provision-droplet.sh
#
# Optional env vars (all have defaults):
#   DO_REGION       — DigitalOcean region slug (default: nyc3)
#   DROPLET_NAME    — Droplet hostname (default: move-staging-app)
#   DROPLET_SIZE    — Droplet size slug (default: s-4vcpu-8gb-amd)
#   SPACES_BUCKET   — Spaces bucket name (default: move-staging)
#   REGISTRY_NAME   — Container Registry name (default: move)
#   FIREWALL_NAME   — Firewall name (default: move-staging-fw)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

REGION="${DO_REGION:-nyc3}"
DROPLET_NAME="${DROPLET_NAME:-move-staging-app}"
DROPLET_SIZE="${DROPLET_SIZE:-s-4vcpu-8gb-amd}"
SPACES_BUCKET="${SPACES_BUCKET:-move-staging}"
REGISTRY_NAME="${REGISTRY_NAME:-move}"
FIREWALL_NAME="${FIREWALL_NAME:-move-staging-fw}"

SSH_KEY_ID="${SSH_KEY_ID:?Set SSH_KEY_ID — run: doctl compute ssh-key list}"
DEV_IP="${DEV_IP:?Set DEV_IP to your public IP for SSH whitelisting (run: curl -s ifconfig.me)}"

# Resolve path to cloud-init relative to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLOUD_INIT_FILE="$SCRIPT_DIR/cloud-init.yml"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
warn()    { echo "[WARN]  $*"; }
die()     { echo "[ERROR] $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' not found — install it before continuing"
}

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------

require_cmd doctl
require_cmd jq
require_cmd curl

info "Checking doctl authentication..."
doctl account get >/dev/null 2>&1 || die "doctl is not authenticated — run: doctl auth init"
success "doctl authenticated"

[[ -f "$CLOUD_INIT_FILE" ]] || die "cloud-init file not found at $CLOUD_INIT_FILE"

info "Region:       $REGION"
info "Droplet name: $DROPLET_NAME"
info "Droplet size: $DROPLET_SIZE"
info "SSH key ID:   $SSH_KEY_ID"
info "Dev IP:       $DEV_IP"
echo ""

# ---------------------------------------------------------------------------
# Step 1 — Spaces bucket
# ---------------------------------------------------------------------------

info "Step 1/5 — Creating Spaces bucket '$SPACES_BUCKET' in region $REGION..."
if doctl spaces bucket list 2>/dev/null | grep -q "$SPACES_BUCKET"; then
  warn "Spaces bucket '$SPACES_BUCKET' already exists — skipping creation"
else
  doctl spaces bucket create "$SPACES_BUCKET" --region "$REGION"
  success "Spaces bucket '$SPACES_BUCKET' created"
fi

echo ""
echo "  ACTION REQUIRED: Generate Spaces access keys in DO Control Panel"
echo "  URL: https://cloud.digitalocean.com/spaces/keys"
echo "  Store them in Rails credentials:"
echo "    digitalocean:"
echo "      spaces_access_key: <KEY>"
echo "      spaces_secret_key: <SECRET>"
echo "      spaces_bucket: $SPACES_BUCKET"
echo "      spaces_endpoint: https://${REGION}.digitaloceanspaces.com"
echo "      spaces_region: $REGION"
echo ""

# ---------------------------------------------------------------------------
# Step 2 — Container Registry
# ---------------------------------------------------------------------------

info "Step 2/5 — Creating Container Registry '$REGISTRY_NAME'..."
if doctl registry get 2>/dev/null | grep -q "$REGISTRY_NAME"; then
  warn "Container Registry '$REGISTRY_NAME' already exists — skipping creation"
else
  doctl registry create "$REGISTRY_NAME" --subscription-tier basic
  success "Container Registry 'registry.digitalocean.com/$REGISTRY_NAME' created"
fi

# ---------------------------------------------------------------------------
# Step 3 — Droplet
# ---------------------------------------------------------------------------

info "Step 3/5 — Creating Droplet '$DROPLET_NAME'..."
if doctl compute droplet list --output json 2>/dev/null | jq -e ".[] | select(.name==\"$DROPLET_NAME\")" >/dev/null; then
  warn "Droplet '$DROPLET_NAME' already exists — skipping creation"
else
  doctl compute droplet create "$DROPLET_NAME" \
    --size "$DROPLET_SIZE" \
    --image ubuntu-24-04-x64 \
    --region "$REGION" \
    --ssh-keys "$SSH_KEY_ID" \
    --enable-monitoring \
    --user-data-file "$CLOUD_INIT_FILE" \
    --wait
  success "Droplet '$DROPLET_NAME' created"
fi

DROPLET_ID=$(doctl compute droplet get "$DROPLET_NAME" --output json | jq -r '.[0].id')
DROPLET_IP=$(doctl compute droplet get "$DROPLET_NAME" --output json | jq -r '.[0].networks.v4[] | select(.type=="public") | .ip_address')
info "Droplet ID: $DROPLET_ID"
info "Droplet ephemeral IP: $DROPLET_IP"

# ---------------------------------------------------------------------------
# Step 4 — Reserved IP
# ---------------------------------------------------------------------------

info "Step 4/5 — Creating Reserved IP..."
RESERVED_IP=$(doctl compute reserved-ip create --region "$REGION" --output json | jq -r '.[0].ip')
info "Reserved IP: $RESERVED_IP"

info "Assigning Reserved IP $RESERVED_IP to Droplet $DROPLET_ID..."
doctl compute reserved-ip-action assign "$RESERVED_IP" "$DROPLET_ID"
success "Reserved IP $RESERVED_IP assigned to Droplet $DROPLET_NAME"

# ---------------------------------------------------------------------------
# Step 5 — Firewall
# ---------------------------------------------------------------------------

info "Step 5/5 — Creating firewall '$FIREWALL_NAME'..."
if doctl compute firewall list --output json 2>/dev/null | jq -e ".[] | select(.name==\"$FIREWALL_NAME\")" >/dev/null; then
  warn "Firewall '$FIREWALL_NAME' already exists — skipping creation"
else
  doctl compute firewall create "$FIREWALL_NAME" \
    --inbound-rules \
      "protocol:tcp,ports:22,sources:address:${DEV_IP}/32 protocol:tcp,ports:80,sources:address:0.0.0.0/0,address:::/0 protocol:tcp,ports:443,sources:address:0.0.0.0/0,address:::/0" \
    --outbound-rules \
      "protocol:tcp,ports:all,destinations:address:0.0.0.0/0,address:::/0 protocol:udp,ports:all,destinations:address:0.0.0.0/0,address:::/0" \
    --droplet-ids "$DROPLET_ID"
  success "Firewall '$FIREWALL_NAME' created and applied"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "================================================================"
echo " Provisioning complete"
echo "================================================================"
echo ""
echo "  Droplet:      $DROPLET_NAME ($DROPLET_SIZE) in $REGION"
echo "  Droplet ID:   $DROPLET_ID"
echo "  Reserved IP:  $RESERVED_IP   <-- use this in Cloudflare DNS"
echo "  Spaces:       $SPACES_BUCKET ($REGION)"
echo "  Registry:     registry.digitalocean.com/$REGISTRY_NAME"
echo "  Firewall:     $FIREWALL_NAME (SSH from $DEV_IP, HTTP/HTTPS from anywhere)"
echo ""
echo "Next steps:"
echo "  1. Set Cloudflare DNS: A staging.move-app.com -> $RESERVED_IP (proxied)"
echo "  2. Add $RESERVED_IP to DO Managed PostgreSQL trusted sources"
echo "  3. Record reserved IP in infra/staging.env"
echo "  4. Wait ~3 min for cloud-init, then verify:"
echo "     ssh root@$RESERVED_IP 'docker --version && nginx -v && redis-server --version'"
echo "  5. Run Kamal deploy: kamal setup && kamal deploy"
echo ""
echo "See infra/digitalocean/droplet.md for full post-provisioning checklist."
