from RestaurantDefining import RestaurantManager
import time
'''
def basic_test():
    """Basic functionality test"""
    print("=== Basic Restaurant Manager Test ===")
    
    # Initialize manager
    manager = RestaurantManager("dining-locations.json")
    
    # Test 1: Check if restaurants were loaded
    print(f"\n1. Loaded {len(manager.restaurants)} restaurants")
    for rest_id, restaurant in manager.restaurants.items():
        print(f"   - {restaurant.name} (Capacity: {restaurant.max_capacity})")
    
    # Test 2: Update all restaurants
    print("\n2. Updating restaurant statuses...")
    results = manager.update_all_restaurants()
    for rest_id, status in results.items():
        emoji = "🟢" if status['is_open'] else "🔴"
        print(f"   {emoji} {status['name']}: {'OPEN' if status['is_open'] else 'CLOSED'}")
    
    # Test 3: Get detailed statuses
    print("\n3. Detailed status report:")
    all_statuses = manager.get_all_statuses()
    for rest_id, status in all_statuses.items():
        print(f"   📊 {status['name']}:")
        print(f"      Status: {'OPEN' if status['is_open'] else 'CLOSED'}")
        print(f"      Customers: {status['current_customers']}/{status['max_capacity']}")
        print(f"      Occupancy: {status['occupancy_rate']:.1f}%")
        print(f"      Hours: {status['today_hours']}")
    
    return manager

# Run basic test
manager = basic_test()
'''

from RestaurantDefining import RestaurantManager
import time

def test_restaurant_system():
    """Test the restaurant system with the actual JSON data"""
    print("=== Testing Restaurant System with Actual Data ===")
    
    # Initialize manager
    manager = RestaurantManager("dining-locations.json")
    
    # Test 1: Display loaded restaurants
    print(f"\n1. Loaded {len(manager.restaurants)} restaurants:")
    for rest_id, restaurant in list(manager.restaurants.items())[:5]:  # Show first 5
        print(f"   🏪 {restaurant.name} ({restaurant.building})")
    
    if len(manager.restaurants) > 5:
        print(f"   ... and {len(manager.restaurants) - 5} more")
    
    # Test 2: Update all restaurants
    print("\n2. Updating restaurant statuses based on current time...")
    results = manager.update_all_restaurants()
    
    open_count = sum(1 for status in results.values() if status.get('is_open', False))
    print(f"   {open_count} restaurants are OPEN")
    print(f"   {len(results) - open_count} restaurants are CLOSED")
    
    # Test 3: Show detailed status for first few restaurants
    print("\n3. Detailed status for sample restaurants:")
    all_statuses = manager.get_all_statuses()
    
    sample_restaurants = list(all_statuses.items())[:8]  # Show first 8
    for rest_id, status in sample_restaurants:
        if 'error' not in status:
            emoji = "🟢" if status['is_open'] else "🔴"
            print(f"   {emoji} {status['name']}")
            print(f"      Building: {status.get('building', 'Unknown')}")
            print(f"      Status: {'OPEN' if status['is_open'] else 'CLOSED'}")
            print(f"      Hours Today: {status['today_hours']}")
            print(f"      Customers: {status['current_customers']}/{status['max_capacity']}")
            print()
    
    # Test 4: Test individual restaurant operations
    print("\n4. Testing individual restaurant operations:")
    if manager.restaurants:
        first_rest_id = list(manager.restaurants.keys())[0]
        restaurant = manager.get_restaurant(first_rest_id)
        
        if restaurant:
            print(f"   Testing: {restaurant.name}")
            print(f"   Current status: {'OPEN' if restaurant.is_open else 'CLOSED'}")
            
            # Try to add customers if open
            if restaurant.is_open:
                print("   Adding 5 customers...")
                restaurant.customer_enters(5)
                print(f"   Current customers: {restaurant.current_customers}")
            else:
                print("   Restaurant is closed - testing entry denial:")
                restaurant.customer_enters(3)
    
    return manager
