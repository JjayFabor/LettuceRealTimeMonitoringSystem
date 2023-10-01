from flask import Flask, request, render_template, flash, redirect, session, jsonify
import numpy as np
import pandas as pd
import os
import sys
import serial

from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

application = Flask(__name__)

app = application

app.secret_key = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f4'

# ser = serial.Serial("COM3", 9600)
DATA_DIRECTORY = "Arduino"  # This is the directory where the CSV file will be located
CSV_FILENAME = "sensor_data.csv"  # This is the name of the CSV file

@app.route('/', methods=['GET', 'POST'])
def predict_datapoint():
    if request.method == 'GET':
        return render_template('index.html', predictionDisplay="The predicted value will be displayed here.")
    else:
        try:
            csv_file_path = os.path.join(DATA_DIRECTORY, CSV_FILENAME)
            if not os.path.exists(csv_file_path):
                return jsonify(error=f'File {CSV_FILENAME} not found in directory {DATA_DIRECTORY}.')
            data_df = pd.read_csv(csv_file_path)
            predict = PredictPipeline()
            preds = predict.predict_days(data_df)
            return jsonify(predictions=preds)
        except Exception as e:
            return jsonify(error=str(e))

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
