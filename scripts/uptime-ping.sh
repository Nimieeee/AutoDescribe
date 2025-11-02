#!/bin/bash

# Uptime ping script for Render backend
# Add to crontab: */5 * * * * /path/to/uptime-ping.sh

RENDER_URL="https://your-render-app-name.onrender.com/health"
LOG_FILE="/tmp/render-uptime.log"

echo "$(date): Pinging $RENDER_URL" >> $LOG_FILE

if curl -f -s $RENDER_URL > /dev/null; then
    echo "$(date): ✅ Service is alive" >> $LOG_FILE
else
    echo "$(date): ❌ Service ping failed" >> $LOG_FILE
fi