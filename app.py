from flask import Flask, request, render_template, jsonify, send_file, url_for, redirect, flash, session
# from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
import pandas as pd
import serial
from datetime import datetime
import threading
import os

import customtkinter as ctk
import webbrowser
import tkinter.messagebox as tkmb
import requests



from Database.db_manager import create_table_if_not_exists, connect_to_database
from MLAlgo.src.pipeline.predict_pipeline import CustomData, PredictPipeline

app = Flask(__name__, static_url_path='',static_folder='static',template_folder='templates')

app.config['SECRET_KEY'] = 'c2a414bae58f626702e45f483f5cf295b9d006455448b1f78'

# class User(UserMixin):
#     def __init__(self, user_id):
#         self.id = user_id

# USERNAME = "group6_admin"
# PASSWORD = hashlib.sha256("group6_admin1234".encode()).hexdigest()

# Initialized Flask-Login
# login_manager = LoginManager()
# login_manager.init_app(app)
# login_manager.login_view = 'login'

# @login_manager.user_loader
# def load_user(user_id):
#     return User(user_id)

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

# @app.route('/', methods=['GET', 'POST'])
# def index():
    # if request.method == 'POST':
    #     username = request.form['username']
    #     provided_password = request.form['password']
    #     hashed_provided_password = hashlib.sha256(provided_password.encode()).hexdigest()

    #     if username == USERNAME and hashed_provided_password == PASSWORD:
    #         user = User(1)
    #         login_user(user)
    #         return redirect(url_for('dashboard'))
    #     else:
    #         flash("Invalid username or password", "error")
    # return render_template('login.html')

# @app.route('/logout', methods=['GET', 'POST'])
# @login_required
# def logout():
    # logout_user()

    # session.clear()

    # return redirect(url_for('index'))

@app.route('/')
# @login_required
def index():
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

flask_process = None

# Function to gracefully shutdown the Flask app
@app.route('/shutdown', methods=['POST'])
def shutdown():
    try:
        print("Shutting down the server...")
        os.kill(os.getpid(), 9)
        return 'Server shutting down...'
    except Exception as e:
        print(f"Error during shutdown: {str(e)}")


# Your Flask process
def run_flask_app():
    app.run(host='0.0.0.0', port=8000)

# defining the login function
def login():
    # pre-defined username
    username = "admin"
    # pre-defined password
    password = "admin1234"

    if user_entry.get() == username and user_pass.get() == password:
        #run_flask_app()
        # Start the Flask app in the main thread
        app_thread = threading.Thread(target=run_flask_app)
        app_thread.start()

        # Open the browser in a new thread
        def open_browser():
            url = "http://localhost:8000"
            webbrowser.open(url)

        browser_thread = threading.Thread(target=open_browser)
        browser_thread.start()
    elif user_entry.get() == username and user_pass.get() != password:
        tkmb.showwarning(title='Wrong password', message='Please check your password')

    elif user_entry.get() != username and user_pass.get() == password:
        tkmb.showwarning(title='Wrong username', message='Please check your username')

    else:
        tkmb.showerror(title="Login Failed", message="Invalid Username and password")

# Function to send a POST request to the /shutdown endpoint
def shutdown_server():
    try:
        response = requests.post("http://localhost:8000/shutdown")
        if response.status_code == 200:
            print("Server is shutting down...")
        else:
            print("Failed to shut down the server.")
    except requests.exceptions.ConnectionError:
        print("Server shut down.")

# Function to handle the window close event
def on_closing():
    shutdown_server()
    root.destroy()

if __name__ == '__main__':
    root = ctk.CTk()

    # Start the Flask app in a separate thread
    flask_thread = threading.Thread(target=run_flask_app)

    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    # Set the label font with a tuple
    label = ctk.CTkLabel(root, text="Lettuce Realtime Monitoring System", font=("Nunito Sans", 30, "bold"))
    label.pack(pady=20)

    # Create a frame
    frame = ctk.CTkFrame(master=root)
    frame.pack(pady=20, padx=40, fill='both', expand=True)

    # Set the label inside the frame
    label = ctk.CTkLabel(master=frame, text='Login Authentication System', font=("Nunito Sans", 20))
    label.pack(pady=12, padx=10)

    # Create the text box for taking
    # username input from user
    user_entry = ctk.CTkEntry(master=frame, placeholder_text="Username")
    user_entry.pack(pady=12, padx=10)

    # Create a text box for taking
    # password input from user
    user_pass = ctk.CTkEntry(master=frame, placeholder_text="Password", show="*")
    user_pass.pack(pady=12, padx=10)

    # Create a login button to login
    button = ctk.CTkButton(master=frame, text='Login', command=login)
    button.pack(pady=12, padx=10)

    # Create the Tkinter GUI
    root.title("Login")

    # Set the window size to 600x600
    root.geometry("600x600")

    # Calculate the window position to center it on the screen
    window_width = 600
    window_height = 400
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width // 2) - (window_width // 2)
    y = (screen_height // 2) - (window_height // 2)

    # Set the window position
    root.geometry(f"{window_width}x{window_height}+{x}+{y}")

    root.protocol("WM_DELETE_WINDOW", on_closing)

    root.mainloop()

