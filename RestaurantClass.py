import numpy as np

class Restaurant:

    def __init__(self, name, max_capacity):
        self.name = name
        self.max_capacity = max_capacity
        self.current_customers = 0
        self.entry_count = 0
        self.exit_count = 0
        self.is_open = False
    
    def customer_enters(self, count = 1):
        if not self.is_open:
            print("Restaurant is closed. Cannot enter.")
            return
        
        if self.current_customers + count <= self.max_capacity:
            self.current_customers += count
            self.entry_count += count
            print(f"{count} customer(s) entered. Current customers: {self.current_customers}")
        else:
            print(f"Cannot accomodate {count} customers. Restaurant at full capacity.")
            return False
    def customer_exits(self, count = 1):
        if self.current_customers - count >= 0:
            self.current_customers -= count
            self.exit_count += count
            print(f"{count} customer(s) exited. Current customers: {self.current_customers}")
        else:
            print("Error: More customers exiting than present.")
            return False
    def get_occupancy_rate(self):
        if self.max_capacity == 0:
            return 0
        return (self.current_customers / self.max_capacity) * 100
    def open_restaurant(self):
        self.is_open = True
        print(f"{self.name} is now open.")
    def close_restaurant(self):
        self.is_open = False
        self.current_customers = 0
        print(f"{self.name} is now closed.")
    def get_status(self):
        status = {
            'name': self.name,
            'current_customers': self.current_customers,
            'max_capacity': self.max_capacity,
            'occupancy_rate': self.get_occupancy_rate(),
            'entry_count': self.entry_count,
            'exit_count': self.exit_count,
            'is_open': self.is_open
        }
        return status