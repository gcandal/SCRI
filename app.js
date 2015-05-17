"use strict";

var express = require('express');
var session = require('express-session');
var app = express();
var timeVersions = 3;

app.locals.results = [
    {'a': 1, 'b': 1, 'c': 1},
    {'a': 1, 'b': 1}
];

app.locals.time = 0;
app.locals.decisions = [];

app.use(session({
    secret: 'Oix',
    resave: true,
    saveUninitialized: true
}));
var decisionsToString = function(decisions) {
    var result = "";

    history.forEach(function (elem, n) {
        result += "Iteration " + n + ": " + elem + "\n";
    });

    return result;
};
var historyToString = function (history) {
    var result = "";

    history.forEach(function (elem, n) {
        result += "Iteration " + n + ":\n[";
        for (session in elem)
            if (elem.hasOwnProperty(session))
                result += elem[session] + ", ";
        result += "]\n";
    });

    return result;
};

var canDecide = function (historyLine) {
    var count = 0;

    for (session in historyLine)
        if (historyLine.hasOwnProperty(session))
            count += 1;

    return count === timeVersions;
};

var combine = function (historyLine) {
    app.locals.decisions.push(0);

    return 0;
};

var allocateSpace = function (iteration, history) {
    while (history.length < iteration + 1)
        history.push({});
};

app.get('/:time/:value', function (req, res) {
    var time = parseInt(req.params.time);

    allocateSpace(time, app.locals.results);

    app.locals.results[time][req.sessionID] = req.params.value;

    var currentLine = app.locals.results[time];

    if (canDecide(currentLine))
        res.send("Iteration " + time + " decided: " + combine(currentLine));
    else
        res.send("Iteration " + time + " has not enough significant data to make a decision");
});

app.get('/history', function (req, res) {
    res.send('<pre>' + historyToString(app.locals.results) + '</pre>');
});

app.get('/decisions', function (req, res) {
    res.send('<pre>' + decisionsToString(app.locals.decisions) + '</pre>');
});

app.get('/reset', function (req, res) {
    app.locals.results = [];
    app.locals.time = 0;
    app.locals.decisions = [];

    res.send("State back to initial");
});

app.listen(1337, function () {
});