from flask import Flask, request, render_template, flash, redirect, session
import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler
from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

application = Flask(__name__)

app = application

app.secret_key = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f4'
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

                return render_template('index.html', grouped_predictions=preds_dict)

            else:
                flash('Invalid file format. Please upload a CSV file.')
                return redirect(request.url)

        except Exception as e:
            # Handle exceptions and return an error message or redirect to an error page
            flash('An error occurred: {}'.format(str(e)))
            return redirect(request.url)
        


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)