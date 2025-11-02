# Firebase Cloud Functions - Sensor API

This directory contains the Firebase Cloud Function that provides the sensor API endpoint for updating crowd levels.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Set environment variables (optional):**
   
   If you want to enable API key authentication, set these in Firebase Console:
   - Go to Firebase Console > Functions > Configuration
   - Add environment variables:
     - `API_KEY`: Your secure API key
     - `REQUIRE_API_KEY`: Set to `"true"` to enable authentication (default: `"false"`)

   Or use Firebase CLI:
   ```bash
   firebase functions:secrets:set API_KEY
   firebase functions:secrets:set REQUIRE_API_KEY
   ```

## Local Development

To test functions locally:

```bash
# Install Firebase Tools CLI
npm install -g firebase-tools

# Start Firebase emulators
firebase emulators:start

# The function will be available at:
# http://localhost:5001/your-project-id/us-central1/api
```

## Deployment

Functions are automatically deployed when you run:

```bash
firebase deploy
```

This deploys both hosting and functions together.

## API Endpoints

Once deployed, the function is accessible at:

- **POST** `https://your-project-id.web.app/api/update-crowd-level`
- **GET** `https://your-project-id.web.app/health`
- **GET** `https://your-project-id.web.app/api`

### Example Request

```bash
curl -X POST https://your-project-id.web.app/api/update-crowd-level \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "kerr-drummond",
    "crowdLevel": 75
  }'
```

## Configuration

The function uses environment variables for configuration:
- `API_KEY`: API key for authentication (optional)
- `REQUIRE_API_KEY`: Whether to require API key (default: false)

These can be set in Firebase Console under Functions > Configuration, or using the Firebase CLI.

## Rate Limiting

The function includes built-in rate limiting:
- 100 requests per minute per IP address
- Resets automatically after the time window

