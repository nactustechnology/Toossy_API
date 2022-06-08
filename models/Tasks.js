var db = require('../dbconnection'); //reference of dbconnection.js
var stripe = require("stripe")("sk_test_z0J9ztS4FFBddItntsNbduUE");
var helpers = require('../helpers/helpers');

var Tasks = {

    getItineraries: function (theme, duree, typeparcours, note, tarif, langue, startlatitude, endlatitude, startlongitude, endlongitude, callback) {

        var selectQueryPart = "select clef, titre, description, titre_illustrations, illustrations, type_parcours, theme, langue, duree, payant, telechargeable, tarif, tva, currency, nombre_messages, note, nombre_commentaires, latitude, longitude, itinerarypins from itinerary_parcours_prod ";

        var whereLatitude = "latitude between " + startlatitude.replace(",", ".") + " and " + endlatitude.replace(",", ".") + " and ";

        var whereLongitude = "longitude between " + startlongitude.replace(",", ".") + " and " + endlongitude.replace(",", ".") + " and ";

        if (typeparcours.split(",").length > 1)
        {
            var whereTypeParcours = "type_parcours in (" + typeparcours + ") and ";
        }
        else
        {
            var whereTypeParcours = "type_parcours =" + typeparcours + " and ";
        }

        var whereDuree = "duree <=" + duree + " and ";

        var whereNote = "note >=" + note + " and ";

        if (tarif == 0)
        {
            var whereGratuitTarif = "payant = 0 and ";
        }
        else if (tarif == 1000000)
        {
            var whereGratuitTarif = " ";
        }
        else
        {
            var whereGratuitTarif = "tarif <=" + tarif + " and ";
        }

        var whereTheme = "theme in (" + theme + ") and ";

        langue = langue.split(",").join("','");

        var whereLangue = "langue in ('" + langue + "') ";
        

        var whereQueryPart = " where " + whereLatitude + whereLongitude + whereTypeParcours + whereDuree + whereNote + whereGratuitTarif + whereTheme + whereLangue;

        return db.query(selectQueryPart + whereQueryPart, callback);
    },
        
    getMessage: function(clef, callback) {
        return db.query("select clef, clef_parcours, titre, texte, titre_illustrations, illustrations, payant from itinerary_messages_prod where clef=?", [clef], callback);
    },
    
    addEvaluation: function (evaluation, callback) {
        return db.query("insert into itinerary_evaluation_parcours (clef_parcours,commentaire,note) values(?,?,?)", [evaluation.ItineraryKey, evaluation.Comment, evaluation.Rating], callback);
    },

    addSignalement: function (signalement, callback) {
        return db.query("insert into itinerary_signalement_parcours (clef_message,commentaire) values(?,?)", [signalement.ItineraryKey, signalement.Comment], callback);
    },

    transaction: function (charge, callback) {

        db.query("select p.titre, p.tarif , p.tva, p.currency, d.id_acc_u from itinerary_parcours_prod as p inner join itinerary_destinations as d on p.clef_planificateur = d.clef where p.clef=?", [charge.itineraryId],


            function (err, result) {
                if (err)
                    callback(err, null);
                else
                {
                    price = helpers.priceVatCalculator(result[0].tarif, result[0].tva);

                    var planer = helpers.feeCalculator(price);
                    planer = price - planer;

                    price *= 100;

                    planer *= 100;

                    if (charge.RememberData)
                    {
                        stripe.customers.create({
                            email: charge.Description,
                            source: charge.Token,
                        }).then(function (customer) {
                            // YOUR CODE: Save the customer ID and other info in a database for later.
                            return stripe.charges.create({
                                amount: price,
                                currency: result[0].currency,
                                capture: false,
                                description: "Toossy-Achat visite-" + result[0].titre + "-" + charge.itineraryId,
                                customer: customer.id,
                                destination: {
                                    amount: planer,
                                    account: result[0].id_acc_u,
                                },
                            }, callback);
                        })
                    }
                    else if (!charge.RememberData && charge.Token.includes("cus"))
                    {
                        return stripe.charges.create({
                            amount: price,
                            currency: result[0].currency,
                            capture: false,
                            description: "Toossy-Achat visite-" + result[0].titre + "-" + charge.itineraryId,
                            customer: charge.Token,
                            destination: {
                                amount: planer,
                                account: result[0].id_acc_u,
                            },
                        }, callback);
                    }
                    else
                    {
                        return stripe.charges.create({
                            amount: price,
                            currency: result[0].currency,
                            capture: false,
                            description: "Toossy-Achat visite-" + result[0].titre + "-" + charge.itineraryId,
                            source: charge.Token,
                            destination: {
                                amount: planer,
                                account: result[0].id_acc_u,
                            },
                        }, callback);
                    }  
                }
            });
    },

    subscription: function (subscription, callback) {

        return db.query("insert into itinerary_subscriptions (clef_parcours, date_debut, date_fin, amount, fee, tva_rate, currency, cgv_approval) values(?,?,?,?,?,?,?,?)", [subscription.clef_parcours, subscription.date_debut, subscription.date_fin, subscription.amount, subscription.fee, subscription.tva_rate, subscription.currency, subscription.cgv_approval], callback);
    },

    subscriptionChecking: function (subscriptionChecking, callback) {

        return db.query("select clef_parcours, date_fin from itinerary_subscriptions where date_fin > Unix_Timestamp() and clef in (" + [subscriptionChecking] + ")" , callback);
    }
};

module.exports = Tasks;