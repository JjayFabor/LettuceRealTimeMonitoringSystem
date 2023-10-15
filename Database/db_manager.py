import sqlite3

DATA_DIRECTORY = "Database"
DATABASE_NAME = "sensor_data.db"


# Establish a connection to the SQLite Database
def connect_to_database():
    conn = sqlite3.connect(DATABASE_NAME)
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