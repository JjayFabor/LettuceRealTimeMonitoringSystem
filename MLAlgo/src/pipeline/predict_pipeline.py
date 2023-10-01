import sys
import pandas as pd
import numpy as np
from MLAlgo.src.exception import CustomException
from MLAlgo.src.utils import load_object
from MLAlgo.src.components.data_engineering import DataEngineering
import os

class PredictPipeline:
    def __init__(self):
        pass

    def load_csv_to_dataframe(self, csv_file_path):
        try:
            # Read the CSV file into a DataFrame
            df = pd.read_csv(csv_file_path)
            return df
        except Exception as e:
            raise CustomException(e, sys)

    def preprocess_data(self, features):
        try:
            preprocess_path = 'artifacts\preprocessor.pkl'
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
    def __init__(self, csv_file_path: str):
        self.csv_file_path = csv_file_path
        # self.csv_df = pd.read_csv(os.path.join('artifacts', 'cleaned_df.csv'))

    def get_data_as_dataframe(self):
        try:
            # Read the CSV file into a DataFrame
            df = pd.read_csv(self.csv_file_path)
            return df
        except Exception as e:
            raise CustomException(e, sys)