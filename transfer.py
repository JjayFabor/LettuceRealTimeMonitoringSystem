import serial
import time
import csv

# Set the appropriate COM port and baud rate
ser = serial.Serial('COM3', 9600)
time.sleep(2)  # Wait for the Serial connection to initialize

# Send command to Arduino to retrieve the file
ser.write("GET_FILE\n".encode('utf-8'))

start_marker_found = False
end_marker_found = False

with open("Arduino\sensor_data.csv", "w", newline='', encoding='utf-8') as file:
    csv_writer = csv.writer(file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    
    while not end_marker_found:
        line = ser.readline().decode('utf-8').strip()
        
        # Check for start and end markers
        if line == "START_FILE":
            start_marker_found = True
            continue
        elif line == "END_FILE":
            end_marker_found = True
            break
        
        # Save only if inside the markers
        if start_marker_found:
            data = line.split(',')  # Split the data into fields if it's comma-separated
            csv_writer.writerow(data)

ser.close()
print("File saved to sensor_data.csv")
