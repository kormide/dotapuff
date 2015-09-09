var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var players = require('./routes/players');

var app = express();

app.set('port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/players', players);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err =  new Error('Not Found');
    err.status = 404;
    next(err);
});

// handle error in development: print stack trace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// handle error in production
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.createServer(app);
var boot = function(done) {
    server.listen(app.get('port'), function() {
        console.log('info: server listening on port ' + app.get('port'));
        if (typeof done !== 'undefined' && done) done();
    });
}

var shutdown = function() {
    server.close();
}

if (require.main === module) {
    boot();
} else {
    console.log("info: running app as a module");
    exports.boot = boot;
    exports.shutdown = shutdown;
    exports.port = app.get('port');
}
