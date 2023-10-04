let realTimeChart;
let zoomLevel = 'date';
let chart = null;
let selectedDate = null;
let ctx;
let globalData;

function updateData() {
    fetch('/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const sensorData = data;

            // Update historical data table
            const historicalData = document.getElementById('historical-data');
            historicalData.innerHTML = ''; // Clear previous data

            // Loop through historical data and create table rows
            for (let i = 0; i < sensorData.date.length; i++) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${sensorData.timestamps[i]}</td>
                    <td>${sensorData.date[i]}</td>
                    <td>${sensorData.temp[i]}</td>
                    <td>${sensorData.humidity[i]}</td>
                    <td>${sensorData.tds[i]}</td>
                    <td>${sensorData.ph[i]}</td>
                `;
                historicalData.appendChild(row);
            }

            // Create or update the real-time data chart
            if (!realTimeChart) {
                realTimeChart = new Chart(document.getElementById("realTimeChart"), {
                    type: "line",
                    data: {
                        labels: sensorData.timestamps,
                        datasets: [
                            {data: sensorData.temp.map(parseFloat), label: "Temperature", borderColor: "#8e5ea2", fill: false},
                            {data: sensorData.humidity.map(parseFloat), label: "Humidity", borderColor: "#3cba9f", fill: false},
                            {data: sensorData.tds.map(parseFloat), label: "TDS Value", borderColor: "#e8c3b9", fill: false},
                            {data: sensorData.ph.map(parseFloat), label: "pH Level", borderColor: "#c45850", fill: false},
                        ],
                    },
                    options: {
                        title: {display: true, text: "Real-time Sensor Data"},
                        hover: {mode: "index", intersect: true},
                    },
                });
            } else {
                realTimeChart.data.labels = sensorData.timestamps;
                realTimeChart.data.datasets[0].data = sensorData.temp.map(parseFloat);
                realTimeChart.data.datasets[1].data = sensorData.humidity.map(parseFloat);
                realTimeChart.data.datasets[2].data = sensorData.tds.map(parseFloat);
                realTimeChart.data.datasets[3].data = sensorData.ph.map(parseFloat);
                realTimeChart.update();
            }
        })
        .catch((error) => {
            console.error('There has been a problem with your fetch operation:', error);
        })
    setInterval(updateData, 60000); // Update data and chart every 61 seconds
}

// Function to call or get the prediction of the lettuce growth day and display
function fetchPredictions() {
    // Fetch predictions by making a POST request to the server
    fetch('/', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        // Check for error in the response
        if (data.error) {
            alert(data.error);
            return;
        }
        // Update the prediction display
        document.getElementById('predictionDisplay').innerText = "The predicted value is: " + data.predictions;
    })
    .catch(error => {
        console.error('Error fetching predictions:', error);
    });
}


function initializeCanvas() {
    ctx = document.getElementById('myChart');
    if (ctx === null) {
        console.error('Element with id "myChart" not found.');
        return;
    }
    console.log('Canvas initialized.');
}

// Zoom configuration
let zoomConfig = {
    mode: 'x',
    zoom: {
        wheel: {
            enabled: true,
        },
        pinch: {
            enabled: true,
        },
        // ... (your existing properties)
        onZoom: function ({ chart }) {
            console.log("Zoom event Triggered.");
            console.log(chart.scales); // Log the scales to debug

            // Determine if we should switch between date and time level granularity
            const xScale = chart.scales['x-axis-0'] || chart.scales.x;
            
            if (!xScale) {
                console.error("Could not find x-axis scale");
                return;
            }

            const pixelRange = xScale.right - xScale.left;
            const dataRange = xScale.max - xScale.min;
            const ratio = pixelRange / dataRange;

            if (ratio < 0.05) {
                zoomLevel = 'time';
            } else {
                zoomLevel = 'date';
            }

            updateChartData(zoomLevel, selectedDate);

            console.log("Zoom level changed to: ", zoomLevel); // Debugging line
        },
    },
};


// Function to prepare the data
function prepareData(zoomLevel, selectedDate, data) {
    let labels = [];
    let datasets = {
        'Temperature': [],
        'Humidity': [],
        'TDS Value': [],
        'pH Level': [],
        'Time': [],
    };

    if (zoomLevel === 'date') {
        // Logic for daily data
        let dailyData = {};

        data.forEach(function (entry) {
            const date = new Date(entry.Date).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    'Temperature': 0,
                    'Humidity': 0,
                    'TDS Value': 0,
                    'pH Level': 0,
                    'count': 0
                };
            }

            dailyData[date]['Temperature'] += parseFloat(entry.Temperature);
            dailyData[date]['Humidity'] += parseFloat(entry.Humidity);
            dailyData[date]['TDS Value'] += parseFloat(entry['TDS Value']);
            dailyData[date]['pH Level'] += parseFloat(entry['pH Level']);
            dailyData[date]['count']++;
        });

        labels = Object.keys(dailyData);

        labels.forEach((label) => {
            datasets['Temperature'].push(dailyData[label]['Temperature'] / dailyData[label]['count']);
            datasets['Humidity'].push(dailyData[label]['Humidity'] / dailyData[label]['count']);
            datasets['TDS Value'].push(dailyData[label]['TDS Value'] / dailyData[label]['count']);
            datasets['pH Level'].push(dailyData[label]['pH Level'] / dailyData[label]['count']);
        });

    } else if (zoomLevel === 'time') {
        // Logic for minute-hourly data for a specific day
        const filteredData = data.filter(entry => new Date(entry.Date).toDateString() === selectedDate);

        labels = filteredData.map(entry => entry.Time);

        filteredData.forEach((entry) => {
            datasets['Temperature'].push(parseFloat(entry.Temperature));
            datasets['Humidity'].push(parseFloat(entry.Humidity));
            datasets['TDS Value'].push(parseFloat(entry['TDS Value']));
            datasets['pH Level'].push(parseFloat(entry['pH Level']));
            datasets['Time'].push(entry.Time);
        });
    }
    
    console.log("Zoom Level: ", zoomLevel);
    console.log("Selected Date: ", selectedDate);
    console.log("Labels: ", labels);
    console.log("Datasets: ", datasets);

    return { labels, datasets };
}



// Function to create the chart with one data point per day
function makeChart(zoomLevel, selectedDate, data) {
    const { labels, datasets } = prepareData(zoomLevel, selectedDate, data);

    const chartDatasets = Object.keys(datasets).map((key) => {
        return {
            data: datasets[key],
            label: key,
            borderColor: key === 'Temperature' ? "#8e5ea2" : key === 'Humidity' ? "#3cba9f" : key === 'TDS Value' ? "#e8c3b9" : "#e83e8c",
            fill: false,
            tension: 0.1,
        };
    });

    if (selectedDate && zoomLevel === 'time') {
        // Include 'Time' in labels when zoomed in
        labels.forEach((label, index) => {
            labels[index] = `${label} ${selectedDate.toLocaleDateString()}`;
        });
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: chartDatasets,
        },
        options: {
            title: {
                display: true,
                text: "Sensor Data Timeline",
            },
            hover: {
                mode: "index",
                intersect: true,
            },
            plugins: {
                zoom: zoomConfig,
            },
        },
    });
}

function updateChartData(zoomLevel, selectedDate) {
    const { labels, datasets } = prepareData(zoomLevel, selectedDate, globalData);
    console.log("Global data: ", globalData);
    console.log("Labels", labels);
    console.log("Datasets", datasets);

    if (zoomLevel === 'time') {
        // Include 'Time' in labels when zoomed in
        labels.forEach((label, index) => {
            labels[index] = `${label} ${selectedDate.toLocaleDateString()}`;
        });
    }


    chart.data.labels = labels;
    chart.data.datasets.forEach((dataset, index) => {
        const key = Object.keys(datasets)[index];
        dataset.data = datasets[key];
    });
    
    chart.update();
}

// Function display the chart
function displayChart() {
    d3.csv('./sensor_data.csv')
    .then(function(data) {
        globalData = data;
        makeChart('date', null, globalData);
    })
    .catch(function(error) {
        console.error("Error loading CSV data:", error);
    });
}

// Function to when transferButton is clicked
function tranferData() {
    document.getElementById("transferButton").addEventListener("click", function() {
        fetch("/transfer", {
            method: "POST",
        })
        .then(response => {
            // Check if the response has the "application/json" content type
            if (response.headers.get("content-type") && response.headers.get("content-type").includes("application/json")) {
                return response.json();
            } else {
                // If not JSON, treat it as text
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
        })
        .then(data => {
            if (data.status === "success") {
                alert("Data transfer successful");
                displayChart();
            } else if (data.status === "error") {
                alert("Error during transfer: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error.message);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initializeCanvas();
    displayChart();

    updateData(); // Initial data retrieval

    tranferData();
});