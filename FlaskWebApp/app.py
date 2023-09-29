from flask import Flask, request, render_template, flash, redirect, session, jsonify
import numpy as np
import pandas as pd
import os
import sys
import serial

from sklearn.preprocessing import MinMaxScaler
from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

application = Flask(__name__)

app = application

app.secret_key = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f4'

try:
    ser = serial.Serial('COM3', 9600)
except serial.SerialException as e:
    print(f"Error initializing serial connection: {str(e)}")
    ser = None
## Route for a homepage

# @app.route('/')
# def index():
#     return render_template('index.html')

@app.route('/', methods=['GET', 'POST'])
def predict_datapoint():
    if request.method=='GET':
        return render_template('index.html')
    else:
        try:
            # Check if a file was uploaded in the request
            if 'csvFile' not in request.files:
                flash('No file part')
                return redirect(request.url)

            file = request.files['csvFile']

            # Check if the file is empty
            if file.filename == '':
                flash('No selected file')
                return redirect(request.url)

            # Check if the file is a CSV file
            if file and file.filename.endswith('.csv'):
                # Save the uploaded file to a temporary location
                uploaded_file_path = 'new_data.csv'
                file.save(uploaded_file_path)

                # Create an instance of CustomData with the uploaded CSV file path
                data = CustomData(uploaded_file_path)

                data_df = data.get_data_as_dataframe()

                predict_pipeline = PredictPipeline()
                preds = predict_pipeline.predict_days(data_df)
                preds_dict = preds.to_dict(orient='records')
                
                print('Predictions Completed...')

                # Remove the temporary file
                os.remove(uploaded_file_path)

                return render_template('index.html', grouped_predictions=preds_dict)

            else:
                flash('Invalid file format. Please upload a CSV file.')
                return redirect(request.url)

        except Exception as e:
            # Handle exceptions and return an error message or redirect to an error page
            flash('An error occurred: {}'.format(str(e)))
            return redirect(request.url)

#Endpoint to initiate data transfer from Arduino
@app.route('/start_transfer', methods=['POST'])
def start_transfer():
    try:
        # Create a trigger file on Arduino's SD card
        ser.write(b'START_TRANSFER\n')  # Send a command to Arduino

        return jsonify({'message': 'Data transfer initiated'})
    except Exception as e:
        return jsonify({'message': 'Error initiating data transfer', 'error': str(e)})  
    
# Endpoint to receive data from Arduino
@app.route('/receive_data', methods=['POST'])
def receive_data():
    try:
        # Read data from the Arduino
        data = ser.readline().decode('utf-8').strip()

        # Check if the received data has a .csv suffix
        if data.lower().endswith('.csv'):
            save_csv_to_directory(data)
            return jsonify({'message': 'CSV file received and saved'})
        else:
            return jsonify({'message': 'Data received but not a CSV file'})
    except Exception as e:
        return jsonify({'message': 'Error receiving data', 'error': str(e)})

# Helper function to save received CSV data to the directory
def save_csv_to_directory(csv_data):
    try:
        upload_dir = os.path.join(app.root_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        filename = os.path.join(upload_dir, 'received_data.csv')
        with open(filename, 'w') as file:
            file.write(csv_data)
    except Exception as e:
        print(f'Error saving CSV data: {str(e)}')



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)