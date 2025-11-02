# define SENSOR_PIN 52

void setup() {
  pinMode(SENSOR_PIN, INPUT);
  Serial.begin(9600);
  pinmode(LED_BUILTIN,OUTPUT);
}

int cmd;
int last_state = LOW;

void loop() {
  if (Serial.available()) {
    cmd = Serial.read();
    if ('0' < cmd && '9' >= cmd) {
      /* Ping */
      Serial.write((cmd + 1 - '0') % 10 + '0');
    }
  }

  if (last_state != digitalRead(SENSOR_PIN)) {
    if (LOW == last_state) {
      Serial.write('H'); /* LOW to HIGH */
      last_state = HIGH;
      digitalWrite(LED_BUILTIN, HIGH);
    } else {
      Serial.write('L'); /* HIGH to LOW */
      last_state = LOW;
      digitalWrite(LED_BUILTIN_LOW);
    }
  }
}
