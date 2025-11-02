#!/usr/bin/env python3

import serial
import threading
import time
from RestaurantClass import Restaurant
import random
from SensorClient import SensorClient
def main():
    #we are assuming that all restaurant capacity is 50 people
    restaurant = SensorClient("kerr drummond","hackokstate25")
    numpeople = random.randrange(0,50,1) #generate a random restaurant capacity for testing
    business=numpeople*2
    restaurant.send_update(business)

    try:
        arduino = serial.Serial(port='COM4',baudrate= 9600,timeout=.1)
        time.sleep(2)  # Wait for Arduino reset
        #GrilledCheese= Restaurant("Cheems",50)
        restaurant = SensorClient("kerr drummond","hackokstate25")
        while True:
            resp = arduino.read()
            if resp == b'H':
               # GrilledCheese.customer_enters()
               if random.randrange(0,1,1)==1:
                    numpeople=numpeople+1
               else: 
                   numpeople=numpeople-1
            business=numpeople*2
            restaurant.send_update(business)
                
                

    except KeyboardInterrupt:
        print("Monitoring stopped")
    except PermissionError:
        print("Permission denied - check user permissions")
    except FileNotFoundError:
        print("Port not found - verify device connection")
    finally:
        arduino.close()

if __name__ == "__main__":
    main()
