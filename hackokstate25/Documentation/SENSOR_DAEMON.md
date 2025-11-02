# Sensor HTTP Server Documentation

## Overview

The Sensor HTTP Server is a backend service that provides an HTTP API endpoint for sensors to push crowd level updates to Firestore. Instead of polling sensors, sensors proactively send updates whenever they detect changes. This allows real-time crowd level updates without manual intervention from the Admin Panel.

## Features

- **HTTP API**: Sensors push updates via HTTP POST requests
- **Event-Driven**: Updates happen immediately when sensors send data (no polling delays)
- **API Key Authentication**: Optional security with configurable API keys
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Graceful error handling with detailed logging
- **Change Detection**: Only updates Firestore when crowd levels actually change
- **Firebase Admin SDK**: Secure server-side access using service account credentials
- **Health Check**: Built-in health check endpoint for monitoring

## Prerequisites

1. **Dependencies**:
   ```bash
   npm install firebase-admin express
   ```

2. **Service Account Key**:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `service-account-key.json` in the project root

3. **Configuration**:
   - Configure server settings in `sensor-config.json`

## Configuration

### sensor-config.json

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "security": {
    "apiKey": "change-me-to-a-secure-random-string",
    "requireApiKey": false
  },
  "firestore": {
    "batchSize": 10,
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 100
    }
  },
  "logging": {
    "level": "info",
    "file": null
  }
}
```

### Configuration Options

- **server.port**: Port number to listen on (default: 3000)
- **server.host**: Host address (default: "0.0.0.0" - all interfaces)
- **security.apiKey**: API key for authentication (generate a secure random string)
- **security.requireApiKey**: Enable/disable API key requirement (default: false)
- **firestore.batchSize**: Number of updates per batch (max 500)
- **firestore.rateLimit.windowMs**: Rate limit window in milliseconds (default: 60000 = 1 minute)
- **firestore.rateLimit.maxRequests**: Max requests per window (default: 100)
- **logging.level**: Logging verbosity (`debug`, `info`, `warn`, `error`)
- **logging.file**: Optional path to log file (null = console only)

## API Endpoints

### POST /api/update-crowd-level

Updates the crowd level for a specific location.

**Request Body:**
```json
{
  "locationId": "kerr-drummond",
  "crowdLevel": 45,
  "apiKey": "your-api-key"
}
```

**Parameters:**
- `locationId` (required, string): Firestore document ID for the location
- `crowdLevel` (required, number): Crowd level value (0-100)
- `apiKey` (optional, string): API key for authentication (if enabled)

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: your-api-key` (alternative to body apiKey, if authentication enabled)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Crowd level updated successfully",
  "previousLevel": 30,
  "newLevel": 45,
  "locationId": "kerr-drummond"
}
```

**No Change Response (200):**
```json
{
  "success": true,
  "message": "No update needed (value unchanged)",
  "level": 45,
  "locationId": "kerr-drummond"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request (missing/invalid fields)
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Location not found in Firestore
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "service": "sensor-daemon"
}
```

### GET /api

API information endpoint.

**Response:**
```json
{
  "service": "Sensor Crowd Level Update API",
  "version": "1.0.0",
  "endpoints": {
    "POST /api/update-crowd-level": {
      "description": "Update crowd level for a location",
      "body": {
        "locationId": "string (required) - Firestore document ID",
        "crowdLevel": "number (required) - 0-100",
        "apiKey": "string (optional) - Required if authentication enabled"
      }
    },
    "GET /health": {
      "description": "Health check endpoint"
    }
  }
}
```

## Usage

### Starting the Server

```bash
node sensor-daemon.js
```

The server will start and display:
```
🌐 Starting Sensor HTTP Server...
==========================

✅ Firebase Admin initialized
[2025-01-27T12:00:00.000Z] [INFO] Sensor HTTP Server started
[2025-01-27T12:00:00.000Z] [INFO] Listening on http://0.0.0.0:3000
[2025-01-27T12:00:00.000Z] [INFO] Health check: http://0.0.0.0:3000/health
[2025-01-27T12:00:00.000Z] [INFO] API info: http://0.0.0.0:3000/api
```

### Sending Sensor Updates

#### Using cURL

```bash
curl -X POST http://localhost:3000/api/update-crowd-level \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "kerr-drummond",
    "crowdLevel": 45
  }'
```

#### Using Node.js

See `examples/sensor-client-example.js` for a complete example.

```javascript
const http = require('http');

const data = JSON.stringify({
    locationId: 'kerr-drummond',
    crowdLevel: 45
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/update-crowd-level',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
        console.log(JSON.parse(responseData));
    });
});

req.write(data);
req.end();
```

#### Using Python

See `examples/sensor-client-python.py` for a complete example.

```python
import requests

response = requests.post(
    'http://localhost:3000/api/update-crowd-level',
    json={
        'locationId': 'kerr-drummond',
        'crowdLevel': 45
    }
)

print(response.json())
```

### Running as a Daemon

#### Windows (using PM2)

```bash
npm install -g pm2
pm2 start sensor-daemon.js --name sensor-daemon
pm2 logs sensor-daemon
pm2 stop sensor-daemon
```

#### Linux/Mac (using PM2)

Similar to Windows, or use systemd service files for native service management.

## Location ID Mapping

The `locationId` in API requests must match the Firestore document ID. Document IDs are typically the location name in lowercase with spaces/special characters replaced by hyphens.

**Examples:**
- `Kerr-Drummond` → `kerr-drummond`
- `Student Union` → `student-union`
- `Central Market Place` → `central-market-place`

To find your location IDs:
1. Check Firestore Console
2. Check Admin Panel (document IDs in the console)
3. Run the import script and check the console output

## Security

### API Key Authentication

To enable API key authentication:

1. **Generate a secure API key:**
   ```bash
   # On Linux/Mac
   openssl rand -hex 32
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update sensor-config.json:**
   ```json
   {
     "security": {
       "apiKey": "your-generated-secure-key-here",
       "requireApiKey": true
     }
   }
   ```

3. **Sensors must include the API key:**
   - In request body: `{ "apiKey": "your-key", ... }`
   - Or in header: `X-API-Key: your-key`

### Rate Limiting

The server implements rate limiting to prevent abuse:
- Default: 100 requests per minute per IP address
- Configure in `sensor-config.json` under `firestore.rateLimit`

### Production Recommendations

1. **Enable API key authentication** (`requireApiKey: true`)
2. **Use HTTPS** (set up reverse proxy with nginx/Apache)
3. **Restrict access** (firewall rules, VPN, etc.)
4. **Monitor logs** for suspicious activity
5. **Use environment variables** for sensitive configuration

## Troubleshooting

### "Location not found in Firestore"

- Verify the `locationId` matches the Firestore document ID exactly
- Check that locations have been imported to Firestore
- Run `node import-to-firestore.js` to import locations

### "service-account-key.json not found"

- Download service account key from Firebase Console
- Save it as `service-account-key.json` in the project root
- Ensure file permissions allow reading

### "Invalid or missing API key"

- Check that `apiKey` in request matches `security.apiKey` in config
- Verify `requireApiKey` is set correctly in config
- Check API key is sent in body or `X-API-Key` header

### "Rate limit exceeded"

- Too many requests from the same IP
- Increase `maxRequests` in config (if appropriate)
- Implement exponential backoff in sensor clients

### Server Won't Start

- Check port is not already in use
- Verify Firebase Admin initialization
- Check configuration file syntax

### Updates Not Appearing

- Check server logs for errors
- Verify location IDs are correct
- Check Firestore console to see if updates are being written
- Ensure React app is connected to same Firestore project

## Example Sensor Implementations

Complete example code is available in the `examples/` directory:

- **Node.js**: `examples/sensor-client-example.js`
- **Python**: `examples/sensor-client-python.py`
- **cURL/Shell**: `examples/sensor-client-curl.sh`

## Integration with Existing System

The HTTP server updates the same `crowdLevel` field that the Admin Panel uses:

- **Admin Panel**: Manual updates via `handleCrowdLevelChange`
- **Sensor HTTP Server**: Automatic updates from sensors via POST requests
- **Both**: Write to the same Firestore field, changes appear in real-time

The server also sets a `lastSensorUpdate` timestamp field to track when sensor updates occurred.

## Development

### Testing the API

1. Start the server: `node sensor-daemon.js`
2. Test health endpoint: `curl http://localhost:3000/health`
3. Test API info: `curl http://localhost:3000/api`
4. Send test update: `curl -X POST http://localhost:3000/api/update-crowd-level -H "Content-Type: application/json" -d '{"locationId":"kerr-drummond","crowdLevel":45}'`

### Monitoring

- Check server logs for update confirmations
- Monitor Firestore console for document changes
- Use `/health` endpoint for service monitoring
- Check rate limit status in logs

## Support

For issues or questions:
1. Check server logs (console or log file)
2. Verify configuration in `sensor-config.json`
3. Test API endpoints with cURL or example clients
4. Check Firestore console for document updates
5. Verify location IDs match Firestore document IDs
