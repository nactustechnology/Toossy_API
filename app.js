'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http')
var auth = require('basic-auth')

var routes = require('./routes/index');
var users = require('./routes/users');
var Tasks = require('./routes/Tasks');
var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*app.get('/*', function (req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
});*/

app.use('/API/v1', Tasks);

app.use(function (request, response, next) {
    var user = auth(request);
    if (user === undefined) {
        console.log('User information is not available in the request');
        response.statusCode = 401;
        response.setHeader('WWW-Authenticate', 'Basic');
        response.end('Unauthorized');
    } else {
        authenticate(user, response, next);
    }
});

function authenticate(user, response, next) {
    var result = false;
    AuthUser.findOne({ username: user['name'], password: user['pass'] }, function (error, data) {
        if (error) {
            console.log(error);
            response.statusCode = 401;
            response.end('Unauthorized');
        } else {

            if (!data) {
                console.log('unknown user');
                response.statusCode = 401;
                response.end('Unauthorized');
            } else {
                console.log(data.username + ' authenticated successfully');
                next();
            }
        }
    });
}

// catch 404 and forward to error handler
/*app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});*/

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
/*app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/

app.set('port', process.env.PORT || 3240);


var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});


