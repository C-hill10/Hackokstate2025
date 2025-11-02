#!/usr/bin/env python3
"""
Example: Using SensorClient for a single sensor

This demonstrates how a sensor would use the SensorClient class
to send periodic crowd level updates.
"""

from SensorClient import SensorClient
import time

def main():
    # Initialize sensor for this location
    # Each sensor would have its own location_id
    sensor = SensorClient(
        location_id="caf-libro",
        project_id="hackokstate25"
        # api_key="your-api-key"  # Add if authentication is enabled
    )
    
    print(f"🔌 Sensor initialized for location: {sensor.location_id}")
    print(f"📡 Endpoint: {sensor.base_url}/api/update-crowd-level")
    
    # Simulate sensor readings
    crowd_levels = [35, 42, 38, 45, 52, 48]
    
    for level in crowd_levels:
        try:
            print(f"\n📊 Sending update: {level}%")
            result = sensor.send_update(level)
            
            if result.get('success'):
                print(f"   ✅ {result.get('message', 'Updated')}")
            else:
                print(f"   ❌ {result.get('error', 'Failed')}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Wait between readings (sensors would use actual timing)
        time.sleep(1)
    
    print("\n✅ Sensor demo completed!")


if __name__ == "__main__":
    main()

