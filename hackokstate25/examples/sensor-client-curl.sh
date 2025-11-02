#!/bin/bash
# Example cURL commands for sending sensor updates

SERVER_URL="http://localhost:3000"
API_KEY=""  # Add your API key here if authentication is enabled

# Example 1: Update Kerr-Drummond to 45%
echo "Updating Kerr-Drummond to 45%..."
curl -X POST "${SERVER_URL}/api/update-crowd-level" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "locationId": "kerr-drummond",
    "crowdLevel": 45
  }'

echo -e "\n\n"

# Example 2: Update Student Union to 72%
echo "Updating Student Union to 72%..."
curl -X POST "${SERVER_URL}/api/update-crowd-level" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "locationId": "student-union",
    "crowdLevel": 72
  }'

echo -e "\n\n"

# Example 3: Health check
echo "Health check..."
curl "${SERVER_URL}/health"

echo -e "\n\n"

# Example 4: Get API info
echo "API info..."
curl "${SERVER_URL}/api"

