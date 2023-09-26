import os
import sys
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

from MLAlgo.src.exception import CustomException
from MLAlgo.src.logger import logging
from MLAlgo.src.utils import save_object, evaluate_model

from MLAlgo.src.components.data_transformation import DataTransformation

from dataclasses import dataclass


@dataclass
class ModelTrainerConfig:
    trained_model_file_path = os.path.join('artifacts', 'model.pkl')

class ModelTrainer:
    def __init__(self):
        self.model_trainer_config = ModelTrainerConfig()

    def initiate_model_trainer(self, train_array, test_array):
        try:

            logging.info("Splitting training and test data.")
            X_train, y_train, X_test, y_test = (
                train_array[:, :-1],
                train_array[:, -1],
                test_array[:, :-1],
                test_array[:, -1]
            )

            model = RandomForestRegressor(random_state=42)

            evaluate_model(X_train=X_train, y_train=y_train, X_test=X_test, y_test=y_test,  model=model)

            logging.info("Model Training Completed.")


            save_object(
                file_path=self.model_trainer_config.trained_model_file_path,
                obj=model
            )
            
            predicted = model.predict(X_test)

            r2_square = r2_score(y_test, predicted)

            results_df = pd.DataFrame({"y_test": y_test, "predicted": predicted})
            return (r2_square, results_df)


        except Exception as e:
            raise CustomException(e, sys)