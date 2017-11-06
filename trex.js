var bittrex2 = require('./bittrex.js');
var logger = require('./logger.js');
var _ = require('underscore');

var btc = (1).toFixed(8);
var d = new Date();
//create string ex: '03112017-085903'
let path = `${('0'+d.getDate()).slice(-2)}${('0'+(d.getMonth()+1)).slice(-2)}${d.getFullYear()}-${('0'+d.getHours()).slice(-2)}${('0'+d.getMinutes()).slice(-2)}${('0'+d.getSeconds()).slice(-2)}`;

var markets = [
    { name: 'BTC-GRS', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-PAY', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-NEO', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-ETH', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-BCC', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-VTC', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-OMG', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-ZEN', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-MCO', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 },
    { name: 'BTC-XRP', readings: [], amount: 0, sellPrice: 0, orginalPrice: 0 }
]

var getChange = function(market, seconds){
    if (market.readings.length < seconds) {
        return null;
    }
    var lastX = _.last(market.readings, seconds);
    var now = _.last(market.readings).Last;
    var past = _.first(lastX).Last;
    var changeNum = (now-past) / past * 100;
    return changeNum.toFixed(2);
}

var priceReduction = function(price, percent){
    return price - (price * (percent/100))
}

var buyCurrency = function(ticker){
    var market = _.findWhere(markets, {name: ticker.MarketName});
    if ((market.amount * market.sellPrice) < btc/10){ //10% of "bank" can buy
        market.sellPrice = priceReduction(ticker.Last, 2); //reduce 2% this is now sell point.
        market.orginalPrice = market.sellPrice;
        let amount = btc/10;
        market.amount = ((1/ticker.Last) * amount); ///(amount*ticker.Last).toFixed(8);
        btc = priceReduction(btc, 10)
        logger.appendText(path, `BOUGHT ${market.amount} ${ticker.MarketName} at ${ticker.Last}`);
        logger.appendText(path, `--- BTC ${btc} ---`);
        console.log(`BOUGHT ${market.amount} ${ticker.MarketName} at ${ticker.Last}`)
    }
}

var sellCurrency = function(ticker){
    var market = _.findWhere(markets, {name: ticker.MarketName});
    logger.appendText(path, `SOLD ${market.amount} ${market.name} at ${ticker.Last}`)

    btc += market.amount*ticker.Last;
    market.amount = 0;
    market.sellPrice = 0;
    market.orginalPrice = 0;
    logger.appendText(path, `--- BTC ${btc} ---`);
    console.log(`SOLD ${market.amount} ${market.name} at ${ticker.Last}`);
}

logger.appendText(path, `Starting run. BTC: ${btc}`);

var startSniff = function(marketName){
    logger.appendText(path, marketName);
    let times = 0;
    setInterval(() => {
         bittrex2.getTickerInfo(marketName).then(function(ticker){
             times++;
            var market = _.findWhere(markets, {name: marketName});
            market.readings.push(ticker);
            let last10 = getChange(market, 2);
            let last30 = getChange(market, 6);
            let last60 = getChange(market, 12);
            let last120 = getChange(market, 24);
            let last = ticker.Last.toFixed(8);
            let time = new Date(ticker.TimeStamp).toLocaleTimeString();
            let difference = (last-market.orginalPrice)/market.sellPrice*100;

            let shouldBuy = last10 >= 0 && last30 > 0 && last60 > last30 && last120 > last60;

            if (last10 && last30 && last60 && last120 && shouldBuy){
                buyCurrency(ticker);
            } 
            else if (market.amount > 0) {
                if(market.sellPrice >= last){
                    sellCurrency(ticker)
                }
                if (market.sellPrice < priceReduction(ticker.Last, 2)){
                    market.sellPrice = priceReduction(ticker.Last, 2);
                }
            }

            console.log(`${time} ${ticker.MarketName} - ${last} ${last10}% ${last30}% ${last60}% ${last120}% A: ${market.amount.toFixed(5)} S: ${market.sellPrice.toFixed(8)} ${difference.toFixed(2)}%`);

            if (market.readings.length > 1000){
                market.readings = market.readings.slice(500);
            }
        })
    }, 5000)
}

for (var i = 0; i < markets.length; i++) {
    try{
        startSniff(markets[i].name);
    } catch (err){
        console.log('Main error', err);
    }
}
