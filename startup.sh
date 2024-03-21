#!/bin/bash
# Load environment variables
set -a
source /usr/src/app/.env.production
set +a

# Start your application
exec yarn dev
