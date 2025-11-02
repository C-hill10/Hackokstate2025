"""
Simple Sensor Client for Crowd Level Updates

A lightweight class designed for sensors to send crowd level updates
for a single location to the Firebase Functions endpoint.

Usage:
    from SensorClient import SensorClient
    
    # Initialize sensor for a specific location
    sensor = SensorClient(
        location_id="kerr-drummond",
        project_id="hackokstate25",
        api_key="your-api-key"  # Optional
    )
    
    # Send crowd level update
    sensor.send_update(45)
"""

import requests
import time
from typing import Optional


class SensorClient:
    """
    Simple client for a sensor to update crowd levels for a single location
    
    Attributes:
        location_id: Firestore document ID for this sensor's location
        project_id: Firebase project ID
        api_key: Optional API key for authentication
        base_url: Base URL for the Firebase Functions endpoint
    """
    
    def __init__(
        self,
        location_id: str,
        project_id: str = "hackokstate25",
        api_key: Optional[str] = None,
        region: str = "us-central1"
    ):
        """
        Initialize sensor client for a specific location
        
        Args:
            location_id: Firestore document ID (e.g., "kerr-drummond")
            project_id: Firebase project ID
            api_key: Optional API key for authentication
            region: Firebase Functions region
        """
        self.location_id = location_id
        self.project_id = project_id
        self.api_key = api_key
        self.base_url = f"https://hackokstate25.web.app"
    
    def send_update(self, crowd_level: float, retry: bool = True) -> dict:
        """
        Send crowd level update for this sensor's location
        
        Args:
            crowd_level: Crowd level 0-100 (float or int)
            retry: Whether to retry once on failure (default: True)
        
        Returns:
            Response dictionary with success status
            
        Raises:
            ValueError: If crowd_level is invalid
            requests.exceptions.RequestException: On request failure
            
        Example:
            >>> sensor = SensorClient("kerr-drummond")
            >>> result = sensor.send_update(45.5)
            >>> print(result['message'])
            'Crowd level updated successfully'
        """
        # Validate crowd level
        if not isinstance(crowd_level, (int, float)):
            raise ValueError(f"crowd_level must be a number, got {type(crowd_level)}")
        
        if crowd_level < 0 or crowd_level > 100:
            raise ValueError(f"crowd_level must be between 0 and 100, got {crowd_level}")
        
        # Prepare request
        url = f"{self.base_url}/updateCrowdLevel"
        
        payload = {
            "locationId": self.location_id,
            "crowdLevel": float(crowd_level)
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided
        if self.api_key:
            headers["x-api-key"] = self.api_key
            payload["apiKey"] = self.api_key
        
        # Make request with optional retry
        max_attempts = 2 if retry else 1
        
        for attempt in range(max_attempts):
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                if attempt < max_attempts - 1:
                    # Wait before retry
                    time.sleep(0.5)
                    continue
                # Last attempt failed
                raise
    
    def health_check(self) -> dict:
        """
        Check if the API is reachable
        
        Returns:
            Health check response dictionary
        """
        url = f"{self.base_url}/health"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    # Example usage
    print("🔌 Sensor Client Example")
    print("=" * 50)
    
    # Initialize sensor for Kerr-Drummond location
    sensor = SensorClient(
        location_id="kerr-drummond",
        project_id="hackokstate25"
        # api_key="your-key"  # Uncomment if needed
    )
    
    try:
        # Send crowd level update
        print(f"\n📍 Location: {sensor.location_id}")
        print("Sending crowd level update: 45%...")
        
        result = sensor.send_update(45)
        
        if result.get('success'):
            print(f"✅ Success: {result.get('message', 'Updated')}")
            if 'newLevel' in result:
                print(f"   Level: {result.get('previousLevel', '?')}% → {result['newLevel']}%")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
            
    except ValueError as e:
        print(f"❌ Validation error: {e}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

