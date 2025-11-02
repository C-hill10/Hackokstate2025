#!/usr/bin/env python3
"""
Example Python Sensor Client

This demonstrates how sensors can send updates to the sensor daemon HTTP server

Usage:
    python examples/sensor-client-python.py
"""

import requests
import json
import sys

# Configuration
SERVER_URL = 'http://localhost:3000'
API_KEY = None  # Set if authentication is enabled in sensor-config.json


def update_crowd_level(location_id, crowd_level):
    """
    Update crowd level for a location
    
    Args:
        location_id: Firestore document ID (string)
        crowd_level: Crowd level 0-100 (int)
    
    Returns:
        Response JSON as dict
    """
    url = f"{SERVER_URL}/api/update-crowd-level"
    
    payload = {
        "locationId": location_id,
        "crowdLevel": crowd_level
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Add API key if configured
    if API_KEY:
        payload["apiKey"] = API_KEY
        headers["X-API-Key"] = API_KEY
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"   Response: {e.response.text}")
        raise


def main():
    print("📡 Sensor Client Example (Python)")
    print("===============================\n")
    
    try:
        # Example 1: Update Kerr-Drummond to 45%
        print("Updating Kerr-Drummond crowd level to 45%...")
        result1 = update_crowd_level('kerr-drummond', 45)
        print(f"✅ Success: {json.dumps(result1, indent=2)}")
        
        # Wait a moment
        import time
        time.sleep(1)
        
        # Example 2: Update Student Union to 72%
        print("\nUpdating Student Union crowd level to 72%...")
        result2 = update_crowd_level('student-union', 72)
        print(f"✅ Success: {json.dumps(result2, indent=2)}")
        
        # Example 3: Try to update a non-existent location
        print("\nTrying to update non-existent location...")
        try:
            result3 = update_crowd_level('non-existent-location', 50)
            print(f"✅ Success: {json.dumps(result3, indent=2)}")
        except requests.exceptions.HTTPError as e:
            print(f"❌ Expected error: {e}")
        
        print("\n✅ All examples completed!")
        
    except Exception as error:
        print(f"❌ Error: {error}")
        sys.exit(1)


if __name__ == '__main__':
    main()

