#!/usr/bin/env python3

import serial
import threading
import time

def main():
    count = 0

    try:
        arduino = serial.Serial('/dev/ttyACM1', 9600)
        time.sleep(2)  # Wait for Arduino reset
        while True:
            resp = arduino.read()
            if resp == b'H':
                print(f"({count}) ON")
            elif resp == b'L':
                print(f"({count}) OFF")
                count = count + 1
            else:
                print("Invalid response")

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
