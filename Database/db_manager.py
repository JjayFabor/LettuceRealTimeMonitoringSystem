import sqlite3
import os

DATA_DIRECTORY = "Database"
DATABASE_NAME = "sensor_data.db"
BATCH_NUMBER_FILE = "current_batch.txt"

DATABASE_PATH = os.path.join(DATA_DIRECTORY, DATABASE_NAME)
BATCH_FILE_PATH = os.path.join(DATA_DIRECTORY, BATCH_NUMBER_FILE)

# Establish a connection to the SQLite Database
def connect_to_database():
    conn = sqlite3.connect(DATABASE_PATH)
    return conn

# Create sensor data table if not exist
def create_table_for_new_batch(batch_number):
    conn = connect_to_database()
    cursor = conn.cursor()
    table_name = f"batch_{batch_number}"

    try:
        cursor.execute(f'''  
            CREATE TABLE IF NOT EXISTS {table_name} (
                Time TEXT,
                Date TEXT,
                Temperature REAL,
                Humidity REAL,
                TDS_Value REAL,
                pH_Level REAL
            );
        ''')

        conn.commit()
        print(f"Table {table_name} created successfully.")
    except Exception as e:
        print(f"Error creating table {table_name}: {e}")
    finally:
        conn.close()

# Create a batch info table
def create_batch_info_table():
    conn = connect_to_database()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS batch_info (
            batch_number INTEGER PRIMARY KEY,
            table_name TEXT NOT NULL
        );
    ''')

    conn.commit()
    conn.close()


def get_current_batch_number():
    try:
        with open(BATCH_FILE_PATH, 'r') as f:
            return int(f.read().strip())
    except FileNotFoundError:
          return 1
    

def update_batch_number(new_batch_number):
    with open(BATCH_FILE_PATH, 'w') as f:
        f.write(str(new_batch_number))


def on_new_batch_button_click():
    current_batch_number = get_current_batch_number()

    # Increment the batch number for the next batch
    new_batch_number = current_batch_number + 1
    create_table_for_new_batch(new_batch_number)
    update_batch_number(new_batch_number)

    # Update the batch_info table
    conn = connect_to_database()
    cursor = conn.cursor()
    table_name = f'batch_{new_batch_number}'

    cursor.execute('''
        INSERT INTO batch_info (batch_number, table_name)
        VALUES (?,?);
    ''', (new_batch_number, table_name))

    conn.commit()
    conn.close()