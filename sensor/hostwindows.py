#!/usr/bin/env python3

import serial
import threading
import time
from RestaurantClass import Restaurant
def main():
    count = 0

    try:
        arduino = serial.Serial(port='COM4',baudrate= 9600,timeout=.1)
        time.sleep(2)  # Wait for Arduino reset
        GrilledCheese= Restaurant("Cheems",50)
        while True:
            resp = arduino.read()
            if resp == b'H':
                GrilledCheese.customer_enters()
                
            elif resp == b'L':
                print(f"({count}) OFF")
                count = count + 1

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
