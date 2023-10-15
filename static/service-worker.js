//service-worker.js

self.addEventListener('install', event => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    console.log('Service Worker installed.');
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log('Service Worker activated. Now controlling clients.');
});
  
self.addEventListener('message', event => {
    console.log(`Received message from client: ${event.data}`);
});

// Service Worker: Add a new event listener for 'fetch'
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

// Service Worker: A spell to clear the cache
function clearCache() {
    return caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) {
            return caches.delete(key);
        }));
    });
}


// Service Worker: Update message listener
self.addEventListener('message', function(event) {
    if (event.data === 'clearCache') {
        clearCache().then(function() {
            console.log('Cache cleared.');
        }).catch(function(error) {
            console.error('Failed to clear cache:', error);
        });
    } else {
        console.log(`Received message from client: ${event.data}`);
    }
});


  
function updateData() {
    try {
        if (!self.clients) {
        throw new Error('This script should run in a service worker context.');
        }

        fetch('/data')
        .then(response => response.json())
        .then(data => {
            self.clients.matchAll({ includeUncontrolled: true })
            .then(clients => {
                if (Array.isArray(clients) && clients.length) {
                console.log('Clients found. Sending data.');
                clients.forEach(client => {
                    client.postMessage({ type: 'DATA_UPDATED', payload: data });
                });
                } else {
                console.warn('No clients matched. Will retry.');
                }
            })
            .catch(error => { throw new Error(`MatchAll Error: ${error}`); });
        })
        .catch(error => { throw new Error(`Fetch Error: ${error}`); });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    }
}

// Invoke updateData at intervals 
if (self.clients) {
    setInterval(updateData, 10000);
}
