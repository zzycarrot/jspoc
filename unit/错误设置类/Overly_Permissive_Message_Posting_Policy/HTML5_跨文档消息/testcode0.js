var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Vulnerable PostMessage Receiver</title>
    </head>
    <body>
        <div id="message"></div>
        <script>
            // SOURCE
            window.addEventListener('message', function(event) {
                // VULNERABLE: No origin validation
                document.getElementById('message').innerHTML = event.data;
                // SINK
            });
        </script>
    </body>
    </html>
    `);
});

app.get('/sender', function(req, res) {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>PostMessage Sender</title>
    </head>
    <body>
        <button onclick="sendMessage()">Send Message</button>
        <script>
            function sendMessage() {
                // SOURCE
                var message = "Malicious content <img src=x onerror=alert('XSS')>";
                // SINK
                window.opener.postMessage(message, "*");
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(3000);