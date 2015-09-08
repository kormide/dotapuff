var express = require('express');
var router = express.Router();
var steamAPI = require('../lib/steamAPI');

router.get('/:steam_id', function(req, res) {
    console.log("request: players/" + req.params.steam_id);

    steamAPI.getPeers(req.params.steam_id, function(response) {
        if (!response.success) {
            console.warn("error: request for peers failed [" + response.reason + "]");
        }
        res.send(response);
    });
});

module.exports = router;
