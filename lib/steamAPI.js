var request = require('request');
var querystring = require('querystring');
var bignum = require('bignum');

var STEAM_API_KEY = '56F143C7CA54E11F9416F5E535A629E8';
var ANONYMOUS_ID = '4294967295';

module.exports = {
    getPeers: function(playerID, callback) {
        console.log("info [steam-api]: requesting match history for player " + playerID);

        var params = {
            key: STEAM_API_KEY,
            language: 'en_us',
            format: 'JSON',
            account_id: playerID,
            matches_requested: '5'
        };

        request('https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v001/?' + querystring.stringify(params), function(error, response, body) {
            if (!error && response.statusCode == 200) {
                // Parse the JSON response
                try {
                    var result = JSON.parse(body).result;
                } catch(err) {
                    callback({success: false, reason: "could not parse server response"});
                }

                if (result.status === 1) {
                    // Get all unique players with public steam IDs
                    var players = {};
                    result.matches.forEach(function(match) {
                        match.players.forEach(function(player) {
                            if (player.account_id !== ANONYMOUS_ID && !(player.account_id in players))
                                players[player.account_id] = "";
                        });
                    });

                    players = Object.keys(players);
                    console.log("info [steam-api]: found games with " + players.length.toString() + " different peers");

                    getPlayerSummaries(players, function(result) {
                        if (result.success)
                            console.log("info [steam-api]: retrieved names and avatars for " + players.length.toString() + " players");
                        callback(result);
                    });

                } else {
                    callback({success: false, reason: "server could not retrieve match history"});
                }
            } else {
                if (error)
                    callback({success: false, reason: "could not contact server"});
                else
                    callback({success: false, reason: "server returned status " + response.statusCode.toString()});
            }
        });
    },

    getAllMatches: function(playerID, callback) {
        console.log("info [steam-api]: requesting complete match history for player " + playerID);
        getAllMatchesRec(playerID, true, null, [], function(response) {
            if (response.success)
                console.log("info [steam-api]: retrieved " + response.matches.length.toString() + " matches for player " + playerID);
            callback(response);
        });
    }
};

function getPlayerSummaries(playerIDs, callback) {
    console.log("info [steam-api]: requesting summaries for players [" + playerIDs.join(',') + "]");

    // Convert the 32-bit steam IDs to 64-bit steam IDs
    var playerIDs64 = playerIDs.slice(0);
    for (var i = 0; i < playerIDs64.length; i++)
         playerIDs64[i] = steamID32To64(playerIDs64[i]);

    var params = {
        key: STEAM_API_KEY,
        language: 'en_us',
        format: 'JSON',
        steamids: playerIDs64.join(',')
    };

    request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?' + querystring.stringify(params), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Parse the JSON response
            try {
                var result = JSON.parse(body);
            } catch(err) {
                callback({success: false, reason: "could not parse server response"});
            }

            var players = [];
            result.response.players.forEach(function(player) {
                players.push({id: steamID64To32(player.steamid), name: player.personaname, avatar: player.avatarmedium});
            });
            callback({success: true, players: players});

        } else {
            if (error)
                callback({success: false, reason: "could not contact server"});
            else
                callback({success: false, reason: "server returned status " + response.statusCode.toString()});
        }
    });
}

function steamID32To64(id) {
    return bignum(id).add('76561197960265728').toString();
}

function steamID64To32(id) {
    return bignum(id).sub('76561197960265728').toString();
}

function getAllMatchesRec(playerID, isFirstCall, startMatchID, allMatchIDs, callback) {
    var params = {
        key: STEAM_API_KEY,
        language: 'en_us',
        format: 'JSON',
        account_id: playerID,
        matches_requested: '25'
    };

    if (!isFirstCall)
        params.start_at_match_id = startMatchID;

    request('https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v001/?' + querystring.stringify(params), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Parse the JSON response
            try {
                var result = JSON.parse(body).result;
            } catch(err) {
                callback({success: false, reason: "could not parse server response"});
                return;
            }

            if (result.status === 1) {
                // Skip the first match (duplicate) on subsequent calls
                var startIndex = isFirstCall ? 0 : 1;
                for (var i = startIndex; i < result.matches.length; i++) {
                    allMatchIDs.push(result.matches[i].match_id);
                }

                // If the results no longer give 25 maches, we are at the end
                if (result.matches.length === 25) {
                    startMatchID = result.matches[result.matches.length-1].match_id;
                    getAllMatchesRec(playerID, false, startMatchID, allMatchIDs, callback);
                } else {
                    callback({success: true, matches: allMatchIDs});
                }

            } else {
                callback({success: false, reason: "server could not retrieve match history"});
                return;
            }
        } else {
            if (error) {
                callback({success: false, reason: "could not contact server"});
                return;
            } else {
                callback({success: false, reason: "server returned status " + response.statusCode.toString()});
                return;
            }
        }
    });

}
