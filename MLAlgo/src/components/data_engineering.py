import os
import sys
import pandas as pd

from dataclasses import dataclass

from MLAlgo.src.exception import CustomException
from MLAlgo.src.logger import logging

csv_file_path = os.path.abspath('MLAlgo/notebook/data/lettuce_dataset.csv')

@dataclass
class DataEngineeringConfig:
    data_engineered_path = os.path.join('artifacts', 'cleaned_df.csv')

class DataEngineering:
    def __init__(self):
        self.engineering_config = DataEngineeringConfig()

    def create_lagged_features(self, df):
        try:
            df['Date'] = pd.to_datetime(df['Date'])
            df.set_index('Date', inplace=True)

            # Creating lagged features for Temperature, Humidity, pH Level, and TDS Value
            lag_features = ['Temperature', 'Humidity', 'TDS Value',  'pH Level']
            lags = [1, 2, 3, 7]  # Lags of 1 day, 2 days, 3 days, and 7 days

            for feature in lag_features:
                for lag in lags:
                    df[f"{feature} Lag {lag}"] = df[feature].shift(lag)

            # Rolling window statistics for the same features
            window = 7  # 7-day window
            for feature in lag_features:
                df[f"{feature} Rolling Mean"] = df[feature].rolling(window=window).mean()
                df[f"{feature} Rolling Std"] = df[feature].rolling(window=window).std()

            # Time-based features
            df['Day of Week'] = df.index.dayofweek + 1
            df['Month'] = df.index.month

            return df
        except Exception as e:
            raise CustomException(e, sys)

    
    def initiate_data_engineering(self, df):
        logging.info("Starting data engineering.")
        try:
            # df = self.create_lagged_features(df)
            cleaned_df = df.dropna()

            # cleaned_df.to_csv(self.engineering_config.data_engineered_path, index=False, header=True)
            logging.info("Create lagging features completed")
            
            return cleaned_df
    
        except Exception as e:
            raise CustomException(e, sys)

# if __name__ == '__main__':
#     df = pd.read_csv(csv_file_path)
#     obj = DataEngineering()
#     obj.initiate_data_engineering(df)
