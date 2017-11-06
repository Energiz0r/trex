var fs = require('fs');

var appendText = function(filename, text){
    let path = `logs/${filename}`;

    fs.appendFile(path, text+'\r\n', (err) => {
        if (err) throw err;
    });
}
var appendError = function(text){
    let path = `logs/error`;

    fs.appendFile(path, text+'\r\n', (err) => {
        if (err) throw err;
    });
}

module.exports = {
    appendText: appendText,
    appendError: appendError
}