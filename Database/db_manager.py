import sqlite3
import os

DATA_DIRECTORY = "Database"
DATABASE_NAME = "sensor_data.db"

DATABASE_PATH = os.path.join(DATA_DIRECTORY, DATABASE_NAME)

# Establish a connection to the SQLite Database
def connect_to_database():
    conn = sqlite3.connect(DATABASE_PATH)
    return conn

# Create sensor data table if not exist
def create_table_if_not_exists():
    conn = connect_to_database()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data(
            Time TEXT,
            Date TEXT,
            Temperature REAL,
            Humidity REAL,
            TDS_Value REAL,
            pH_Level REAL
        );
    ''')

    conn.commit()
    conn.close()