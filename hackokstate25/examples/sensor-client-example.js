/**
 * Example Sensor Client Code
 * 
 * This demonstrates how sensors can send updates to the sensor daemon HTTP server
 * 
 * Usage:
 *   node examples/sensor-client-example.js
 */

const http = require('http');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const API_KEY = null; // Set if authentication is enabled in sensor-config.json

// Example: Update crowd level for a location
async function updateCrowdLevel(locationId, crowdLevel) {
    const payload = {
        locationId: locationId,
        crowdLevel: crowdLevel
    };

    // Add API key if configured (in body)
    if (API_KEY) {
        payload.apiKey = API_KEY;
    }

    const data = JSON.stringify(payload);

    const url = new URL(SERVER_URL);
    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: '/api/update-crowd-level',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    // If using header-based API key
    if (API_KEY) {
        options.headers['X-API-Key'] = API_KEY;
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`Server error (${res.statusCode}): ${json.error || responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Example usage
async function main() {
    console.log('📡 Sensor Client Example');
    console.log('========================\n');

    try {
        // Example 1: Update Kerr-Drummond to 45%
        console.log('Updating Kerr-Drummond crowd level to 45%...');
        const result1 = await updateCrowdLevel('kerr-drummond', 45);
        console.log('✅ Success:', result1);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Example 2: Update Student Union to 72%
        console.log('\nUpdating Student Union crowd level to 72%...');
        const result2 = await updateCrowdLevel('student-union', 72);
        console.log('✅ Success:', result2);

        // Example 3: Try to update a non-existent location
        console.log('\nTrying to update non-existent location...');
        try {
            await updateCrowdLevel('non-existent-location', 50);
        } catch (error) {
            // This is expected
            console.log('❌ Expected error:', error.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { updateCrowdLevel };

