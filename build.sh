#!/usr/bin/env sh

ARDUINOFLAGS="--config-file ${XDG_CONFIG_HOME}/arduino15/arduino-cli.yaml --fqbn arduino:avr:mega"
arduino-cli compile ${ARDUINOFLAGS} .
arduino-cli upload ${ARDUINOFLAGS} -p /dev/ttyACM1 .
