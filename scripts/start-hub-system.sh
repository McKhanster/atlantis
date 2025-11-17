#!/bin/bash

################################################################################
# MCP Hub System Startup Script
#
# This script starts the complete MCP Hub system:
# 1. Hub server (core MCP hub)
# 2. Client (interactive CLI client)
# 3. Random agent (sample agent)
#
# Usage:
#   ./scripts/start-hub-system.sh [mode]
#
# Modes:
#   all       - Start hub, client, and agent (default)
#   hub       - Start only the hub
#   client    - Start only the client
#   agent     - Start only the agent
#   dev       - Development mode with rebuild on changes
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
HUB_DIR="src/server"
CLIENT_DIR="client/client"
AGENT_DIR="client/agent"
HUB_PORT=8000
LOG_DIR="logs"

# Parse command line arguments
MODE="${1:-all}"

# Helper functions
print_banner() {
  echo ""
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}║              🚀 MCP Hub System Startup                     ║${NC}"
  echo -e "${CYAN}║                                                            ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${CYAN}ℹ${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check if directory exists
check_directory() {
  local dir=$1
  local name=$2

  if [ ! -d "$dir" ]; then
    print_error "$name directory not found: $dir"
    return 1
  fi

  return 0
}

# Check if dependencies are installed
check_dependencies() {
  print_section "Checking Dependencies"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi
  print_success "Node.js $(node --version)"

  # Check npm
  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi
  print_success "npm $(npm --version)"

  # Check TypeScript
  if ! command -v tsc &> /dev/null; then
    print_warning "TypeScript compiler not found globally, will use local versions"
  else
    print_success "TypeScript $(tsc --version)"
  fi
}

# Build a component
build_component() {
  local dir=$1
  local name=$2

  print_info "Building $name..."

  cd "$dir"

  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies for $name..."
    npm install
  fi

  # Build
  npm run build

  if [ $? -eq 0 ]; then
    print_success "$name built successfully"
  else
    print_error "Failed to build $name"
    exit 1
  fi

  cd - > /dev/null
}

# Start hub server
start_hub() {
  print_section "Starting Hub Server"

  if ! check_directory "$HUB_DIR" "Hub"; then
    exit 1
  fi

  build_component "$HUB_DIR" "Hub Server"

  print_info "Starting hub on port $HUB_PORT..."
  cd "$HUB_DIR"

  # Create logs directory
  mkdir -p "../../$LOG_DIR"

  PORT=$HUB_PORT npm start &
  HUB_PID=$!

  cd - > /dev/null

  # Wait for hub to start
  print_info "Waiting for hub to start..."
  sleep 3

  if kill -0 $HUB_PID 2>/dev/null; then
    print_success "Hub started (PID: $HUB_PID)"
    echo $HUB_PID > /tmp/mcp-hub.pid
  else
    print_error "Hub failed to start"
    exit 1
  fi
}

# Start client
start_client() {
  print_section "Starting Client"

  if ! check_directory "$CLIENT_DIR" "Client"; then
    exit 1
  fi

  build_component "$CLIENT_DIR" "Client"

  print_info "Starting interactive client..."
  cd "$CLIENT_DIR"

  npm start &
  CLIENT_PID=$!

  cd - > /dev/null

  sleep 2

  if kill -0 $CLIENT_PID 2>/dev/null; then
    print_success "Client started (PID: $CLIENT_PID)"
    echo $CLIENT_PID > /tmp/mcp-client.pid
  else
    print_error "Client failed to start"
  fi
}

# Start agent
start_agent() {
  print_section "Starting Random Agent"

  if ! check_directory "$AGENT_DIR" "Agent"; then
    exit 1
  fi

  build_component "$AGENT_DIR" "Random Agent"

  print_info "Starting random agent..."
  cd "$AGENT_DIR"

  npm start &
  AGENT_PID=$!

  cd - > /dev/null

  sleep 2

  if kill -0 $AGENT_PID 2>/dev/null; then
    print_success "Agent started (PID: $AGENT_PID)"
    echo $AGENT_PID > /tmp/mcp-agent.pid
  else
    print_error "Agent failed to start"
  fi
}

# Stop all components
stop_all() {
  print_section "Stopping MCP Hub System"

  # Stop agent
  if [ -f /tmp/mcp-agent.pid ]; then
    AGENT_PID=$(cat /tmp/mcp-agent.pid)
    if kill -0 $AGENT_PID 2>/dev/null; then
      print_info "Stopping agent (PID: $AGENT_PID)..."
      kill $AGENT_PID
      rm /tmp/mcp-agent.pid
      print_success "Agent stopped"
    fi
  fi

  # Stop client
  if [ -f /tmp/mcp-client.pid ]; then
    CLIENT_PID=$(cat /tmp/mcp-client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
      print_info "Stopping client (PID: $CLIENT_PID)..."
      kill $CLIENT_PID
      rm /tmp/mcp-client.pid
      print_success "Client stopped"
    fi
  fi

  # Stop hub
  if [ -f /tmp/mcp-hub.pid ]; then
    HUB_PID=$(cat /tmp/mcp-hub.pid)
    if kill -0 $HUB_PID 2>/dev/null; then
      print_info "Stopping hub (PID: $HUB_PID)..."
      kill $HUB_PID
      rm /tmp/mcp-hub.pid
      print_success "Hub stopped"
    fi
  fi
}

# Show status
show_status() {
  print_section "System Status"

  # Check hub
  if [ -f /tmp/mcp-hub.pid ]; then
    HUB_PID=$(cat /tmp/mcp-hub.pid)
    if kill -0 $HUB_PID 2>/dev/null; then
      print_success "Hub is running (PID: $HUB_PID)"
    else
      print_error "Hub is not running (stale PID file)"
    fi
  else
    print_info "Hub is not running"
  fi

  # Check client
  if [ -f /tmp/mcp-client.pid ]; then
    CLIENT_PID=$(cat /tmp/mcp-client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
      print_success "Client is running (PID: $CLIENT_PID)"
    else
      print_error "Client is not running (stale PID file)"
    fi
  else
    print_info "Client is not running"
  fi

  # Check agent
  if [ -f /tmp/mcp-agent.pid ]; then
    AGENT_PID=$(cat /tmp/mcp-agent.pid)
    if kill -0 $AGENT_PID 2>/dev/null; then
      print_success "Agent is running (PID: $AGENT_PID)"
    else
      print_error "Agent is not running (stale PID file)"
    fi
  else
    print_info "Agent is not running"
  fi
}

# Main execution
main() {
  print_banner

  case "$MODE" in
    all)
      check_dependencies
      start_hub
      sleep 2
      start_agent
      sleep 2

      print_section "System Ready"
      print_success "MCP Hub System is running!"
      echo ""
      print_info "Hub URL: http://localhost:$HUB_PORT"
      print_info "Hub Health: http://localhost:$HUB_PORT/health"
      print_info "Hub Logs API: http://localhost:$HUB_PORT/logs"
      print_info "Hub Stats API: http://localhost:$HUB_PORT/logs/stats"
      echo ""
      print_info "MCP Endpoints:"
      print_info "  - Standard SSE: POST http://localhost:$HUB_PORT/sse"
      print_info "  - Custom Initialize: POST http://localhost:$HUB_PORT/mcp/initialize"
      print_info "  - Custom Tools: POST http://localhost:$HUB_PORT/mcp/tools/call"
      print_info "  - Custom SSE: GET http://localhost:$HUB_PORT/mcp/sse/:agentId"
      echo ""
      print_warning "Press Ctrl+C to stop all components"
      echo ""

      # Start client in foreground
      start_client

      # Wait for interrupt
      trap stop_all EXIT INT TERM
      wait
      ;;

    hub)
      check_dependencies
      start_hub
      trap stop_all EXIT INT TERM
      wait
      ;;

    client)
      check_dependencies
      start_client
      trap stop_all EXIT INT TERM
      wait
      ;;

    agent)
      check_dependencies
      start_agent
      trap stop_all EXIT INT TERM
      wait
      ;;

    stop)
      stop_all
      ;;

    status)
      show_status
      ;;

    *)
      echo "Usage: $0 {all|hub|client|agent|stop|status}"
      echo ""
      echo "Modes:"
      echo "  all     - Start hub, agent, and client (default)"
      echo "  hub     - Start only the hub"
      echo "  client  - Start only the client"
      echo "  agent   - Start only the agent"
      echo "  stop    - Stop all running components"
      echo "  status  - Show status of all components"
      exit 1
      ;;
  esac
}

# Run main
main
