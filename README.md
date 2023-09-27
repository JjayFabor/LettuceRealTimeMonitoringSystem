# Thesis Project 
# Lettuce Growth Day Prediction Web Application

This web application uses Flask to deploy a Machine Learning (ML) algorithm for predicting lettuce growth days based on input data. Users can upload a CSV file containing relevant data, and the application will provide predictions for each plant's growth days.

## Prerequisites

- Python 3.7 or higher

## Getting Started

Follow these steps to get the application up and running on your local machine.

1. Clone this repository to your local machine using Git or download the code as a ZIP file.

   ```bash
   git clone https://github.com/your-username/lettuce-growth-prediction.git
   cd lettuce-growth-prediction
   pip install -r requirements.txt
   python app.py

How to Use

  1. Access the homepage by visiting http://localhost:5000/.
  2. Click on "Upload a CSV File" to select and upload your CSV file containing data for lettuce growth prediction.
  3. Once the file is uploaded, the application will process the data and provide predictions for each plant's growth days.
  4. The predictions will be displayed in a table format, showing the "Plant ID" and the corresponding "Predicted Growth Days."

Data Format

Ensure that your CSV file follows the correct format for input data:

  * The CSV file should contain a "Plant_ID" column, which uniquely identifies each plant.
  * Make sure that it does not have the "Growth Days" column
  * Other columns should include relevant features required for prediction.
