
var helpers = {

    priceVatCalculator: function (priceNet, vat) {

        var price = priceNet * (1 + vat);
        price = parseFloat(price.toFixed(2));

        return price;
    },

    feeCalculator: function (amount) {

        var fee = (0.30 + 0.03 * amount);
        fee = parseFloat(fee.toFixed(2));

        return fee;
    }
};

module.exports = helpers;