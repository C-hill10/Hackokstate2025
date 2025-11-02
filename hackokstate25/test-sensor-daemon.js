/**
 * Test script for sensor daemon
 * Starts server, waits, then tests endpoints
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing Sensor Daemon');
console.log('========================\n');

// Start the server
console.log('1️⃣ Starting sensor daemon server...');
const server = spawn('node', ['sensor-daemon.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
});

let serverOutput = '';
server.stdout.on('data', (data) => {
    serverOutput += data.toString();
    process.stdout.write(data);
});

server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
});

// Wait for server to start
setTimeout(async () => {
    console.log('\n2️⃣ Testing endpoints...\n');

    // Test 1: Health check
    console.log('📊 Test 1: Health Check');
    try {
        const healthResponse = await makeRequest('GET', '/health');
        console.log('✅ Health Check:', JSON.stringify(healthResponse, null, 2));
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
    }

    // Test 2: API info
    console.log('\n📊 Test 2: API Info');
    try {
        const apiResponse = await makeRequest('GET', '/api');
        console.log('✅ API Info:', JSON.stringify(apiResponse, null, 2));
    } catch (error) {
        console.log('❌ API Info Failed:', error.message);
    }

    // Test 3: Update crowd level
    console.log('\n📊 Test 3: Update Crowd Level');
    try {
        const updateResponse = await makeRequest('POST', '/api/update-crowd-level', {
            locationId: 'kerr-drummond',
            crowdLevel: 45
        });
        console.log('✅ Update Success:', JSON.stringify(updateResponse, null, 2));
    } catch (error) {
        console.log('❌ Update Failed:', error.message);
    }

    // Test 4: Invalid location
    console.log('\n📊 Test 4: Invalid Location');
    try {
        const invalidResponse = await makeRequest('POST', '/api/update-crowd-level', {
            locationId: 'non-existent-location',
            crowdLevel: 50
        });
        console.log('Response:', JSON.stringify(invalidResponse, null, 2));
    } catch (error) {
        console.log('❌ Expected error:', error.message);
    }

    // Test 5: Invalid crowd level
    console.log('\n📊 Test 5: Invalid Crowd Level (should be 0-100)');
    try {
        const invalidLevelResponse = await makeRequest('POST', '/api/update-crowd-level', {
            locationId: 'kerr-drummond',
            crowdLevel: 150
        });
        console.log('Response:', JSON.stringify(invalidLevelResponse, null, 2));
    } catch (error) {
        console.log('❌ Expected error:', error.message);
    }

    console.log('\n✅ All tests completed!');
    console.log('\n🛑 Stopping server...');
    server.kill();
    process.exit(0);

}, 5000); // Wait 5 seconds for server to start

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

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
                        reject(new Error(`HTTP ${res.statusCode}: ${json.error || responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Parse error: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    server.kill();
    process.exit(0);
});

