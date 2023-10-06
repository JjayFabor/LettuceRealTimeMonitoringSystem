const charts = {}
let tempHumChart, tdsChart, phChart;

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

// Function to when transferButton is clicked
function tranferData() {
    document.getElementById("transferButton").addEventListener("click", function() {
        fetch("/transfer", {
            method: "POST",
        })
        .then(response => {
            if (response.headers.get("content-type") && response.headers.get("content-type").includes("application/json")) {
                return response.json();
            } else {
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
        })
        .then(data => {
            if (data.status === "success")  {
                alert("Data transfer successful");
                sensor();
            }      
            else if (data.status === "error") {
                alert("Error during transfer: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error.message);
        });
    });
}

// Function to update the data realtime
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

            updateRealTimeCharts(sensorData);
        })
        .catch((error) => {
            console.error('There has been a problem with your fetch operation:', error);
        })
    setInterval(updateData, 10000);
}

// Function to update the charts of the real time data
function updateRealTimeCharts(sensorData, realTimetempHumChart, realTimetdsChart, realTimephChart){
    const realTimeDates = [];
    const timeStamps = sensorData.timestamps;
    const realTemps = sensorData.temp.map(parseFloat);
    const realHums = sensorData.humidity.map(parseFloat);
    const realTds = sensorData.tds.map(parseFloat);
    const realPh = sensorData.ph.map(parseFloat);

    console.log('Time: ', timeStamps);
    console.log('Temperature', realTemps)
    
    charts.realTimetempHumChart.data.labels = timeStamps;
    charts.realTimetempHumChart.data.datasets[0].data = realTemps;
    charts.realTimetempHumChart.data.datasets[1].data = realHums;
    charts.realTimetempHumChart.update();

    // Update the real-time TDS chart
    charts.realTimetdsChart.data.labels = timeStamps;
    charts.realTimetdsChart.data.datasets[0].data = realTds;
    charts.realTimetdsChart.update();

    // Update the real-time pH chart
    charts.realTimephChart.data.labels = timeStamps;
    charts.realTimephChart.data.datasets[0].data = realPh;
    charts.realTimephChart.update();
}

// Function to initiate a empty real time charts
function initRealTimeCharts() {
    const crth = document.getElementById('realtime-temp-hum-chart').getContext('2d');
    const crds = document.getElementById('realtime-tds-chart').getContext('2d');
    const crph = document.getElementById('realtime-ph-chart').getContext('2d');
    //const ctp = document.getElementById('prevChart').getContext('2d');

    const noData = {
        id: 'noData',
        beforeDraw: ((chart, args, plugins) => {
            const { ctx, data, chartArea: {top, bottom, left, right, width, height} } = chart;
            
            ctx.save();
    
            if (data.datasets[0].data.length === 0) {
                ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                ctx.fillRect(left, top, width, height);
        
                ctx.restore();

                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText('No Data Available', left + (width / 2), top + (height / 2));
            }
        })
    };        

    const realTimetempHumChart = new Chart(crth, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    tension: 0.5,
                },
                {
                    label: 'Humidity',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    borderWidth: 1,
                    tension: 0.5,
                }
            ]
        },
        plugins: [noData]
    });

    const realTimetdsChart = new Chart(crds, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'TDS Value',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    borderWidth: 1, 
                    tension: 0.5,
                },
            ]
        },
        plugins: [noData]
    });

    const realTimephChart = new Chart(crph, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'pH Level',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                borderWidth: 1,
                tension: 0.5,
            }]
        },
        plugins: [noData]
    });

    charts.realTimetempHumChart = realTimetempHumChart;
    charts.realTimetdsChart = realTimetdsChart;
    charts.realTimephChart = realTimephChart;
    // return { realTimetempHumChart, realTimetdsChart, realTimephChart };
}

// Function to initiate a empty previous data charts
function initCharts() {
    const ctth = document.getElementById('temp-hum-chart').getContext('2d');
    const ctds = document.getElementById('tds-chart').getContext('2d');
    const ctph = document.getElementById('ph-chart').getContext('2d');

    const noData = {
        id: 'noData',
        beforeDraw: ((chart, args, plugins) => {
            const { ctx, data, chartArea: {top, bottom, left, right, width, height} } = chart;
            
            ctx.save();
    
            if (data.datasets[0].data.length === 0) {
                ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
                ctx.fillRect(left, top, width, height);
        
                ctx.restore();

                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText('No Data Available', left + (width / 2), top + (height / 2));
            }
        })
    };        

    const tempHumChart = new Chart(ctth, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    tension: 0.5,
                },
                {
                    label: 'Humidity',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    borderWidth: 1,
                    tension: 0.5,
                }
            ]
        },
        plugins: [noData]
    });

    const tdsChart = new Chart(ctds, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'TDS Value',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    borderWidth: 1, 
                    tension: 0.5,
                },
            ]
        },
        plugins: [noData]
    });

    const phChart = new Chart(ctph, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'pH Level',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                borderWidth: 1,
                tension: 0.5,
            }]
        },
        plugins: [noData]
    });

    return { tempHumChart, tdsChart, phChart };
}

// Function to change populate the chart for the sensor data
function populateData(records) {
    const temps = [];
    const hums = [];
    const tds = [];
    const ph = [];
    const times = [];
    
    records.forEach(record => {
        times.push(record.Time);
        temps.push(record.Temperature);
        hums.push(record.Humidity);
        tds.push(record['TDS Value']);
        ph.push(record['pH Level']);
    });

    return { temps, hums, tds, ph, times };
}

// Function to update the charts sensor data for 5 mins sensor 
function updateCharts(data, tempHumChart, tdsChart, phChart, labelType) {
    const { temps, hums, tds, ph, times } = populateData(data[0].Records);
    const labels = labelType === 'time' ? times : data.map(entry => entry.Date);

    tempHumChart.data.labels = labels;
    tempHumChart.data.datasets[0].data = temps;
    tempHumChart.data.datasets[1].data = hums;
    tempHumChart.update();

    tdsChart.data.labels = labels;
    tdsChart.data.datasets[0].data = tds;
    tdsChart.update();

    phChart.data.labels = labels;
    phChart.data.datasets[0].data = ph;
    phChart.update();
}

// Function to retrieve the sensor data in the API and update the chart.
function sensor() {
    fetch('http://127.0.0.1:5000/api/data')
    .then(response => response.json())
    .then(data => {
        updateCharts(data, tempHumChart, tdsChart, phChart, 'date');
    })
    .catch(error => console.log(error));
}


document.getElementById("daily-button").addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/api/data')
    .then(response => response.json())
    .then(data => {
        updateCharts(data, tempHumChart, tdsChart, phChart, 'date');
    })
    .catch(error => console.log(error));
});

document.getElementById("mins-button").addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/api/data')
    .then(response => response.json())
    .then(data => {
        updateCharts(data, tempHumChart, tdsChart, phChart, 'time');
    })
    .catch(error => console.log(error));
});


document.addEventListener("DOMContentLoaded", function() {
    const { tempHumChart: initialTempHumChart, tdsChart: initialTdsChart, phChart: initialPhChart } = initCharts();
    tempHumChart = initialTempHumChart;
    tdsChart = initialTdsChart;
    phChart = initialPhChart;

    initRealTimeCharts();
    sensor();
    
    updateData();

    tranferData();
});