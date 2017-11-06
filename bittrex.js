var bittrex = require('node-bittrex-api');
var RSVP = require('rsvp');
var logger = require('./logger.js');

let history = [
    {
        market: null,
        tickers: [
        ] 
    },
];
bittrex.options({
    'apikey' : 'a7a509a0d95048e2bb9cf62c888e1406',
    'apisecret' : '5cfeb65400bc441bb33b13435659485a',
});

let createMarket = function(market){
    var file = `/history/${market}.json`;
    var obj = {market: market}
    
    jsonfile.writeFile(file, obj, {flag: 'a'}, function (err) {
      console.error(err)
    })
}

let getTickerInfo = function(tickername){
    return new RSVP.Promise(function(resolve, reject) {
        if(!tickername) reject('no tickername specified');
    
        // createMarket(tickername);
        bittrex.getmarketsummary( { market : tickername }, function( tickers, err ) {
            if (err) {
                console.log('Error happened');
                var logger = require('./logger.js');
                logger.appendError(err);
                
                reject(err);
                return;
            }
            let ticker = tickers.result[0];
            resolve(ticker);
        });
    });
}

module.exports = {
    getTickerInfo: getTickerInfo
}