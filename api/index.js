const express = require('express');
const http = require('http');
const https = require('https');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const email_validation = require("node-email-validation");

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

app.post('/api/contact-form', function(request, response){
  /*
  Body structure:
  {
    from: {
      email: "alrotem@gmail.com",
      name: "Alon Rotem"
    },
    subject: "Just testing",
    body: "Just testing"
  }
  */
  console.log("Sending...");
  
  let from_address = "contact-form@mastilnicata.com";
  let from_name = request.body.from.name;
  if(request.body.from && request.body.from.email && email_validation.is_email_valid(request.body.from.email))
  {
    from_address = request.body.from.email;
  }
  let subject = request.body.subject;
  let body = request.body.body;
  // console.log("===BODY==============");
  // console.log(body.replace(/\n/g, "<br/>"));
  // console.log("===/BODY==============");

    let body_html = "<p>\
      <hr/> \
      <h2>Contact form</h2>  \
      <strong>From: </strong>"+ from_name + "&lt;" + request.body.from.email + "&gt;"+"<br/> \
      <strong>Subject: </strong>"+ subject +"<br/> \
      <p> \
      " + body.replace(/\n/g, "<br/>") +" \
      </p> \
    </p>"

    let body_text = "=====================================================\
      Contact form \
      From: "+ from_name + "<" + request.body.from.email + "> \
      Subject: "+ subject + " \
       \
      " + body.replace(/\n/g, "\\n") +" \
    </p>"


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mastilnicata@gmail.com',
      pass: process.env.gmail_app_key
    }
  });
  
  const mailOptions = {
    from: "contact-form@mastilnicata.com",
    replyTo: from_name + "<" + from_address + ">",
    to: "mastilnicata@gmail.com",
    subject: "Contact form: " + subject,
    text: body_text,
    html: body_html
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      response.send(JSON.stringify( { 'sent_error' : error } ));
    } 
    else {
      console.log('Email sent: ' + info.response);
      response.send(JSON.stringify( { 'sent_info' : info.response, 'message_info': mailOptions } ));
    }
  });
});

let port=8083;
let server = app.listen(port, function() {
    console.log('Server is listening on port ' + port);
});