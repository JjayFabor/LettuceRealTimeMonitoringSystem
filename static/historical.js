let chartMode = 'date';

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
    });
}
  

// Function to when transferButton is clicked
function tranferData() {
    document.getElementById("transferButton").addEventListener("click", function() {
        fetch("/transfer/db", {
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
            console.log(data);
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
                    fill: false,
                    tension: 0.5,
                    borderColor: '#2691DA',
                    backgroundColor: 'white',
                },
                {
                    label: 'Humidity',
                    data: [],
                    fill: false,
                    tension: 0.5,
                    borderColor: '#F1C72C', 
                    borderWidth: 2,
                    backgroundColor: 'white',
                },
            ],
        },
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
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
                noData,
            },
            responsive: true, 
        },
    });
     

    const tdsChart = new Chart(ctds, {
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
            ],
        },
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
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
                noData,
            },
            responsive: true,
        },
    });

    const phChart = new Chart(ctph, {
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
        options: {
            onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            interaction: {
                intersect: false,
            },
            plugins: {
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
                noData,
            },
            responsive: true, 
        },
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
function updateCharts(data, tempHumChart, tdsChart, phChart) {
    const dateSet = new Set();

    data.forEach(item => {
        dateSet.add(item.Date);
    });

    const selectElement = document.getElementById("selected-date");

    // Check the current mode and update the dropdown and charts accordingly
    if (chartMode === 'time') {
        // Loop through the unique dates and create options for the dropdown
        dateSet.forEach(date => {
            const option = document.createElement("option");
            option.value = date;
            option.textContent = date;
            selectElement.appendChild(option);
        });

        selectElement.addEventListener("change", function () {
            const selectedDate = selectElement.value;
    
            const filteredDate = data.filter(item => item.Date === selectedDate);
    
            const { temps, hums, tds, ph, times } = populateData(filteredDate[0].Records);
            const labels = chartMode === 'time' ? times : data.map(entry => entry.Date);
    
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
        });

    } else if (chartMode === 'date') {
        selectElement.innerHTML = '<option value="" disabled selected>Select a Date</option>';
        const { temps, hums, tds, ph} = populateData(data[0].Records);
        const labels = data.map(entry => entry.Date);

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
}

// Function to set the chart mode
function setChartMode(mode) {
    chartMode = mode;
}

// Function to retrieve the sensor data in the API and update the chart.
function sensor() {
    fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        updateCharts(data, tempHumChart, tdsChart, phChart);
    })
    .catch(error => console.log(error));
}

// Main function
function main(){
    document.getElementById("daily-button").addEventListener('click', function() {
        fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            updateCharts(data, tempHumChart, tdsChart, phChart, 'date');
        })
        .catch(error => console.log(error));
        setChartMode('date'); // Set the mode to 'date' when the daily button is clicked
    });

    document.getElementById("mins-button").addEventListener('click', function() {
        fetch('http://127.0.0.1:5000/api/data')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updateCharts(data, tempHumChart, tdsChart, phChart, 'time');
        })
        .catch(error => console.log(error));
        setChartMode('time'); // Set the mode to 'time' when the 5 mins button is clicked
    });
    
    
    document.addEventListener("DOMContentLoaded", function() {
        sensor();
    
        tranferData();
        
        const { tempHumChart: initialTempHumChart, tdsChart: initialTdsChart, phChart: initialPhChart } = initCharts();
        tempHumChart = initialTempHumChart;
        tdsChart = initialTdsChart;
        phChart = initialPhChart;
        
    });
} 

main()