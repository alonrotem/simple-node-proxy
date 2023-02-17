const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let app = express();
app.use(cors());
app.use(bodyParser.json())

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

app.get('/api/', async function(req, res){
    console.log("Hello.");
    res.send("Hello, World!");
});

// Function to handle the root path
app.get('/api/simple-proxy', async function(req, res) {
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

app.post('/api/send-mail/', function(request, response){

  const msg = {
    to: request.body.personalizations[0].to[0].email,
    from: request.body.from.email,
    subject: request.body.subject,
    text: request.body.content[0].value,
    html: request.body.content[0].value,
  };

  let jsonPath = path.join(__dirname, '..', 'config', 'emails.json');
  if (fs.existsSync(jsonPath)) {
      let rawdata = fs.readFileSync(jsonPath);
      let allowed_emails = JSON.parse(rawdata);
      let didntmatchanypattern = true;
      if(allowed_emails)
      {
        allowed_emails.forEach((pattern) => {
          console.log("Testing: pattern-> " + pattern + ", address-> " + msg.to)
          if(new RegExp(pattern).test(msg.to))
          {
            console.log("Matched! This address is okay!")
            didntmatchanypattern = false;
          }
        });
        if(didntmatchanypattern)
        {
          console.log("Didn't match any allowed pattern!");
          response.status(401).json('Unauthorized email address');
          return;
        }
        
      }
  }
    //ES6
    sgMail
      .send(msg)
      .then(() => {}, error => {
        console.error(error);
    
        if (error.response) {
          console.error(error.response.body)
        }
      });
    //ES8
    (async () => {
      try {
        await sgMail.send(msg);
      } catch (error) {
        console.error(error);
    
        if (error.response) {
          console.error(error.response.body)
        }
      }
    })();    
    //----------
    response.send(request.body);
});

let port=8083;
let server = app.listen(port, function() {
    console.log('Server is listening on port ' + port);
});