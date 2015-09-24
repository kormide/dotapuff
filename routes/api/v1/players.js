var express = require('express');
var router = express.Router();
var steamAPI = require('../../../lib/steamAPI');
var config = require('../../../config.json');

router.get('/peers/:steam_id', function(req, res) {
    console.log("request: api/v1/players/peers/" + req.params.steam_id);

    steamAPI.getPeers(config.STEAM_API_KEY, req.params.steam_id, function(response) {
        if (!response.success) {
            console.warn("error: request for peers failed [" + response.reason + "]");
        }
        res.send(response);
    });
});

router.get('/stats/:steam_id', function(req, res) {
    console.log("request: api/v1/players/stats/" + req.params.steam_id);

    steamAPI.getPlayerStats(config.STEAM_API_KEY, req.params.steam_id, 57, function(response) {
        if (!response.success) {
            console.warn("error: request for player stats failed [" + response.reason + "]");
        }
        res.send(response);
    });
});

module.exports = router;
