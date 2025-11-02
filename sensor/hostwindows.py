#!/usr/bin/env python3

import serial
import threading
import time
from RestaurantClass import Restaurant
import random
from SensorClient import SensorClient
def main():
    #we are assuming that all restaurant capacity is 50 people
    restaurant = SensorClient("caf-libro","hackokstate25")
    numpeople = random.randint(0,50) #generate a random restaurant capacity for testing
    restaurant.send_update(numpeople*2)

    try:
        arduino = serial.Serial(port='COM4',baudrate= 9600,timeout=.1)
        time.sleep(2)  # Wait for Arduino reset
        #GrilledCheese= Restaurant("Cheems",50)
        while True:
            resp = arduino.read()
            if resp == b'H':
               # GrilledCheese.customer_enters()
               if random.randint(0,1)==1:
                    numpeople=numpeople+1
               else: 
                   numpeople=numpeople-1
            business=numpeople*2
            print(f"Number of people is {numpeople} crowded level is {business}")
            restaurant.send_update(business)
            time.sleep(1)
                

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
