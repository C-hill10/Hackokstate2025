from RestaurantClass import PlazaCornerCafe
from datetime import datetime, time

plaza_corner_cafe = PlazaCornerCafe("Plaza Corner Cafe", 50)

current_time = datetime.now().time()
current_hour = current_time.hour

if 11 <= current_hour > 15:
    plaza_corner_cafe.open_restaurant()
else:
    plaza_corner_cafe.close_restaurant()
