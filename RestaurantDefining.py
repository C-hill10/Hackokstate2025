from RestaurantClass import Restaurant
from datetime import datetime, time

restaurant = Restaurant("Plaza Corner Cafe", 50)

current_time = datetime.now().time()
current_hour = current_time.hour

if 11 <= current_hour > 15:
    restaurant.open_restaurant()
else:
    restaurant.close_restaurant()
