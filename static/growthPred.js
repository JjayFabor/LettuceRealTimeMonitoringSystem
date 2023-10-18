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

// Function to call or get the prediction of the lettuce growth day and display
function fetchPredictions() {
    // Fetch predictions by making a POST request to the server
    fetch('/growthPred', {
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
        const maxOptimalDays = 45;
        predictedGrowthDays = data.predictions; // Use the received prediction value

        document.getElementById('predictionDisplay').innerText = "The predicted value is: " + predictedGrowthDays;
        
        // Calculate the progress percentage based on the received prediction value
        const progressPercentage = (predictedGrowthDays / maxOptimalDays) * 100;

        // Update the progress bar width and numeric value
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.innerText = `${progressPercentage.toFixed(2)}%`;

    })
    .catch(error => {
        console.error('Error fetching predictions:', error);
    });
}


document.addEventListener('DOMContentLoaded', function (){
    let today = new Date();
    let predictedHarvestDate = new Date(today);
    predictedHarvestDate.setDate(today.getDate() + predictedGrowthDays);

    const calendarViewData = {
        data: [
            {
                type: 'scatter',
                x: [today, predictedHarvestDate],
                y: [0, 1],
                mode: 'lines+markers+text',
                text: ['Today', 'Predicted Harvest Day: ' + predictedHarvestDate.toDateString()],
                textposition: 'top right',
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
                range: [0, 1],
            },
            hovermode: 'closest',
            title: 'Lettuce Growth Calendar',
        },
    };

    // Disable mode bar (zoom and pan buttons)
    const config = { displayModeBar: false};
    Plotly.newPlot('calendar-view', calendarViewData.data, calendarViewData.layout, config);
})