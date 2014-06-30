var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    express = require('express'),
    email = require('emailjs'),
    config = require('./config.json');

var home = process.cwd();
var app = express();
app.configure(function() {
    app.use(express.bodyParser());
    app.use('/css', express.static('css'));
    app.use('/img', express.static('img'));
    app.use('/js', express.static('js'));
    app.use(app.router);
    app.use(function(req, res) {
        returnNotFound(res);
    });
});
app.use(express.bodyParser());

app.post('/:var(index.html)?', function(req, res) {
	console.log('Received email message!');
	var message_email = req.param('email', null);
	var message = req.param('message', null);
	
	var email_server  = email.server.connect({
	   user:     config.smtp.username, 
	   password: config.smtp.password, 
	   host:     config.smtp.host,
	   ssl:      true
	});
	
	email_server.send({
	   text:    message + " \nfrom email: " + message_email, 
	   from:    "me <" + config.email_response.from_address +">", 
	   to:      "me <" + config.email_response.to_address +">",
	   subject: config.email_response.subject
	}, function(err, message) { console.log(err || message); });
	
	returnHTMLPage(res,"EmailSuccess.html");
});

//Get routes
app.get('/', function(req, res) {
    serveFile(req, res, 'text/html'); 
});

app.get('*.html', function(req, res) {
    serveFile(req, res, 'text/html'); 
});

app.get('*.txt', function(req, res) {
    serveFile(req, res, 'text/plain'); 
});

function serveFile(request, response, mimeType) {
    var uri = url.parse(request.url).pathname
    , filename = path.join(home, uri);

    fs.exists(filename, function(exists) {
        logFileServed(filename, request);
        if(!exists) {
            returnNotFound(response);
            return;
        }
 
        if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
        fs.readFile(filename, 'binary', function(err, file) {
            if(err) {
                criticalError(response, err);
                return;
            }
 
            response.writeHead(200, { 'Content-Type': mimeType });
            response.write(file, 'binary');
            response.end();
        });
    });
}

function returnNotFound(response) {
	returnHTMLPage(response, "404.html");
}

function returnHTMLPage(response, page) {
    var notfound = path.join(home, page);
    fs.readFile(notfound, 'binary', function(err, file) {
        if(err) {
            criticalError(response, err);        
        }
    
    response.writeHead(200);
    response.write(file);
    response.end();
    });
}

function criticalError(response, err) {
    console.log('Critical error: ' + err);
    response.writeHead(500, {'Content-Type': 'text/plain'});
    response.write('Critical server error' + '\n');
    response.end();
}

function logFileServed(file, req) {
    console.log('Serving file: ' + file + ' to ip ' + req.connection.remoteAddress);
}

var port = process.env.PORT || 5000;
app.listen(port);

console.log('App running on port: ' + port);