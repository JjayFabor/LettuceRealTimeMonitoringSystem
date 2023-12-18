import sys
import pandas as pd
from MLAlgo.src.exception import CustomException
from MLAlgo.src.utils import load_object
from MLAlgo.src.components.data_engineering import DataEngineering
import os
import sqlite3
import csv

DATA_DIRECTORY = "Database"
DATABASE_FILENAME = "sensor_data.db"
DATABASE_PATH = os.path.join(DATA_DIRECTORY, DATABASE_FILENAME)

class PredictPipeline:
    def __init__(self):
        pass

    def preprocess_data(self, features):
        try:
            preprocess_path = 'artifacts/preprocessor.pkl'
            preprocessor = load_object(file_path=preprocess_path)
            feature_engineering = DataEngineering()

            engineered_features = feature_engineering.create_lagged_features(features)
            cleaned_df = feature_engineering.initiate_data_engineering(engineered_features)
            scaled_data = preprocessor.transform(cleaned_df)

            return scaled_data
        
        except Exception as e:
            raise CustomException(e, sys)

    def predict_days(self, features):
        try:
            scaled_data = self.preprocess_data(features)

            model_path = 'artifacts/model.pkl'
            model = load_object(file_path=model_path)
            preds = model.predict(scaled_data)

            return preds.mean().round(2)
        except Exception as e:
            raise CustomException(e, sys)

class CustomData:
    def __init__(self, csv_file_path: str, batch_number: int):
        self.csv_file_path = os.path.join(DATA_DIRECTORY, csv_file_path)
        self.batch_number = batch_number
        
    def export_to_csv(self):
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()

            table_name = f'batch_{self.batch_number}'
            cursor.execute(f'SELECT * FROM {table_name}')

            data = cursor.fetchall()

            with open(self.csv_file_path, 'w', newline='') as file:
                csv_writer = csv.writer(file)

                custom_header = ['Time', 'Date', 'Temperature', 'Humidity', 'TDS Value', 'pH Level']
                csv_writer.writerow(custom_header)

                csv_writer.writerows(data)

            conn.close()
            
            print(f'Data has been exported to {self.csv_file_path}')
            return self.csv_file_path
        except Exception as e:
            raise CustomException(e, sys)
