'use strict';
var express = require('express');
var router = express.Router();
var Task = require('../models/Tasks');
var url = require('url');
var stripe = require("stripe")("sk_test_z0J9ztS4FFBddItntsNbduUE");
var helpers = require('../helpers/helpers');
// premier test

router.get('/itinerary',
    function (req, res)
    {
        Task.getAllItineraries(function (err, row)
        {
            if (err) {
                res.json(err);
            }
            else {
                res.json(row);
            }
        });
    }
);

//router.get('/itineraries/theme/:theme/distance/:distance/duree/:duree/typeparcours/:typeparcours/note/:note/tarif/:tarif/langue/:langue', function (req, res)

router.get('/itineraries',
    function (req, res)
    {
        var get_params = url.parse(req.url, true).query;

        if (Object.keys(get_params).length == 10)
        {
            Task.getItineraries(get_params.theme, get_params.duree, get_params.typeparcours, get_params.note, get_params.tarif, get_params.langue, get_params.stltt, get_params.endltt, get_params.stlgt, get_params.endlgt,
                function (err, row)
                {
                    if (err)
                    {
                        res.json(err);
                    }
                    else
                    {
                        res.json(row);
                    }
                }
            );      
        }
    }
);

router.get('/message/:clef', function (req, res)
{
    if (req.params.clef)
    {
        Task.getMessage(req.params.clef, function (err, row)
        {
            if (err)
            {
                res.json(err);
            }
            else
            {
                res.json(row);
            }
        });
    }

});

/*router.get('/message/:clef', function (req, res) {
    if (req.params.clef) {
        Task.getMessage(req.params.clef, function (err, row) {
            if (err) {
                res.json(err);
            }
            else {
                res.json(row);
            }
        });
    }

});*/


router.post('/comment', function (req, res, next)
{
    Task.addEvaluation(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            req.body.IsTransmitted = true;
            res.json(req.body);
        }
    });
}
);

router.post('/report', function (req, res, next) {
    Task.addSignalement(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            req.body.IsTransmitted = true;
            res.json(req.body);
        }
    });
}
);

router.post('/transaction', function (req, res, next) {
    var responseStripe;

    Task.transaction(req.body, function (err, count) {
        if (err) {
            res.json(err);
        }
        else {
            //res.send(count);

            responseStripe = count;

            if (responseStripe.status == "succeeded") {

                /*var fee = (0.30 + 0.03 * responseStripe.amount/100);
                fee = parseFloat(planer.toFixed(2));*/

                var fee = helpers.feeCalculator(responseStripe.amount / 100);

                var subscription = {
                    clef_parcours: req.body.itineraryId,
                    date_debut: Date.now(),
                    date_fin: Date.now() + (24 * 60 * 60 * 1000),
                    amount: responseStripe.amount / 100,
                    fee: fee,
                    tva_rate: 0.20,
                    currency: responseStripe.currency,
                    cgv_approval: req.body.CgvApproval,
                };

                Task.subscription(subscription, function (err, count) {
                    if (err) {
                        res.json(err);
                    }
                    else {

                        stripe.charges.capture(responseStripe.id);

                        var response = {
                            Token: count.insertId,
                            DateFin: subscription.date_fin,
                            Status: "succeeded",
                            RememberData: responseStripe.customer
                        };


                        res.json(response);
                    }
                });
            }
            else {
                var alert = { msg: "payment failed" };

                res.json(alert);
            }
        }
    });
});

    router.get('/subscriptionChecking',
        function (req, res) {

            var get_params = url.parse(req.url, true).query;

            if (Object.keys(get_params).length == 1)
            {
                Task.subscriptionChecking(get_params.researchedToken, function (err, row) {
                    if (err) {
                        res.json(err);
                    }
                    else {
                        res.json(row);
                    }
                });
            }

    });

    /*router.get('/CGU',
        function (req, res) {

            var get_params = url.parse(req.url, true).query;

            if (Object.keys(get_params).length == 2) {
                Task.subscriptionChecking(get_params.researchedToken, function (err, row) {
                    if (err) {
                        res.json(err);
                    }
                    else {
                        res.json(row);
                    }
                });
            }

    });

    router.get('/CGV',
        function (req, res) {

            var get_params = url.parse(req.url, true).query;

            if (Object.keys(get_params).length == 2) {
                Task.subscriptionChecking(get_params.researchedToken, function (err, row) {
                    if (err) {
                        res.json(err);
                    }
                    else {
                        res.json(row);
                    }
                });
            }

    });*/


module.exports = router;
