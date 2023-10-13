from flask import Flask, request, render_template, flash, redirect, session, jsonify
import numpy as np
import pandas as pd
import os
import sys
import serial
import time
import csv
import time
from datetime import datetime

from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

app = Flask(__name__, static_url_path='',
            static_folder='static',
            template_folder='templates')

app.secret_key = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f78'

# Define constants
sensor_data = {'date': [], 'temp': [], 'humidity': [], 'tds': [], 'ph': []}
DATA_DIRECTORY = "static"
CSV_FILENAME = "sensor_data.csv"

# Global Variables
receiving_file = False
arduino = None
last_update_time = None

# Initialize serial port connection
try:
    arduino = serial.Serial('COM3', 9600, timeout=1)
    time.sleep(1)  # Wait for the Serial connection to initialize
    if arduino.is_open:
        print("Serial port connected.")
    else:
        raise Exception("Serial port not opened.")
except Exception as e:
    print(f"Could not initialize the serial port: {e}")
    arduino = None

@app.route('/')
def index():
    return render_template('realtime.html')

@app.route('/historicaldata')
def historicaldata():
    return render_template('historicaldata.html')

@app.route('/growthPred')
def growthPred():
    return render_template('growthPred.html')

# Function to get the data real time in the arduino serial monitor
@app.route('/data')
def data():
    global arduino
    try:
        if arduino is None:
            raise Exception("Serial port not connected.")
        else:
            raw_data = arduino.readline().decode().strip()
            data = raw_data.split(',')

            expected_length = len(sensor_data) - ('timestamps' in sensor_data)
            if len(data) != expected_length:
                raise Exception(f"Invalid data received: {data}")

            for key, value in zip(sensor_data.keys(), data):
                if value != 'undefined':
                    sensor_data[key].append(value)
                
            # Limit the number of data points to display
            # max_data_points = 15
            # for key in sensor_data.keys():
            #     if key != 'timestamps' and len(sensor_data[key]) > max_data_points:
            #         sensor_data[key] = sensor_data[key][-max_data_points:]

            current_time = datetime.now().strftime('%H:%M:%S')
            print(f"Current time: {current_time}")
            if 'timestamps' not in sensor_data:
                sensor_data['timestamps'] = []
            sensor_data['timestamps'].append(current_time)

        print(sensor_data)
        return jsonify(sensor_data)
    
    except Exception as e:
        return str(e) 
    
# Function to display the predicted growth days
@app.route('/growthPred', methods=['GET', 'POST'])
def predict_datapoint():
    if request.method == 'GET':
        return render_template('growthPred.html', predictionDisplay="The predicted value will be displayed here.")
    else:
        try:
            csv_file_path = os.path.join(DATA_DIRECTORY, CSV_FILENAME)
            if not os.path.exists(csv_file_path):
                return jsonify(error=f'File {CSV_FILENAME} not found in directory {DATA_DIRECTORY}.')
            data_df = pd.read_csv(csv_file_path)
            
            # drop the 'Time' header here
            data_df.drop('Time', axis=1)

            predict = PredictPipeline()
            preds = predict.predict_days(data_df)
            return jsonify(predictions=preds)
        except Exception as e:
            return jsonify(error=str(e))
        
# Function to retrieve the data from the sd card arduino to the app directory
@app.route('/transfer', methods=['POST'])
def transfer():
    global arduino, last_update_time
    print("Start transferring...")

    # Check if there's no new data since the last update
    if last_update_time is not None and (time.time() - last_update_time) < 2:
        print("No new data available. Data is already up to date.")
        return jsonify({'status': 'no_new_data'})

    arduino.write("SEND_FILE\n".encode('utf-8'))
    time.sleep(1)

    try:
        csv_file_path = os.path.join(DATA_DIRECTORY, CSV_FILENAME)
        file_exists = os.path.exists(csv_file_path)
        
        with open(csv_file_path, "a", newline='', encoding='utf-8') as file:
            csv_writer = csv.writer(file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            
            if not file_exists:
                header = ["Time", "Date", "Temperature", "Humidity", "TDS Value", "pH Level"]
                csv_writer.writerow(header)

            while True:
                transfer_line = arduino.readline().decode('utf-8').strip()
                if transfer_line == "SEND_FILE":
                    continue 
                elif transfer_line == "EOF":
                    print("End of file received.")
                    break 
                elif transfer_line:
                    csv_writer.writerow(transfer_line.split(','))
        
        print("File transfer complete.")
        return jsonify({'status': 'success'})

    except Exception as e:
        print("Error: " + str(e))
        return jsonify({'status': 'error', 'message': str(e)})

# Create an API to store the sensor data
@app.route('/api/data', methods=['GET'])
def get_sensor_data():
    try:
        csv_file_path = os.path.join(DATA_DIRECTORY, CSV_FILENAME)
        df = pd.read_csv(csv_file_path)

        data = {}

        for index, row in df.iterrows():
            date = row['Date']
            time = row['Time']
            temp = row['Temperature']
            hum = row['Humidity']
            tds = row['TDS Value']
            ph = row['pH Level']

            # Check if the date already exists in data
            if date not in data:
                data[date] = {
                    "Date": date,
                    "Records": []
                }
            data[date]['Records'].append({
                "Time": time,
                "Temperature": temp,
                "Humidity": hum,
                "TDS Value": tds,
                "pH Level": ph
            })

            transformed_data = list(data.values())

        return jsonify(transformed_data)
    
    except Exception as e:
        return jsonify({'error': str(e)})
    

if __name__ == '__main__': 
    app.run(debug=True) # host='0.0.0.0', debug=True
