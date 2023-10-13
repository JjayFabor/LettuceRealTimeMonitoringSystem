const charts = {}

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

            if (
                sensorData.temp &&
                sensorData.humidity &&
                sensorData.tds &&
                sensorData.ph &&
                sensorData.timestamps
            ) {
                // Get the latest index (assumes timestamps are in ascending order)
                const latestIndex = sensorData.timestamps.length - 1;

                // Get the latest sensor values
                const latestData = {
                    temp: sensorData.temp[latestIndex],
                    humidity: sensorData.humidity[latestIndex],
                    tds: sensorData.tds[latestIndex],
                    ph: sensorData.ph[latestIndex],
                    timestamps: sensorData.timestamps[latestIndex],
                };

                // Update the HTML elements with new sensor values
                document.querySelector('.temp-value').textContent = latestData.temp;
                document.querySelector('.hum-value').textContent = latestData.humidity;
                document.querySelector('.tds-value').textContent = latestData.tds;
                document.querySelector('.ph-value').textContent = latestData.ph;
                // Update real-time charts (assuming this function exists)
                updateRealTimeCharts(latestData);
            }
        })
        .catch((error) => {
            console.error('There has been a problem with your fetch operation:', error);
        })
    setInterval(updateData, 10000);
}

// Function to update the real time data chart
function updateRealTimeCharts(sensorData){
    const timeStamps = sensorData.timestamps;
    const realTemp = parseFloat(sensorData.temp);
    const realHum = parseFloat(sensorData.humidity);
    const realTds = parseFloat(sensorData.tds);
    const realPh = parseFloat(sensorData.ph);

    charts.realTimetempHumChart.data.labels.push(timeStamps);
    charts.realTimetempHumChart.data.datasets[0].data.push(realTemp);
    charts.realTimetempHumChart.data.datasets[1].data.push(realHum);
    charts.realTimetempHumChart.update();

    charts.realTimetdsChart.data.labels.push(timeStamps);
    charts.realTimetdsChart.data.datasets[0].data.push(realTds);
    charts.realTimetdsChart.update();

    charts.realTimephChart.data.labels.push(timeStamps);
    charts.realTimephChart.data.datasets[0].data.push(realPh);
    charts.realTimephChart.update();
}


// Function to initiate a empty real time charts
function initRealTimeCharts() {
    const crth = document.getElementById('realtime-temp-hum-chart').getContext('2d');
    const crds = document.getElementById('realtime-tds-chart').getContext('2d');
    const crph = document.getElementById('realtime-ph-chart').getContext('2d');

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
                    borderColor: '#2691DA',
                    backgroundColor: 'white',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.5,
                },
                {
                    label: 'Humidity',
                    data: [],
                    borderColor: '#F1C72C', 
                    borderWidth: 2,
                    backgroundColor: 'white',
                    fill: false,
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
                    borderColor: 'black',
                    fill: false,
                    borderWidth: 2, 
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
                borderColor: 'red',
                fill: false,
                borderWidth: 2,
                tension: 0.5,
            }]
        },
        plugins: [noData]
    });

    charts.realTimetempHumChart = realTimetempHumChart;
    charts.realTimetdsChart = realTimetdsChart;
    charts.realTimephChart = realTimephChart;
}

const timeElement = document.querySelector(".time");
const dateElement = document.querySelector(".date");

function formatTime(date) {
    const hours12 = date.getHours() % 12 || 12;
    const minutes = date.getMinutes();
    const isAM = date.getHours() < 12;

    return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${isAM ? "AM" : "PM"}`;
}

function formatDate(date) {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

setInterval(() => {
    const now = new Date();

    timeElement.textContent = formatTime(now);
    dateElement.textContent = formatDate(now)
}, 200);

document.addEventListener("DOMContentLoaded", function() {
    initRealTimeCharts();  
    updateData();
});

