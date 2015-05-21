"use strict";

var express = require('express');
var session = require('express-session');
var app = express();

app.locals.results = [];
app.locals.time = 0;
app.locals.decisions = [];

app.use(session({
    secret: 'Oix',
    resave: true,
    saveUninitialized: true
}));

var decisionsToString = function (decisions) {
    if (decisions.length == 0)
        return "No decisions made thus far";

    var result = "";

    decisions.forEach(function (elem, n) {
        result += "Iteration " + n + ": " + elem + "\n";
    });

    return result;
};

var extractValuesFromLine = function (line) {
    var values = [];

    for (session in line)
        if (line.hasOwnProperty(session))
            values.push(line[session]);

    return values;
};

var historyToString = function (history) {
    if (history.length == 0)
        return "No values provided thus far";

    var result = "";

    history.forEach(function (elem, n) {
        result += "Iteration " + n + ":\n[";
        for (session in elem)
            if (elem.hasOwnProperty(session))
                result += session + " -> " + elem[session] + ", ";
        result += "]\n";
    });

    return result;
};

var pickMedianFromArray = function (values) {
    return values.sort()[values.length / 2];
};

var pickMeanFromArray = function (values) {
    return values.reduce(function (a, b) {
            return a + b;
        }) / (values.length).toFixed(1);
};

var pickRandomFromArray = function (array) {
    return array[Math.floor(Math.random() * array.length)]
};

var formalMajorityVoter = function (values) {
    values = values.sort();
    var pivot = pickRandomFromArray(values);
    var epsilon = 0.05;
    var admissible = values.filter(function (value) {
        return Math.abs(pivot - value) < epsilon;
    });

    if (admissible.length < 2)
        throw "Couldn't decide";

    return pickRandomFromArray(admissible);
};

var combine = function (values) {
    return formalMajorityVoter(values);
};

var allocateSpaceHistory = function (iteration, history) {
    while (history.length < iteration + 1)
        history.push({});
};

var allocateSpaceDecisions = function (iteration, history) {
    while (history.length < iteration + 1)
        history.push("FAIL");
};

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

app.get('/decide/:time', function (req, res) {
    var time = parseInt(req.params.time);

    if (time < 0 || time.toString() === 'NaN')
        return res.send("Invalid time value");

    if (time < app.locals.decisions.length)
        return res.send("Decision for that time has already been made, and was " + app.locals.decisions[time]);

    allocateSpaceDecisions(time, app.locals.decisions);

    try {
        var decision = combine(extractValuesFromLine(app.locals.results[time]));
        res.send("Iteration " + time + " decided: " + decision);
        app.locals.decisions[time] = decision;
    }
    catch (err) {
        res.send("Iteration " + time + " has not enough significant data to make a decision or couldn't reach consensus");
        app.locals.decisions[time] = "FAIL";
    }
});

app.get('/:id/:time/:value', function (req, res) {
    var time = parseInt(req.params.time);
    var value = parseFloat(req.params.value);
    var sessionID = req.params.id; // req.sessionID;

    if (time < 0 || time.toString() === 'NaN')
        return res.send("Invalid time value");

    if (value.toString() === 'NaN')
        return res.send("Invalid value");

    if (time < app.locals.decisions.length)
        return res.send("Decision for that time has already been made, and was " + app.locals.decisions[time]);

    allocateSpaceHistory(time, app.locals.results);

    if (app.locals.results[time].hasOwnProperty(sessionID))
        return res.send("Previous value of " + app.locals.results[time][sessionID]
        + " replaced by " + value + " for ID " + sessionID);

    app.locals.results[time][sessionID] = value;

    res.send("Previous value of " + value + " set for ID " + sessionID);
});

app.listen(1337, function () {
    console.log("Server running");
});