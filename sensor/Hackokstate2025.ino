# define SENSOR_PIN 52

void setup() {
  pinMode(SENSOR_PIN, INPUT);
  Serial.begin(9600);
  pinMode(LED_BUILTIN,OUTPUT);
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
  int sound=analogRead(A0);
  Serial.writeln(sound);
  if (last_state != digitalRead(SENSOR_PIN)) {
    if (LOW == last_state) {
      Serial.writeln('H'); /* LOW to HIGH */
      last_state = HIGH;
      digitalWrite(LED_BUILTIN, HIGH);
    } else {
      Serial.writeln('L'); /* HIGH to LOW */
      last_state = LOW;
      digitalWrite(LED_BUILTIN,LOW);
    }
  }
}
