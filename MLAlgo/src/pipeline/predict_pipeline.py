import sys
import pandas as pd
import numpy as np
from MLAlgo.src.exception import CustomException
from MLAlgo.src.utils import load_object
from MLAlgo.src.components.data_engineering import DataEngineering


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
        
    # def feature_scaling(self, features):
    #     try:
    #         preprocess_path = 'artifacts\preprocessor.pkl'
    #         preprocessor = load_object(file_path=preprocess_path)
    #         feature_engineering = DataEngineering()
            
    #         features_df = pd.DataFrame(features, columns=['Date', 'Temperature (°C)', 'Humidity (%)', 'pH Level', 'TDS Value (ppm)'])

    #         # Debug: Print the shape and type of the input DataFrame
    #         print(f"Original features shape: {features_df.shape}, type: {type(features_df)}")
    #         #Ensure that the input DataFrame has the expected column names
    #         expected_columns = ['Date', 'Temperature (°C)', 'Humidity (%)', 'pH Level', 'TDS Value (ppm)']
    #         missing_columns = [col for col in expected_columns if col not in features_df.columns]
    #         if missing_columns:
    #             raise CustomException(f"Missing columns in features: {missing_columns}", sys)

    #         engineered_features = feature_engineering.create_lagged_features(features_df)
            
    #         # Debug: Print the shape and type of the engineered features
    #         print(f"Engineered features shape: {engineered_features.shape}, type: {type(engineered_features)}")
            
    #         cleaned_df = feature_engineering.initiate_data_engineering(engineered_features)
            
    #         print(f"Cleaned DataFrame shape: {cleaned_df.shape}, type: {type(cleaned_df)}")
    #         print(cleaned_df)

    #         data_scaled = preprocessor.transform(cleaned_df)
            
    #         # Debug: Print the shape and type of the scaled data
    #         print(f"Scaled data shape: {data_scaled.shape}, type: {type(data_scaled)}")
             
    #         # Ensure data_scaled is a 2D array
    #         if len(data_scaled.shape) == 1:
    #             data_scaled = data_scaled.reshape(-1, 1)

    #         print(data_scaled)
    #         return data_scaled
    #     except Exception as e:
    #         raise CustomException(e, sys)

    def predict_days(self, features):
        try:
            model_path = 'artifacts/model.pkl'
            model = load_object(file_path=model_path)

            preprocess_path = 'artifacts\preprocessor.pkl'
            preprocessor = load_object(file_path=preprocess_path)
            feature_engineering = DataEngineering()

            engineered_features = feature_engineering.create_lagged_features(features)

            cleaned_df = feature_engineering.initiate_data_engineering(engineered_features)
            # Call feature_scaling to obtain scaled data
            scaled_data = preprocessor.transform(cleaned_df)

            preds = model.predict(scaled_data)
            
            # Debug: Print the shape and type of the predictions
            print(f"Predictions shape: {preds.shape}, type: {type(preds)}")
            
            return preds
        except Exception as e:
            raise CustomException(e, sys)


class CustomData:
    def __init__(self, csv_file_path: str):
        self.csv_file_path = csv_file_path

    def get_data_as_dataframe(self):
        try:
            # Read the CSV file into a DataFrame
            df = pd.read_csv(self.csv_file_path)
            return df
        except Exception as e:
            raise CustomException(e, sys)