const express = require('express');
var cors = require('cors')

let app = express();
app.use(cors());

var http = require('http');
var https = require('https');

var fetch_url = function(url,cb) {
    var protocol=http;
    if(url.indexOf("https://") >= 0)
    {
        protocol=https;
    }
    else if (url.indexOf("http://" < 0) && url.indexOf("https://") < 0)
    {
        url = "http://" + url;
        protocol=http;
    }
    protocol.get(url, (response) => {
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            cb(body);
        });
        response.on('error', function(err) {
            if (cb) cb(err.message);
          });
    });
};

app.get('/', async function(req, res){
    console.log("Hello.");
    res.send("Hello, World!");
});

// Function to handle the root path
app.get('/simple-proxy', async function(req, res) {
    if(req.query.fetch_url)
    {
        try
        {
            console.log("Fetching " + req.query.fetch_url + "...");
            fetch_url(
                req.query.fetch_url,
                function(resp) { 
                    res.send(resp); 
                }
            );
        }
        catch(e)
        {
            let msg = "Failed to retreve " + req.query.fetch_url + ": " + e.message;
            res.send(msg);
            console.log(msg);            
        }
    }
    else
    {
        let msg = "Please specify a query to retrieve: ?fetch_url=..."
        res.send(msg);
        console.log(msg);
    }
});

let port=8083;
let server = app.listen(port, function() {
    console.log('Server is listening on port ' + port);
});