const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

let app = express();
app.use(cors({
  origin: '*'
}));
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
  console.log("======================");
  console.log("Post request received!");
  const msg = {
    to: {
      email: request.body.to.email,
      name: request.body.to.name
    },
    from: {
      email: request.body.from.email,
      name: request.body.from.name
    },
    subject: request.body.subject,
    text: request.body.content.text,
    html: request.body.content.html
  };
  console.log(JSON.stringify(msg));
  console.log("======================");


  let jsonPath = path.join(__dirname, '..', 'config', 'emails.json');
  if (fs.existsSync(jsonPath)) {
      let rawdata = fs.readFileSync(jsonPath);
      let allowed_emails = JSON.parse(rawdata);
      let didntmatchanypattern = true;
      if(allowed_emails)
      {
        allowed_emails.forEach((pattern) => {
          console.log("Testing: pattern-> " + pattern + ", address-> " + msg.to.email)
          if(new RegExp(pattern).test(msg.to.email))
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

  console.log("Sending...");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mastilnicata@gmail.com',
      pass: process.env.gmail_app_key
    }
  });
  
  const mailOptions = {
    from: msg.from.name + "<" + msg.from.email + ">",
    to: msg.to.name + "<" +msg.to.email + ">",
    subject: msg.subject,
    text: msg.text,
    html: msg.html
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
   console.log(error);
   response.send('Error: ' + error);
    } else {
      console.log('Email sent: ' + info.response);
      response.send('Email sent: ' + info.response);
      // do something useful
    }
  });


  /*
    var post_data = JSON.stringify(
      {
        "personalizations": [
          {"to": [{ "email": msg.to }]}],
          "from": { "email": msg.from },
          "subject": msg.subject,
          "content": [{
            "type": "text/plain",
            "value": msg.text 
          }]
        }
      );
  
    // An object of options to indicate where to post to
    var post_options = {
        host: 'api.sendgrid.com',
        port: '443',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.SENDGRID_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
  
    // Set up the request
    /*
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
        res.on('error', function (e) {
          console.log(e);
        });
    });*/
    /*
    var post_req = https.request(post_options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);
    
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });
    
    post_req.on('error', (e) => {
      console.error(e);
    });
  
    // post the data
    post_req.write(post_data);
    post_req.end();

    response.send("AllDone");
*/
  /*
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
    */
});

let port=8083;
let server = app.listen(port, function() {
    console.log('Server is listening on port ' + port);
});