#include <SoftwareSerial.h>
#include <SD.h>
#include <dht.h>
#include "GravityTDS.h"
#include <RTClib.h>
#include <SPI.h>
#include <Wire.h>

dht DHT;
GravityTDS gravityTds;
RTC_DS3231 rtc;

File dataFile;

const int chipSelect = 10;
const int DHT11_PIN = A0;
const int TDS_PIN = A1;
const int PH_SENSOR_PIN = A2;

float dhtTemp = 0;

const float calibration_value = 21.34 - 0.1;

// Create a SoftwareSerial object to communicate with Python
SoftwareSerial pythonSerial(0, 1); // RX, TX

void createSensorFile() {
  if (SD.exists("sensor.csv")) {
    // Serial.println(F("sensor.csv exists."));
  } else {
    // Serial.println(F("Creating sensor.csv..."));
    File myFile = SD.open("sensor.csv", FILE_WRITE);
    if (myFile) {
      //myFile.println(F("Date,Temperature,Humidity,TDS Value,pH Level"));
      myFile.close();
      // Serial.println(F("sensor.csv created."));
    }
  }
}

void setup() {
  Serial.begin(9600);

  // Initialize Python serial communication
  pythonSerial.begin(9600);

  if (!SD.begin(chipSelect)) {
    // Serial.println(F("SD card initialization failed."));
    while (1);
  }
  // Serial.println(F("SD card initialized."));
  createSensorFile();
  Wire.begin();
  rtc.begin();  
  rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  gravityTds.setPin(TDS_PIN);
  gravityTds.setAref(5.0);
  gravityTds.setAdcRange(1024);
  gravityTds.begin();
}

void loop() {
  static unsigned long last_time = 0;
  unsigned long current_time = millis();

  // Check if 10 seconds have passed; if so, read sensor data
  if (current_time - last_time >= 60000) {
    last_time = current_time;
    getSensorValues();
  }

  // Check for commands from Python
  if (pythonSerial.available() > 0) {
    String command = pythonSerial.readStringUntil('\n');
    command.trim();
    if (command == "SEND_FILE") {
      sendFileContents();
    }
  }
}
  
void getSensorValues() {
  char dateStr[32];
  char timeStr[32];
  DateTime now = rtc.now();
  sprintf(dateStr, "%02d/%02d/%04d", now.month(), now.day(), now.year());
  sprintf(timeStr, "%02d:%02d", now.hour(), now.minute());
  DHT.read11(DHT11_PIN);
  dhtTemp = DHT.temperature;
  float hum = DHT.humidity;
  if (isnan(dhtTemp) || dhtTemp == -999 || isnan(hum) || hum == -999) {
    Serial.println(F("Error reading from DHT sensor."));
    return;
  }

  gravityTds.setTemperature(dhtTemp);
  gravityTds.update();
  float tdsValue = gravityTds.getTdsValue();
  if (tdsValue < 0 || tdsValue > 5000) {
    Serial.println(F("Error reading from TDS sensor."));
    return;
  }

  int buffer_arr[10];
  for (int i = 0; i < 10; i++) {
    buffer_arr[i] = analogRead(PH_SENSOR_PIN);
    delay(30);
  }
  for (int i = 0; i < 9; i++) {
    for (int j = i + 1; j < 10; j++) {
      if (buffer_arr[i] > buffer_arr[j]) {
        int phTemp = buffer_arr[i];
        buffer_arr[i] = buffer_arr[j];
        buffer_arr[j] = phTemp;
      }
    }
  }
  unsigned long int avgval = 0;
  for (int i = 2; i < 8; i++) {
    avgval += buffer_arr[i];
  }
  float volt = (float)avgval * 5.0 / 1024 / 6;
  float ph_act = -5.70 * volt + calibration_value;

  // Store sensor data in the SD card
  dataFile = SD.open("sensor.csv", FILE_WRITE);
  if (dataFile) {
    dataFile.print(timeStr);
    dataFile.print(',');
    dataFile.print(dateStr);
    dataFile.print(',');
    dataFile.print(dhtTemp);
    dataFile.print(',');
    dataFile.print(hum);
    dataFile.print(',');
    dataFile.print(tdsValue);
    dataFile.print(',');
    dataFile.println(ph_act);
    dataFile.close();
    Serial.print(dateStr);
    Serial.print(',');
//    Serial.print(timeStr);
//    Serial.print(',');
    Serial.print(dhtTemp);
    Serial.print(',');
    Serial.print(hum);
    Serial.print(',');
    Serial.print(tdsValue);
    Serial.print(',');
    Serial.println(ph_act);
    } else {
      Serial.println(F("Error opening sensor.csv"));
    }

    // Send sensor data to Python
    pythonSerial.print(dateStr);
    pythonSerial.print(",");
    pythonSerial.print(dhtTemp);
    pythonSerial.print(",");
    pythonSerial.print(hum);
    pythonSerial.print(",");
    pythonSerial.print(tdsValue);
    pythonSerial.print(",");
    pythonSerial.println(ph_act);
}

void sendFileContents() {
    File myFile = SD.open("sensor.csv");
    if (myFile) {
        Serial.println("SEND_FILE");
        while (myFile.available()) {
            Serial.write(myFile.read());
        }
        Serial.println("EOF");
        myFile.close();
    } else {
        Serial.println(F("Error reading sensor.csv"));
    }
}
