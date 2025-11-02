from RestaurantClass import Restaurant
from datetime import datetime, time, date
import json
import re

class RestaurantManager:
    def __init__(self, config_file="dining-locations.json"):
        self.config = self.load_config(config_file)
        self.restaurants = {}
        self.initialize_restaurants()
    
    def load_config(self, config_file):
        try: 
            with open(config_file, 'r') as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def initialize_restaurants(self):
        """Initialize restaurants from JSON data"""
        for restaurant_data in self.config:
            try:
                name = restaurant_data["name"]
                restaurant_id = name.lower().replace(" ", "_").replace("&", "and").replace(",", "").replace("'", "")
                restaurant = ConfiguredRestaurant(restaurant_data)
                self.restaurants[restaurant_id] = restaurant
            except Exception:
                continue
    
    def get_restaurant(self, restaurant_id):
        return self.restaurants.get(restaurant_id)
    
    def update_all_restaurants(self):
        """Update open/closed status for all restaurants"""
        results = {}
        for restaurant_id, restaurant in self.restaurants.items():
            try:
                should_be_open = restaurant.auto_update_status()
                hours_status = restaurant.get_hours_status()  # Get hours info
                
                results[restaurant_id] = {
                    'name': restaurant.name,
                    'is_open': restaurant.is_open,
                    'should_be_open': should_be_open,
                    'current_customers': restaurant.current_customers,
                    'max_capacity': restaurant.max_capacity,
                    'building': restaurant.building,
                    'today_hours': hours_status['today_hours']  # Add hours here
                }
            except Exception:
                continue
        return results
    
    def get_all_statuses(self):
        """Get status for all restaurants"""
        statuses = {}
        for restaurant_id, restaurant in self.restaurants.items():
            try:
                hours_status = restaurant.get_hours_status()
                statuses[restaurant_id] = {
                    'name': restaurant.name,
                    'is_open': restaurant.is_open,
                    'current_customers': restaurant.current_customers,
                    'max_capacity': restaurant.max_capacity,
                    'occupancy_rate': restaurant.get_occupancy_rate(),
                    'today_hours': hours_status['today_hours'],
                    'should_be_open': hours_status['should_be_open'],
                    'building': restaurant.building
                }
            except Exception:
                continue
        return statuses
class ConfiguredRestaurant(Restaurant):
    def __init__(self, config):
        max_capacity = config.get("crowdLevel", 50)
        super().__init__(config["name"], max_capacity)
        self.building = config.get("building", "Unknown")
        self.hours_data = config.get("hours", [])
    
    def parse_single_time(self, time_str):
        """Parse time string to time object"""
        try:
            time_str = time_str.strip().lower()
            
            # Handle times with minutes: "10:00 a.m."
            match = re.search(r'(\d+):(\d+)\s*([ap])\.?m?\.?', time_str)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                period = match.group(3)
                
                if period == 'p' and hour != 12:
                    hour += 12
                elif period == 'a' and hour == 12:
                    hour = 0
                
                return time(hour, minute)
            
            # Handle times without minutes: "11 p.m."
            match = re.search(r'(\d+)\s*([ap])\.?m?\.?', time_str)
            if match:
                hour = int(match.group(1))
                period = match.group(2)
                
                if period == 'p' and hour != 12:
                    hour += 12
                elif period == 'a' and hour == 12:
                    hour = 0
                
                return time(hour, 0)
            
            return None
        except Exception:
            return None
    
    def parse_hours_range(self, hours_string):
        """Parse hours range using reliable 'to' split method"""
        if " to " in hours_string.lower():
            parts = hours_string.lower().split(" to ")
            if len(parts) == 2:
                open_time = self.parse_single_time(parts[0].strip())
                close_time = self.parse_single_time(parts[1].strip())
                return open_time, close_time
        return None, None
    
    def get_current_day(self):
        return datetime.now().strftime("%A").lower()
    
    def does_day_match(self, day_range, current_day):
        day_range = day_range.lower()
        current_day = current_day.lower()
        
        if "daily" in day_range:
            return True
        
        if " - " in day_range:
            days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            parts = day_range.split(" - ")
            if len(parts) == 2:
                start_day, end_day = [d.strip().lower() for d in parts]
                try:
                    start_idx = days.index(start_day)
                    end_idx = days.index(end_day)
                    current_idx = days.index(current_day)
                    
                    if start_idx <= end_idx:
                        return start_idx <= current_idx <= end_idx
                    else:
                        return current_idx >= start_idx or current_idx <= end_idx
                except ValueError:
                    return False
        
        return current_day in day_range
    
    def should_be_open_now(self):
        current_day = self.get_current_day()
        current_time = datetime.now().time()
        
        for hours_entry in self.hours_data:
            day_range = hours_entry.get("day", "")
            hours_string = hours_entry.get("hours", "").lower()
            
            if self.does_day_match(day_range, current_day):
                if "closed" in hours_string:
                    return False
                
                open_time, close_time = self.parse_hours_range(hours_entry["hours"])
                
                if open_time and close_time:
                    return open_time <= current_time <= close_time
        
        return False
    
    def auto_update_status(self):
        should_be_open = self.should_be_open_now()
        
        if should_be_open and not self.is_open:
            self.open_restaurant()
        elif not should_be_open and self.is_open:
            self.close_restaurant()
        
        return should_be_open
    
    def get_hours_status(self):
        current_day = self.get_current_day()
        
        # Find today's hours
        today_hours = "Not specified"
        for hours_entry in self.hours_data:
            if self.does_day_match(hours_entry.get("day", ""), current_day):
                today_hours = hours_entry.get("hours", "Not specified")
                break
        
        return {
            'current_day': current_day,
            'today_hours': today_hours,
            'should_be_open': self.should_be_open_now(),
            'current_time': datetime.now().strftime("%H:%M:%S")
        }
def display_restaurant_status():
    """Clean display of restaurant status"""
    print("=== RESTAURANT STATUS ===")
    print(f"Current time: {datetime.now().strftime('%A, %Y-%m-%d %H:%M:%S')}")
    print()
    
    manager = RestaurantManager("dining-locations.json")
    results = manager.update_all_restaurants()
    
    # Count and display open restaurants
    open_restaurants = [status for status in results.values() if status.get('is_open', False)]
    
    print(f"🟢 {len(open_restaurants)} RESTAURANTS OPEN:")
    print("-" * 40)
    
    for status in open_restaurants:
        print(f"• {status['name']}")
        print(f"  Building: {status.get('building', 'Unknown')}")
        print(f"  Hours: {status.get('today_hours', 'Check hours')}")
        print(f"  Capacity: {status['current_customers']}/{status['max_capacity']}")
        print()
    
    if not open_restaurants:
        print("No restaurants are currently open")
        print()
        
        # Show restaurants that close later (for reference)
        print("💡 Restaurants that were open today:")
        all_statuses = manager.get_all_statuses()
        for status in list(all_statuses.values())[:5]:
            if not status.get('is_open', False) and status.get('today_hours', '') != 'Closed':
                print(f"• {status['name']} - {status.get('today_hours', 'Hours unknown')}")

# Run the clean display
display_restaurant_status()