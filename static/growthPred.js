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

let predictedGrowthDays; 
let startDate;
let date;
let isInternalNavigation = false;

// Fetch the current batch number from the server and call fetchPredictions with the current batch number table
function getCurrentBatchNumberAndFetchPredictions() {
    fetch('/api/current_batch')
        .then(response => response.json())
        .then(data => {
            // Check for error in the response
            if (data.error) {
                alert(data.error);
                return;
            }

            const currentBatchNumber = data.current_batch_number;

            // Now that you have the current batch number, fetch predictions
            fetchPredictions(currentBatchNumber);
        })
        .catch(error => {
            console.error('Error fetching current batch number:', error);
        });
}

// fetch predictions
function fetchPredictions(batchNumber) {
    // fetch 'date' from the database API
    fetch(`/api/data/${batchNumber}`)
    .then(response => response.json())
    .then(data=> {
        console.log(data);
        // Check for error in the response
        if (data.error) {
            alert(data.error);
            return;
        }

        const dateRecord = data[0];
        startDate = new Date(dateRecord.Date);
        date = startDate.getDate();
        console.log("Start", startDate);
        
        // Use data[data.length - 1] to get the last element in the array
        const lastDateRecord = data[data.length - 1];

        lastDate = new Date(lastDateRecord.Date);
        lastDataDate = lastDate.getDate();

        growthPred(date, startDate, lastDate);
        console.log("Last", lastDate);

    })
}


// Function create a new batch in the database
function newBatchClick() {
    fetch('/newBatch', {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            console.log('New Batch created successfully');

            // Show success popup
            showSuccessPopup();

            document.getElementById('predictionDisplay').innerText = '';

            // Hide the calendar chart
            document.getElementById('calendar-view').style.display = 'none';

            // Reset the progress bar to 0
            const progressBar = document.getElementById('progress-bar');
            progressBar.style.width = '0%';
            progressBar.innerText = '0%';
        } else {
            console.error('Error creating new batch');
        }
    })
    .catch(error => {
        console.error('Error creating new batch:', error);
    })
}

// Function to show a success popup
function showSuccessPopup() {
    const successPopup = document.getElementById('popup');
    const newBatchButton = document.getElementById('newBatchButton');

    successPopup.style.display = 'block';

    // Add an event listener to close the pop-up when the "OK" button is clicked
    const okButton = document.getElementById("ok-button");
    okButton.addEventListener("click", () => {
        successPopup.style.display = "none";
        newBatchButton.style.display = "none";
    });
}

// Function to call or get the prediction of the lettuce growth day and display
function growthPred(date, startDate, lastDate){
    // Fetch predictions
    fetch('/growthPred', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        // Check for error in the response
        if (data.error) {
            alert(data.error);
            return;
        }

        predictedGrowthDays = data.predictions; // Use the received prediction value

        const daysPassed = Math.floor((lastDate - startDate) / (24 * 60 * 60 * 1000));
        console.log('Days: ', daysPassed);
        
        document.getElementById('predictionDisplay').innerText = "The predicted value is: " + predictedGrowthDays;
        
        // Calculate the progress percentage based on the difference
        const progressPercentage = (daysPassed / Math.round(predictedGrowthDays)) * 100;

        // Update the progress bar width and numeric value
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.innerText = `${progressPercentage.toFixed(2)}%`;

        // Show or hide the "New Batch" button based on the progress bar
        const newBatchButton = document.getElementById('newBatchButton');
        newBatchButton.style.display = progressPercentage === 100 ? 'block' : 'none';

        let predictedHarvestDate = new Date(startDate);
        predictedHarvestDate.setDate(date + predictedGrowthDays);
        console.log(date);

        const calendarViewData = {
            data: [
                {
                    type: 'scatter',
                    x: [startDate, predictedHarvestDate],
                    y: [0, 1],
                    mode: 'lines+markers+text',
                    text: [ startDate.toDateString(), 'Predicted Harvest Day: ' + predictedHarvestDate.toDateString()],
                    textposition: ['top center', 'top left'],
                    marker: { size: 10 },
                    line: { width: 2 },
                },
            ],
            layout: {
                xaxis: {
                    title: 'Date',
                    type: 'date',
                    tickformat: '%Y-%m-%d',
                },
                yaxis: {
                    title: 'Progress',
                    range: [-0.1, 1.1],
                },
                hovermode: 'closest',
                title: 'Lettuce Growth Calendar',
                plot_bgcolor: 'lightgray',
            },
        };

        // Disable mode bar (zoom and pan buttons)
        const config = { displayModeBar: false};
        Plotly.newPlot('calendar-view', calendarViewData.data, calendarViewData.layout, config);

    })
    .catch(error => {
        console.error('Error fetching predictions:', error);
    });
}



document.addEventListener("DOMContentLoaded", function() {

    // Set initial progressBar width to 0%
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '0%';
});