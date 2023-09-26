import os
import sys
from MLAlgo.src.exception import CustomException
from MLAlgo.src.logger import logging
from MLAlgo.src.utils import save_object
import pandas as pd
import numpy as np

from dataclasses import dataclass

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler
from sklearn.compose import ColumnTransformer


@dataclass
class DataTransformationConfig:
    preprocessor_obj_file_path = os.path.join('artifacts', "preprocessor.pkl")

class DataTransformation:
    def __init__(self):
        self.data_transformation_config = DataTransformationConfig()

    def get_data_transformer_object(self):
        ''''
        This funcition is responsible for transforming data
        '''
        try:
            features = ['Temperature (°C)', 'Humidity (%)', 'TDS Value (ppm)',
                        'pH Level', 'Temperature (°C) Lag 1',
                        'Temperature (°C) Lag 2', 'Temperature (°C) Lag 3',
                        'Temperature (°C) Lag 7', 'Humidity (%) Lag 1', 'Humidity (%) Lag 2',
                        'Humidity (%) Lag 3', 'Humidity (%) Lag 7', 'pH Level Lag 1',
                        'pH Level Lag 2', 'pH Level Lag 3', 'pH Level Lag 7',
                        'TDS Value (ppm) Lag 1', 'TDS Value (ppm) Lag 2',
                        'TDS Value (ppm) Lag 3', 'TDS Value (ppm) Lag 7',
                        'Temperature (°C) Rolling Mean', 'Temperature (°C) Rolling Std',
                        'Humidity (%) Rolling Mean', 'Humidity (%) Rolling Std',
                        'pH Level Rolling Mean', 'pH Level Rolling Std',
                        'TDS Value (ppm) Rolling Mean', 'TDS Value (ppm) Rolling Std',
                        'Day of Week', 'Month']
            
            pipeline = Pipeline(
                steps=[
                    ("scaler", MinMaxScaler())
                ]
            )

            preprocessor = ColumnTransformer(
                [
                    ('feature_pipeline', pipeline, features )
                ]
            )
            logging.info("Data Normalization (MinMaxScaler) completed")

            return preprocessor
        
        except Exception as e:
            raise CustomException(e, sys)
            

    def initiate_data_transformation(self, train_path, test_path):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)

            logging.info("Reading Train and Test Data completed")

            logging.info("Obtaining preprocessing object")

            preprocessor_obj = self.get_data_transformer_object()

            target_column_name = 'Growth Days'

            input_feature_train_df=  train_df.drop(columns=[target_column_name], axis=1)
            target_feature_train_df= train_df[target_column_name]

            input_feature_test_df=  test_df.drop(columns=[target_column_name], axis=1)
            target_feature_test_df= test_df[target_column_name]

            logging.info('Applying preprocessing object on train and test dataframe.')

            input_feature_train_arr = preprocessor_obj.fit_transform(input_feature_train_df)
            input_feature_test_arr = preprocessor_obj.transform(input_feature_test_df)

            train_arr = np.c_[input_feature_train_arr, np.array(input_feature_train_df)]
            test_arr = np.c_[input_feature_test_arr, np.array(input_feature_test_df)]

            logging.info(f"Saved preprocessing object.")

            save_object(
                file_path=self.data_transformation_config.preprocessor_obj_file_path,
                obj=preprocessor_obj)

            return (
                train_arr,
                test_arr,
                self.data_transformation_config.preprocessor_obj_file_path
            )
        except Exception as e:
            raise CustomException(e, sys)