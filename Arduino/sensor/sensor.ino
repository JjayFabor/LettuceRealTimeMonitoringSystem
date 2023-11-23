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
const int DHT11_PIN = A1;
const int TDS_PIN = A0;
const int PH_SENSOR_PIN = A2;


float dhtTemp = 0;
float tdsValue = 0;

const float calibration_value = 21.34 - 0.1;

// TDS dosing pump
byte tdsPump1 = 2;
//byte tdsPump2 = 3;

unsigned long lastSensorTime;


// Create a SoftwareSerial object to communicate with Python
SoftwareSerial pythonSerial(0, 1); 

void createSensorFile() {
  // Serial.println(F("Creating sensor.csv..."));
  File myFile = SD.open("sensor.csv", FILE_WRITE);
  if (myFile) {
    //myFile.println(F("Date,Temperature,Humidity,TDS Value,pH Level"));
    myFile.close();
    // Serial.println(F("sensor.csv created."));
  }
}

void setup() {
  Serial.begin(9600);

//  // Initialize dosing pump
  pinMode(tdsPump1, OUTPUT); 
  //digitalWrite(tdsPump2, LOW); 
  
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
  unsigned long current_time = millis();
  // 300000      
  if (current_time - lastSensorTime >= 300000) {
    // Always update sensor values
    getSensorValues();
    lastSensorTime = current_time;
  }

  // Check for commands from Python
  if (pythonSerial.available() > 0) {
    String command = pythonSerial.readStringUntil('\n');
    command.trim();
    if (command == "SEND_FILE") {
      sendFileContents();
      SD.remove("sensor.csv");
      createSensorFile();
    }
  }
}
  
void getSensorValues() {
  char dateStr[32];
  char timeStr[32];
  //  static int dataID = 0;
  DateTime now = rtc.now();
  sprintf(dateStr, "%02d/%02d/%04d", now.month(), now.day(), now.year());
  // Check if the month is "00" and replace it with "01"
  if (dateStr[0] == '0' || dateStr[1] == '0') {
    dateStr[0] = '0';
    dateStr[1] = '1';
  }

  sprintf(timeStr, "%02d:%02d", now.hour(), now.minute());
  // Check if the timeStr exceeds 23:59 and replace it with 00:01
  if (now.hour() == 23 && now.minute() == 59) {
    timeStr[0] = '0';
    timeStr[1] = '0';
    timeStr[3] = '0';
    timeStr[4] = '1';
  }

  DHT.read11(DHT11_PIN);
  dhtTemp = DHT.temperature;
  float hum = DHT.humidity;
  if (isnan(dhtTemp) || dhtTemp == -999 || isnan(hum) || hum == -999) {
    Serial.println(F("Error reading from DHT sensor."));
    return;
  }

  gravityTds.setTemperature(dhtTemp);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();
//  Serial.print("TDS VALUE: ");
//  Serial.println(tdsValue);
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
  
    // Send data to Python:
    Serial.print("RT,");
    Serial.print(timeStr);
    Serial.print(",");
    Serial.print(dateStr);
    Serial.print(",");
    Serial.print(dhtTemp);
    Serial.print(",");
    Serial.print(hum);
    Serial.print(",");
    Serial.print(tdsValue);
    Serial.print(",");
    Serial.println(ph_act);
  }

  if (tdsValue >= 200.00){
    digitalWrite(tdsPump1, LOW);
   // digitalWrite(tdsPump2, LOW);
  } else if (tdsValue < 500.00) {
    digitalWrite(tdsPump1, HIGH);
   // digitalWrite(tdsPump2, HIGH);
    delay(3000);
    digitalWrite(tdsPump1, LOW);  // Turn off the dosing pump
    //delay(5000);  // Wait for 10 minutes (600,000 milliseconds)
  }
}

void sendFileContents() {
    File myFile = SD.open("sensor.csv");
    if (myFile) {
        //Serial.println("SEND_FILE");
        while (myFile.available()) {
            Serial.write(myFile.read());
        }
        Serial.println("EOF");
        myFile.close();
    } else {
        Serial.println(F("Error reading sensor.csv"));
    }
}
