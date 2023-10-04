from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__, static_url_path='',
            static_folder='static',
            template_folder='templates')

@app.route('/', methods=['GET', 'POST'])
def home():
    if (request.method == 'GET'):
        data = "Hello World"
    return jsonify({'data': data})

@app.route('/sensor_data', methods=['GET'])
def get_sensor_data():
    try:
        csv_file = 'static\sensor_data.csv'
        df = pd.read_csv(csv_file)

        data = {}

        for index, row in df.iterrows():
            date = row['Date']
            time = row['Time']
            temp = row['Temperature']
            hum = row['Humidity']
            tds = row['TDS Value']
            ph = row['pH Level']

            # Check if the date already exists in data
            if date in data:
                # Check if the time already exists for the given date
                if time not in data[date]:
                    data[date][time] = {
                        "Temperature": temp,
                        "Humidity": hum,
                        "TDS Value": tds,
                        "pH Level": ph
                    }
            else:
                data[date] = {
                    time: {
                        "Temperature": temp,
                        "Humidity": hum,
                        "TDS Value": tds,
                        "pH Level": ph
                    }
                }

        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)})



if __name__ == '__main__':
    app.run(port=5050, debug=True)