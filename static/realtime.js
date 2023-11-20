const charts = {};
let chart1Obj, chart2Obj, chart3Obj; 
let isInternalNavigation = false;
let isInitialized = false;


if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function(error) {
        console.log('Service Worker registration failed:', error);
    });
        // Listen for messages from the Service Worker
        navigator.serviceWorker.addEventListener('message', function(event) {
        let storedData = JSON.parse(localStorage.getItem('sensorData')) || {};
        if (event.data.type === 'DATA_UPDATED') {
            const fetchedData = event.data.payload;
            console.log('Fetched Data: ', fetchedData);

            // Merge fetched data with stored data
            for (let key in fetchedData) {
                if (Array.isArray(fetchedData[key])) {
                    if (storedData[key]) {
                        storedData[key] = storedData[key].concat(fetchedData[key]);
                    } else {
                        storedData[key] = fetchedData[key];
                    }
                }
        }

        // Update local storage
        localStorage.setItem('sensorData', JSON.stringify(storedData));
        console.log('Updated local storage', storedData);
        }
        updateRealTimeData(storedData);
    });
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
        plugins: [noData],
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                    },
                },
                tooltip: {
                    enabled: true,
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        pinch: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    },
                },
            },
            responsive: true, 
        },
    });

    const realTimetdsChart = new Chart(crds, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'TDS Value',
                    data: [],
                    borderColor: '#90EE90',
                    fill: false,
                    borderWidth: 2, 
                    tension: 0.5,
                },
            ]
        },
        plugins: [noData],
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                    },
                },
                tooltip: {
                    enabled: true,
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        pinch: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    },
                },
            },
            responsive: true, 
        },
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
        plugins: [noData],
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                    },
                },
                tooltip: {
                    enabled: true,
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        pinch: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                        },
                        mode: 'x',
                    },
                },
            },
            responsive: true, 
        },
    });

    charts.realTimetempHumChart = realTimetempHumChart;
    charts.realTimetdsChart = realTimetdsChart;
    charts.realTimephChart = realTimephChart;

    // Initialize chart objects
    chart1Obj = realTimetempHumChart;
    chart2Obj = realTimetdsChart;
    chart3Obj = realTimephChart;
}

function switchRealTimeChart(clickedChart) {
    console.log("Switch chart function called.");
    console.log("Clicked chart ID:", clickedChart.id);

    const chart1Div = document.getElementById('chart1');
    const chart2Div = document.getElementById('chart2');
    const chart3Div = document.getElementById('chart3');
    
    if (clickedChart.id === 'chart2') {
        chart2Div.appendChild(chart1Obj.ctx.canvas);
        chart1Div.appendChild(chart2Obj.ctx.canvas);
        chart1Obj.ctx.canvas.style.width = '100%';
        chart1Obj.ctx.canvas.style.height = '100%';

        chart2Obj.ctx.canvas.style.width = '100%';
        chart2Obj.ctx.canvas.style.height = '100%';

        chart2Obj.options.maintainAspectRatio = true;

        const tempChart = chart1Obj;
        chart1Obj = chart2Obj;
        chart2Obj = tempChart;
    } else if (clickedChart.id === 'chart3') {
        chart3Div.appendChild(chart1Obj.ctx.canvas);
        chart1Div.appendChild(chart3Obj.ctx.canvas);
        chart1Obj.ctx.canvas.style.width = '100%';
        chart1Obj.ctx.canvas.style.height = '100%';
        chart3Obj.ctx.canvas.style.width = '100%';
        chart3Obj.ctx.canvas.style.height = '100%';
        const tempChart = chart1Obj;
        chart1Obj = chart3Obj;
        chart3Obj = tempChart;
    }

    chart1Obj.ctx.canvas.id = 'chart1';
    chart2Obj.ctx.canvas.id = 'chart2';
    chart3Obj.ctx.canvas.id = 'chart3';

    chart1Obj.resize();
    chart2Obj.resize();
    chart3Obj.resize(); 
}

// Add an event listener to divChart1 to call switchRealTimeChart when clicked
let divChart1 = document.getElementById('chart1');
divChart1.addEventListener('click', function () {
    switchRealTimeChart(this);
});

// Add an event listener to divChart2 to call switchRealTimeChart when clicked
let divChart2 = document.getElementById('chart2');
divChart2.addEventListener('click', function () {
    switchRealTimeChart(this);
});

// Add an event listener to divChart3 to call switchRealTimeChart when clicked
let divChart3 = document.getElementById('chart3');
divChart3.addEventListener('click', function () {
    switchRealTimeChart(this);
});

function updateRealTimeData(data, skipChartUpdate = false) {
    if(data.temp && data.humidity && data.tds && data.ph && data.timestamps) {
        const latestIndex = data.timestamps.length - 1;

        // Get the latest sensor values
        const latestData = {
            temp: data.temp[latestIndex],
            humidity: data.humidity[latestIndex],
            tds: data.tds[latestIndex],
            ph: data.ph[latestIndex],
            timestamps: data.timestamps[latestIndex],
        };

        // Update the HTML elements with new sensor values
        document.querySelector('.temp-value').textContent = latestData.temp;
        document.querySelector('.hum-value').textContent = latestData.humidity;
        document.querySelector('.tds-value').textContent = latestData.tds;
        document.querySelector('.ph-value').textContent = latestData.ph;
        
        console.log("RealTime data: ", latestData);

        if (!skipChartUpdate) {
            updateRealTimeCharts(latestData);
        }
    } else {
        console.warn('Data does not contain expected properties.', data);
    }
}


// Function to update the real time data chart
function updateRealTimeCharts(sensorData){
    console.log("Latest Data: ", sensorData);

    if (!sensorData || Object.keys(sensorData).length === 0) {
        // Ignore undefined or empty data
        console.warn('Data is undefined or empty.', sensorData);
        return;
    }

    const timeStamps = sensorData.timestamps;
    const realTemp = parseFloat(sensorData.temp);
    const realHum = parseFloat(sensorData.humidity);
    const realTds = parseFloat(sensorData.tds);
    const realPh = parseFloat(sensorData.ph);

    if (timeStamps === undefined || realTemp === undefined || realHum === undefined || realTds === undefined || realPh === undefined) {
        // Ignore if any required data is undefined
        console.warn('Required data is missing or undefined.', sensorData);
        return;
    }

    // Ensure the last data point is not already in the chart
    const lastTimestampInChart = charts.realTimetempHumChart.data.labels[charts.realTimetempHumChart.data.labels.length - 1];
    if (lastTimestampInChart !== timeStamps) {
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
}

function populateChartsFromStorage() {
    const storedRawData = localStorage.getItem('sensorData');
    const storedData = JSON.parse(storedRawData);
    const cleanStoredData = JSON.parse(JSON.stringify(storedData));  // Deep clone
    
    console.log("Populate stored Data: ", cleanStoredData);
    
    if (cleanStoredData) {
        const uniqueTimestamps = [...new Set(cleanStoredData.timestamps)];
        
        // Populate charts with stored data
        charts.realTimetempHumChart.data.labels = [...uniqueTimestamps];
        charts.realTimetempHumChart.data.datasets[0].data = [...cleanStoredData.temp];
        charts.realTimetempHumChart.data.datasets[1].data = [...cleanStoredData.humidity];
        charts.realTimetempHumChart.update();

        charts.realTimetdsChart.data.labels = [...uniqueTimestamps];
        charts.realTimetdsChart.data.datasets[0].data = [...cleanStoredData.tds];
        charts.realTimetdsChart.update();

        charts.realTimephChart.data.labels = [...uniqueTimestamps];
        charts.realTimephChart.data.datasets[0].data = [...cleanStoredData.ph];
        charts.realTimephChart.update();
    }
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
    if (!isInitialized) {
        initRealTimeCharts();
        populateChartsFromStorage();
        
        // Retrieve the latest sensor data from localStorage
        const storedRawData = localStorage.getItem('sensorData');
        if (storedRawData) {
            const storedData = JSON.parse(storedRawData);
            const latestIndex = storedData.timestamps.length - 1;
            const latestSensorData = {
                temp: storedData.temp[latestIndex],
                humidity: storedData.humidity[latestIndex],
                tds: storedData.tds[latestIndex],
                ph: storedData.ph[latestIndex],
                timestamps: storedData.timestamps[latestIndex],
            };
           // Update the HTML elements with new sensor values
            document.querySelector('.temp-value').textContent = latestSensorData.temp;
            document.querySelector('.hum-value').textContent = latestSensorData.humidity;
            document.querySelector('.tds-value').textContent = latestSensorData.tds;
            document.querySelector('.ph-value').textContent = latestSensorData.ph;
        }


        isInitialized = true;
        // Add event listeners to internal links
        document.querySelectorAll('.internal-link').forEach(link => {
            link.addEventListener('click', function() {
                isInternalNavigation = true;
            });
        });
    }
});

// Use the 'beforeunload' event to check if the user is leaving the site
window.addEventListener('beforeunload', function(event) {
  if (isInternalNavigation) {
    // Only clear local storage and interval when the user leaving the site
    localStorage.clear();
    // Send a message to the service worker to clear the cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('clearCache');
    }
  }
  // Reset the flag for future use
  isInternalNavigation = true;
});

