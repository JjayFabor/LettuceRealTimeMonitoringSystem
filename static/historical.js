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
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
                {
                    label: 'Humidity',
                    data: [],
                    fill: false,
                    tension: 0.5,
                    borderColor: '#F1C72C', 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                    borderColor: 'green',
                    fill: false,
                    borderWidth: 2,
                    tension: 0.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    // Check if data is an array
    if (!Array.isArray(data)) {
        // Display a message or handle the error case
        console.log('Error or no data available for the selected batch.');
        clearCharts(tempHumChart, tdsChart, phChart);
        return;
    }

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

// Function to clear the data in the charts if the batch table is empty
function clearCharts(tempHumChart, tdsChart, phChart) {
    // Clear data in the charts
    tempHumChart.data.labels = [];
    tempHumChart.data.datasets[0].data = [];
    tempHumChart.data.datasets[1].data = [];
    tempHumChart.update();

    tdsChart.data.labels = [];
    tdsChart.data.datasets[0].data = [];
    tdsChart.update();

    phChart.data.labels = [];
    phChart.data.datasets[0].data = [];
    phChart.update();
}

// Function to fetch batch numbers and populate the dropdown// Function to fetch batch numbers and populate the dropdown
function fetchBatchNumbers() {
    // Fetch batch numbers from the server (you need to define the API endpoint)
    fetch('/api/batch_numbers')
        .then(response => response.json())
        .then(data => {
            // Check for errors in the response
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Get the select element by its ID
            const selectElement = document.getElementById('selected-batch-number');
            
            // Clear existing options
            selectElement.innerHTML = '';

            // Add an initial "Select Batch Number" option
            const initialOption = document.createElement('option');
            initialOption.value = '';
            initialOption.text = 'Select Batch Number';
            selectElement.add(initialOption);

            // Iterate through the batch numbers and create option elements
            data.forEach(batchInfo => {
                const option = document.createElement('option');
                const [batchNumber, tableName] = batchInfo;
                option.value = batchNumber;
                option.text = `Batch ${batchNumber}`;
                selectElement.add(option);
            });
        })
        .catch(error => console.error('Error fetching batch numbers:', error));
}

// Function to retrieve the sensor data in the API and update the chart.
function sensor(batchNumber) {
    // Clear local storage before fetching new batch data
    localStorage.removeItem('sensorData');

    fetch(`/api/data/${batchNumber}`)
        .then(response => response.json())
        .then(data => {
            console.log('Data ', data);
            updateCharts(data, tempHumChart, tdsChart, phChart);
        })
        .catch(error => console.log(error));
}


// Function to download CSV file
function downloadCSV(batchNumber) {
    fetch(`/api/data/${batchNumber}`)
        .then(response => response.json())
        .then(data => {
            console.log('Download CSV Data:', data);

            if (!Array.isArray(data)) {
                console.error('Invalid data structure. Unable to download CSV.');
                return;
            }

            // Convert data to CSV format
            const csvContent = "Date,Time,Temperature,Humidity,TDS Value,pH Level\n" +
                data.flatMap(dateEntry =>
                    dateEntry.Records.map(record =>
                        `${dateEntry.Date},${record.Time},${record.Temperature},${record.Humidity},${record['TDS Value']},${record['pH Level']}`
                    )
                ).join("\n");

            // Create a blob and create a download link
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `batch_${batchNumber}_data.csv`;

            // Append the link to the document and trigger the click
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })
        .catch(error => console.error('Error fetching data for CSV:', error));
}

// Function to download the charts visualization data as pdf
function downloadPDF(){
    const canvas = document.getElementById('temp-hum-chart');
    const canvas1 = document.getElementById('tds-chart');
    const canvas2 = document.getElementById('ph-chart');

    const canvasImage = canvas.toDataURL('image/png', 1.0);
    const canvas1Image = canvas1.toDataURL('image/png', 1.0);
    const canvas2Image = canvas2.toDataURL('image/png', 1.0);

    let pdf = new jsPDF('landscape');

    // Add title based on the selected batch date or mode
    const selectedBatchNumber = document.getElementById('selected-batch-number').value;
    const selectedDate = document.getElementById('selected-date').value;

    if (selectedDate) {
        pdf.setFontSize(20);
        pdf.text(`Chart Visualization - Batch ${selectedBatchNumber}, Date: ${selectedDate}`, 15, 15);
    } else {
        pdf.setFontSize(30);
        pdf.text(`Chart Visualization - Batch ${selectedBatchNumber}, Mode: Daily`, 15, 15);
    }

    pdf.addImage(canvasImage, 'PNG', 9, 30, 280, 150);

    pdf.addPage();
    pdf.setFontSize(20);
    pdf.addImage(canvas1Image, 'PNG', 9, 30, 280, 150);

    pdf.addPage();
    pdf.setFontSize(20);
    pdf.addImage(canvas2Image, 'PNG', 9, 30, 280, 150);

    pdf.save('chart.pdf');
}

// Main function
function main(){ 
    // Event listener for the batch number select change
    document.getElementById("selected-batch-number").addEventListener('change', function() {
        // Get the selected value from the dropdown
        const selectedBatchNumber = this.value;

        if (selectedBatchNumber) {
            console.log("Batch number selected: ", selectedBatchNumber);

            // Call the sensor function with the selected batch number
            sensor(selectedBatchNumber);
        }
    });

    document.getElementById("daily-button").addEventListener('click', function () {
        var select = document.getElementById('selected-date');
        select.style.display = 'none';
    
        // Get the selected batch number
        const selectedBatchNumber = document.getElementById('selected-batch-number').value;
    
        // Fetch data based on the selected batch number
        fetch(`/api/data/${selectedBatchNumber}`)
            .then(response => response.json())
            .then(data => {
                updateCharts(data, tempHumChart, tdsChart, phChart, 'date');
            })
            .catch(error => console.log(error));
        setChartMode('date'); // Set the mode to 'date' when the daily button is clicked
    });
    
    document.getElementById("mins-button").addEventListener('click', function () {
        // Toggle the visibility of the select element
        var select = document.getElementById('selected-date');
        if (select.style.display === 'none' || select.style.display === '') {
            select.style.display = 'inline-block';
        } else {
            select.style.display = 'none';
        }
    
        // Get the selected batch number
        const selectedBatchNumber = document.getElementById('selected-batch-number').value;
    
        // Fetch data based on the selected batch number
        fetch(`/api/data/${selectedBatchNumber}`)
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
        
        fetchBatchNumbers();

        tranferData();
        
    });

    // Add event listener for the download button
    document.getElementById("downloadCSVButton").addEventListener("click", function () {
        // Get the selected batch number
        const selectedBatchNumber = document.getElementById('selected-batch-number').value;

        // Check if a batch number is selected before triggering the download
        if (selectedBatchNumber) {
            // Call the downloadCSV function with the selected batch number
            downloadCSV(selectedBatchNumber);
        } else {
            alert("Please select a batch number before downloading");
            console.log("Please select a batch number before downloading.");
        }
    });
} 

main()
