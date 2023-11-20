let chartMode = 'date';
let isInternalNavigation = false;

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
    const loadingIndicator = document.getElementById("loadingIndicator");
    document.getElementById("transferButton").addEventListener("click", function() {
        fetch("/transfer/db", {
            method: "POST",
        })
        .then(response => {
            if (response.headers.get("content-type") && response.headers.get("content-type").includes("application/json")) {
                return response.json();
            } else {
                return response.text().then(text => {
                    // hide loading indicator 
                    loadingIndicator.style.display = "none";   
                    throw new Error(text);
                });
            }
        })
        .then(data => {
            if (data.status === "success")  {
                // Display the pop-up
                const popup = document.getElementById("popup");
                popup.style.display = "block";

                loadingIndicator.style.display = "none";


                // Add an event listener to close the pop-up when the "OK" button is clicked
                const okButton = document.getElementById("ok-button");
                okButton.addEventListener("click", () => {
                    popup.style.display = "none";
                });

                sensor();
            }      
            else if (data.status === "error") {
                // Display the error pop-up
                const errorPopup = document.getElementById("error-popup");
                errorPopup.style.display = "block";
                
                // Set the error message text
                const errorMessage = document.getElementById("error-message");
                errorMessage.textContent = "Error during transfer: " + data.message;

                // Add an event listener to close the error pop-up when the "OK" button is clicked
                const errorOkButton = document.getElementById("error-ok-button");
                errorOkButton.addEventListener("click", () => {
                    errorPopup.style.display = "none";
                });
            }
        })
        .catch(error => {
            console.error("Error:", error.message);

            loadingIndicator.style.display = "none";
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
                },
                {
                    label: 'Humidity',
                    data: [],
                    fill: false,
                    tension: 0.5,
                    borderColor: '#F1C72C', 
                    borderWidth: 2,
                },
            ],
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
            scales: {
                x: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
                y: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
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
                    borderColor: '#90EE90',
                    fill: false,
                    borderWidth: 2,
                    tension: 0.5,
                },
            ],
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
            scales: {
                x: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
                y: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
            },
            responsive: true,
        },
    });

    const phChart = new Chart(ctph, {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
            scales: {
                x: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
                y: {
                    grid: {
                        color: '#d3d3d3',
                    },
                },
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

let chart1Obj, chart2Obj, chart3Obj; 

// Function to switch chart to a bigger one
function switchChart(clickedChart) {
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

// Main function
function main(){
    document.getElementById("daily-button").addEventListener('click', function() {
        var select = document.getElementById('selected-date');
        select.style.display = 'none';

        fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            updateCharts(data, tempHumChart, tdsChart, phChart, 'date');
        })
        .catch(error => console.log(error));
        setChartMode('date'); // Set the mode to 'date' when the daily button is clicked
    });

    document.getElementById("mins-button").addEventListener('click', function() {
        // Toggle the visibility of the select element
        var select = document.getElementById('selected-date');
        if (select.style.display === 'none' || select.style.display === '') {
            select.style.display = 'inline-block';
        } else {
            select.style.display = 'none';
        }

        fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updateCharts(data, tempHumChart, tdsChart, phChart, 'time');
        })
        .catch(error => console.log(error));
        setChartMode('time'); // Set the mode to 'time' when the 5 mins button is clicked
    });
    
    
    document.addEventListener("DOMContentLoaded", function() {
        const { tempHumChart: initialTempHumChart, tdsChart: initialTdsChart, phChart: initialPhChart } = initCharts();
        tempHumChart = initialTempHumChart;
        tdsChart = initialTdsChart;
        phChart = initialPhChart;

        chart1Obj = initialTempHumChart;
        chart2Obj = initialTdsChart;
        chart3Obj = initialPhChart;

        sensor();
    
        tranferData();
        
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
}

function downloadPDF(){
    const fileNameInput = document.getElementById('fileNameInput');
    const fileName = fileNameInput.value;

    const canvas = document.getElementById('temp-hum-chart');
    const canvas1 = document.getElementById('tds-chart');
    const canvas2 = document.getElementById('ph-chart');
    
    const canvasImage = canvas.toDataURL('image/jpeg', 1.0);
    const canvas1Image = canvas1.toDataURL('image/jpeg', 1.0);
    const canvas2Image = canvas2.toDataURL('image/jpeg', 1.0);
    console.log(canvasImage);

    let pdf = new jsPDF('landscape');
    pdf.setFontSize(20);
    pdf.addImage(canvasImage, 'JPEG', 9, 30, 280, 150);

    pdf.addPage();
    pdf.setFontSize(20);
    pdf.addImage(canvas1Image, 'JPEG', 9, 30, 280, 150);

    pdf.addPage();
    pdf.setFontSize(20);
    pdf.addImage(canvas2Image, 'JPEG', 9, 30, 280, 150);

    pdf.save(fileName + '.pdf');
}

main()
