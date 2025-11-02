from RestaurantClass import Restaurant
from datetime import datetime, time, date
import json


class RestaurantManager:
    def __init__(self, config_file = "dining-locations.json"):
        self.config = self.load_config(config_file)
        self.restaurants = {}
        self.initialize_restaurants()
    def load_config(self, config_file):
        try: 
            with open(config_file, 'r') as file:
                config = json.load(file)
            return config
        except FileNotFoundError:
            print(f"Configuration file {config_file} not found.")
            return {}
        except json.JSONDecodeError:
            print(f"Error decoding JSON from the configuration file {config_file}.")
            return {}
    def initialize_restaurants(self):
            for restaurant_id, restaurant_config in self.config.get("restaurants", {}).items():
                try: 
                    restaurant = ConfiguredRestaurant(restaurant_config)
                    self.restaurants[restaurant_id] = restaurant
                except Exception as e:
                    print(f"Error initializing restaurant {restaurant_id}: {e}")
    def get_restaurant(self, restaurant_id):
            return self.restaurants.get(restaurant_id)
        
    def update_all_restaurants(self):
            results = {}
            for restaurant_id, restaurant in self.restaurants.items():
                try:
                    should_be_open = restaurant.auto_update_status()
                    results[restaurant_id] = {
                        'name': restaurant.name,
                        'is_open': restaurant.is_open,
                        'should_be_open': should_be_open,
                        'current_customers': restaurant.current_customers
                    }
                except Exception as e:
                    print(f"Error updating restaurant {restaurant_id}: {e}")
                
            return results
    def get_all_statuses(self):
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
                        'should_be_open': hours_status['should_be_open']
                    }
                except Exception as e:
                    print(f"Error retrieving status for restaurant {restaurant_id}: {e}")
            return statuses
class ConfiguredRestaurant(Restaurant):
    def __init__(self, config):
        super().__init__(config["name"], config["max_capacity"])

        self.operating_hours = config["operating_hours"]

    def get_current_day(self):
        return datetime.now().strftime("%A").lower()
    
    def parse_time_string(self, time_str):
        try:
            hour, minute = map(int, time_str.split(":"))
            return time(hour, minute)
        except (ValueError, AttributeError):
            print(f"Invalid time format: {time_str}. Expected 'HH:MM'.")
            return time(0, 0)
    def should_be_open_now(self):
        current_day = self.get_current_day()
        current_time = datetime.now().time()
        today_hours = self.operating_hours.get(current_day)
        if not today_hours:
            return False
        open_time = self.parse_time_string(today_hours["open"])
        close_time = self.parse_time_string(today_hours["close"])
        return open_time <= current_time <= close_time
    
    def auto_update_status(self):
        current_day = self.get_current_day()
        todays_hours = self.operating_hours.get(current_day, {})
        
        return {
            'current_day': current_day,
            'today_hours': f"{todays_hours.get('open', 'closed')} - {todays_hours.get('close', 'closed')}",
            'should_be_open': self.should_be_open_now(),
            'current_time' : datetime.now().strftime("%H:%M:%S")
        }