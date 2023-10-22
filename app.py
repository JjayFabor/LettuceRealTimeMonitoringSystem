from flask import Flask, request, render_template, jsonify, send_file
import pandas as pd
import serial
import time
import time
from datetime import datetime

from Database.db_manager import create_table_if_not_exists, connect_to_database
from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

app = Flask(__name__, static_url_path='',
            static_folder='static',
            template_folder='templates')

app.secret_key = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f78'


# Define constants
sensor_data = {
        'date': [],
        'temp': [],
        'humidity': [],
        'tds': [],
        'ph': [],
        'timestamps': []
}
DATA_DIRECTORY = "Database"
DATABASE_NAME = "sensor_data.db"

# Global Variables
receiving_file = False
arduino = None
last_update_time = None

# Initialize serial port connection
try:
    arduino = serial.Serial('COM3', 9600, timeout=1)
    if arduino.is_open:
        print("Serial port connected.")
    else:
        raise Exception("Serial port not opened.")
except Exception as e:
    print(f"Could not initialize the serial port: {e}")
    arduino = None

@app.route('/')
def dashboard():
    return render_template('realtime.html')

@app.route('/historicaldata')
def historicaldata():
    return render_template('historicaldata.html')

@app.route('/growthPred')
def growthPred():
    return render_template('growthPred.html')

# Function to get the real time data
@app.route('/data')
def data():
    global arduino
    global sensor_data
    latest_sensor_data = {}
        
    try:
        if arduino is None:
            raise Exception("Serial port not connected.")
        else:
            raw_data = arduino.readline().decode().strip()
            print(f"Raw Data: {raw_data}")

            # Ignore and continue if raw_data is empty 
            if not raw_data:
                print("Ignored empty raw_data.")
                return jsonify(latest_sensor_data)  # Return the initialized empty dictionary

            if raw_data.startswith("RT,"):
                # Slice and split or remove the 'PY,Time'
                real_time_data = raw_data[9:].split(',')
                print("Real-time Data: ", real_time_data)

                expected_length = len(sensor_data.keys()) - 1  # Exclude 'timestamps'
                if len(real_time_data) != expected_length:
                    raise Exception(f"Invalid data received: {real_time_data}")

                current_time = datetime.now().strftime('%H:%M:%S')
                print(f"Current time: {current_time}")

                sensor_data['timestamps'].append(current_time)

                for key, value in zip(sensor_data.keys(), real_time_data):
                    if key != 'timestamps':
                        if value.lower() != 'undefined':
                            sensor_data[key].append(value)

                latest_sensor_data['timestamps'] = [sensor_data['timestamps'][-1]]

                for key in sensor_data.keys():
                    if key != 'timestamps':
                        latest_sensor_data[key] = [sensor_data[key][-1]]

            else:
                print("Data does not have the expected prefix (PY,) and will be ignored.")

        print("Sensor Data: ", sensor_data)
        print("Latest Sensor Data: ", latest_sensor_data)
        return jsonify(latest_sensor_data)
    
    except Exception as e:
        return jsonify(error=str(e)) 
    
# Function to display the predicted growth days
@app.route('/growthPred', methods=['GET', 'POST'])
def predict_datapoint():
    if request.method == 'GET':
        return render_template('growthPred.html', predictionDisplay="The predicted value will be displayed here.")
    else:
        try: 
            custom_data = CustomData(csv_file_path='sensor_data.csv')
            csv_file = custom_data.export_to_csv()
            
            data_df = pd.read_csv(csv_file)
            
            # drop the 'Time' header here
            data_df.drop('Time', axis=1)

            # Call PredictPipeline() to predict the growth days
            predict = PredictPipeline()
            preds = predict.predict_days(data_df)

            return jsonify(predictions=preds)
        except Exception as e:
            return jsonify(error=str(e))
        
@app.route('/download_csv', methods=['GET'])
def download_csv():
    try: 
        return send_file('Database/sensor_data.csv', as_attachment=True)
    except Exception as e:
        return jsonify(error=str(e))

# Function to transfer the sensor data of arduino to database
@app.route('/transfer/db', methods=['POST'])
def transfer_to_database():
    global arduino, last_update_time
    print("Start transferring...")

    try:
        create_table_if_not_exists()

        with connect_to_database() as conn:
            cursor = conn.cursor()

            arduino.write(f"SEND_FILE\n".encode('utf-8'))

            data_received = False

            while True:
                transfer_line = arduino.readline().decode('utf-8').strip()
                print(f"Raw data: {transfer_line}")
                
                if transfer_line == 'SEND_FILE':
                    print("SEND_FILE detected")
                    continue
                elif transfer_line.startswith("RT,"):
                    print("PY, line detected and skipped")
                    continue
                elif transfer_line == 'EOF':
                    print("End of file received.")
                    break
                elif transfer_line:
                    data = transfer_line.split(',')

                    if len(data) == 6:
                        cursor.execute(
                            'INSERT INTO sensor_data (Time, Date, Temperature, Humidity, TDS_Value, pH_Level) '
                            'VALUES (?, ?, ?, ?, ?, ?)',
                            (data[0], data[1], data[2], data[3], data[4], data[5])
                        )
                        conn.commit()
                        data_received = True
                    else:
                        print("Incomplete or incorrect data received")
                else:
                    print("No data received")

            if data_received:
                print("Data transfer complete.")
                return jsonify({'status': 'success'})
            else:
                print("No new data received.")
                return jsonify({'status': 'no_data', 'message': 'No new data received.'})
    
    except Exception as e:
        print("Error: " + str(e))
        return jsonify({'status': 'error', 'message': str(e)})

# Create an API to store the sensor data
@app.route('/api/data', methods=['GET'])
def get_sensor_data():
    try:
        conn = connect_to_database()
        cursor = conn.cursor()
    
        # Execute SQL query to fetch all records
        cursor.execute("SELECT * FROM sensor_data")
        records = cursor.fetchall()

        data = {}

        for record in records:
            date = record[1]
            time = record[0]
            temp = record[2]
            hum = record[3]
            tds = record[4]
            ph = record[5] 

            # Check if the date already exists in data
            if date not in data:
                data[date] = {
                    "Date": date,
                    "Records": []
                }
            data[date]['Records'].append({
                "Time": time,
                "Temperature": temp,
                "Humidity": hum,
                "TDS Value": tds,
                "pH Level": ph
            })

            transformed_data = list(data.values())

        return jsonify(transformed_data)
    
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True) # host='0.0.0.0', debug=True
