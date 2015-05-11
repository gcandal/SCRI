"use strict";

var express = require('express');
var session = require('express-session');
var app = express();
var nrVersions = 3;

app.locals.results = [
    {'a': 1, 'b': 1, 'c': 1},
    {'a': 1, 'b': 1}
];

app.use(session({
    secret: 'Oix',
    resave: true,
    saveUninitialized: true
}));

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

    return count === nrVersions;
};

var combine = function (historyLine) {
    return 0;
};

var allocateSpace = function (iteration, history) {
    while (history.length < iteration + 1)
        history.push({});
};

app.get('/:nr/:value', function (req, res) {
    var nr = parseInt(req.params.nr);

    allocateSpace(nr, app.locals.results);

    app.locals.results[nr][req.sessionID] = req.params.value;

    var currentLine = app.locals.results[nr];

    if (canDecide(currentLine))
        console.log("Iteration " + nr + " decided: " + combine(currentLine));
    else
        console.log("Iteration " + nr + " has not enogh significant data");

    res.send('<pre>' + historyToString(app.locals.results) + '</pre>');
});

app.listen(1337, function () {
});