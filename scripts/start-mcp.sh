#!/bin/bash
# MCP Server Launcher - Isolates environment from Rovo Dev
cd /home/esel/Documents/atlantis
unset LD_LIBRARY_PATH
exec /usr/bin/node dist/index.js