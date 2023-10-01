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
float prev_temp = 0;
float prev_hum = 0;
float prev_tdsValue = 0;
float prev_ph_act = 0;

const float calibration_value = 21.34 - 0.1;

void createSensorFile() {
  if (SD.exists("sensor.csv")) {
    Serial.println(F("sensor.csv exists."));
  } else {
    Serial.println(F("Creating sensor.csv..."));
    File myFile = SD.open("sensor.csv", FILE_WRITE);
    if (myFile) {
      myFile.println(F("Date,Temperature,Humidity,TDS Value,pH Level"));
      myFile.close();
      Serial.println(F("sensor.csv created."));
    }
  }
}

void setup() {
  Serial.begin(9600);
  if (!SD.begin(chipSelect)) {
    Serial.println(F("SD card initialization failed."));
    while(1);
  }
  Serial.println(F("SD card initialized."));
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
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    if (command == "GET_FILE") {
      sendFileContents();
    }
  }
  
  getSensorValues();
  delay(5 * 60 * 1000UL);
}

void getSensorValues() {
  char dateStr[32];
  DateTime now = rtc.now();
  sprintf(dateStr, "%02d/%02d/%02d",  now.month(), now.day(), now.year());
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

  if (dhtTemp != prev_temp || hum != prev_hum || tdsValue != prev_tdsValue || ph_act != prev_ph_act) {
    prev_temp = dhtTemp;
    prev_hum = hum;
    prev_tdsValue = tdsValue;
    prev_ph_act = ph_act;

    dataFile = SD.open("sensor.csv", FILE_WRITE);
    if (dataFile) {
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
      Serial.println(F("Successfully stored the sensor data to the CSV file"));
      Serial.print(dateStr);
      Serial.print(',');
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
  }
}

void sendFileContents() {
  File myFile = SD.open("sensor.csv");
  if (myFile) {
    Serial.println("START_FILE");  // Start marker
    while (myFile.available()) {
      Serial.write(myFile.read());
    }
    Serial.println("\nEND_FILE");  // End marker
    myFile.close();
  } else {
    Serial.println(F("Error reading sensor.csv"));
  }
}
