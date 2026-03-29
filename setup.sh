#!/usr/bin/env bash
# ============================================================================
#  Campusphere - Smart Campus Management Platform
#  One-command setup & run script
#  Works on: Linux, macOS, Windows (Git Bash / WSL)
# ============================================================================

set -e

# Colors (safe for all terminals)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║        Campusphere Setup & Launch Script         ║${NC}"
  echo -e "${CYAN}${BOLD}║     Smart Campus Management Platform             ║${NC}"
  echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}${BOLD}[$1/$TOTAL_STEPS]${NC} $2"
}

print_success() {
  echo -e "    ${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "    ${YELLOW}!${NC} $1"
}

print_error() {
  echo -e "    ${RED}✗${NC} $1"
}

TOTAL_STEPS=7
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header

# ============================================================================
# Step 1: Check prerequisites
# ============================================================================
print_step 1 "Checking prerequisites..."

# Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    print_success "Node.js v$NODE_VERSION"
  else
    print_error "Node.js v18+ required (found v$NODE_VERSION)"
    exit 1
  fi
else
  print_error "Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# pnpm
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm -v)
  print_success "pnpm v$PNPM_VERSION"
else
  print_warning "pnpm not found. Installing..."
  npm install -g pnpm
  print_success "pnpm installed"
fi

# Docker
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
  print_success "Docker v$DOCKER_VERSION"
else
  print_error "Docker not found. Install from https://docs.docker.com/get-docker/"
  exit 1
fi

# Docker Compose (v2 built-in or standalone)
if docker compose version &> /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
  print_success "Docker Compose (v2 plugin)"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
  print_success "Docker Compose (standalone)"
else
  print_error "Docker Compose not found."
  exit 1
fi

echo ""

# ============================================================================
# Step 2: Install dependencies
# ============================================================================
print_step 2 "Installing dependencies..."

pnpm install --frozen-lockfile 2>/dev/null || pnpm install
print_success "All dependencies installed"
echo ""

# ============================================================================
# Step 3: Setup environment
# ============================================================================
print_step 3 "Setting up environment..."

if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env
  print_success "Created apps/backend/.env from .env.example"
else
  print_success "apps/backend/.env already exists"
fi

echo ""

# ============================================================================
# Step 4: Start Docker services (PostgreSQL + Redis)
# ============================================================================
print_step 4 "Starting Docker services..."

# Check if Docker daemon is running
if ! docker info &> /dev/null 2>&1; then
  print_error "Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

$COMPOSE_CMD up -d

# Wait for PostgreSQL to be ready
echo -n "    Waiting for PostgreSQL"
MAX_RETRIES=30
RETRY=0
until docker exec campusphere-postgres pg_isready -U campusphere -q 2>/dev/null; do
  echo -n "."
  sleep 1
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo ""
    print_error "PostgreSQL failed to start within ${MAX_RETRIES}s"
    exit 1
  fi
done
echo ""
print_success "PostgreSQL is ready (localhost:5432)"

# Wait for Redis
echo -n "    Waiting for Redis"
RETRY=0
until docker exec campusphere-redis redis-cli ping 2>/dev/null | grep -q PONG; do
  echo -n "."
  sleep 1
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo ""
    print_error "Redis failed to start within ${MAX_RETRIES}s"
    exit 1
  fi
done
echo ""
print_success "Redis is ready (localhost:6379)"
echo ""

# ============================================================================
# Step 5: Run database migrations
# ============================================================================
print_step 5 "Running database migrations..."

cd apps/backend
npx prisma migrate deploy 2>&1 | tail -3
print_success "Migrations applied"
cd "$SCRIPT_DIR"
echo ""

# ============================================================================
# Step 6: Seed database
# ============================================================================
print_step 6 "Seeding database..."

cd apps/backend

# Check if data already exists
STUDENT_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM student_profiles;" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

if [ "$STUDENT_COUNT" -gt "0" ] 2>/dev/null; then
  echo -n "    Database already has data ($STUDENT_COUNT students). Re-seed? [y/N]: "
  read -r RESEED
  if [[ "$RESEED" =~ ^[Yy]$ ]]; then
    npx prisma db seed 2>&1 | grep -E "✅|Seeded|LOGIN|╔|║|╚|Students|Staff|Events"
    print_success "Database re-seeded"
  else
    print_success "Keeping existing data"
  fi
else
  npx prisma db seed 2>&1 | grep -E "✅|Seeded|LOGIN|╔|║|╚|Students|Staff|Events"
  print_success "Database seeded with demo data"
fi

cd "$SCRIPT_DIR"
echo ""

# ============================================================================
# Step 7: Start development servers
# ============================================================================
print_step 7 "Starting development servers..."

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║            Campusphere is starting!              ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  Frontend:  ${NC}${CYAN}http://localhost:3000${NC}${GREEN}${BOLD}                ║${NC}"
echo -e "${GREEN}${BOLD}║  Backend:   ${NC}${CYAN}http://localhost:4000${NC}${GREEN}${BOLD}                ║${NC}"
echo -e "${GREEN}${BOLD}║  DB Studio: ${NC}${CYAN}npx prisma studio${NC}${GREEN}${BOLD} (run separately)  ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║  Login Credentials:                              ║${NC}"
echo -e "${GREEN}${BOLD}║  Admin:   ${NC}admin@campusphere.edu / admin123${GREEN}${BOLD}       ║${NC}"
echo -e "${GREEN}${BOLD}║  Warden:  ${NC}warden@campusphere.edu / warden123${GREEN}${BOLD}     ║${NC}"
echo -e "${GREEN}${BOLD}║  Staff:   ${NC}ramesh.yadav@campusphere.edu / staff123${GREEN}${BOLD} ║${NC}"
echo -e "${GREEN}${BOLD}║  Student: ${NC}cs2024001@student.edu / student123${GREEN}${BOLD}     ║${NC}"
echo -e "${GREEN}${BOLD}║                                                  ║${NC}"
echo -e "${GREEN}${BOLD}║  Press Ctrl+C to stop all servers                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Start both frontend and backend via Turborepo
pnpm dev
