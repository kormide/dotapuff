var request = require('request');
var querystring = require('querystring');
var bignum = require('bignum');

var STEAM_API_KEY = '56F143C7CA54E11F9416F5E535A629E8';
var ANONYMOUS_ID = '4294967295';

module.exports.getPeers = getPeers;
module.exports.getPlayerStats = getPlayerStats;

function getPeers(playerID, callback) {
    console.log("info [steam-api]: requesting match history for player " + playerID);

    var params = {
        key: STEAM_API_KEY,
        language: 'en_us',
        format: 'JSON',
        account_id: playerID,
        matches_requested: '20'
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
}

function getPlayerStats(playerID, numMatches, callback) {
    getMatchHistory(playerID, numMatches, function(response) {
        if (!response.success) {
            console.log("error: could not get player stats for " + playerID);
            callback(response);
        } else {

            var matchIDs = response.matches;
            var numProcessed = 0;
            var anyRequestFailed = false;
            var outcomes = [];

            // Get the match details for each match
            console.log("info [steam-api]: requesting match details for player " + playerID);
            for (var i = 0; i < matchIDs.length; i++) {
                var params = {
                    key: STEAM_API_KEY,
                    language: 'en_us',
                    format: 'JSON',
                    match_id: matchIDs[i]
                };

                request('https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/V001/?' + querystring.stringify(params), function(error, response, body) {

                    // Keep track of how many responses we have received
                    // to know which reponse is the final one
                    numProcessed++;

                    // If any of the requests have failed so far, do nothing else.
                    // The failed request will have already called the callback with an error
                    if (anyRequestFailed) {
                        console.log("ignoring response");
                        return;
                    }

                    if (!error && response.statusCode == 200) {
                        // Parse the JSON response
                        try {
                            var result = JSON.parse(body).result;
                        } catch(err) {
                            anyRequestFailed = true;
                            callback({success: false, reason: "could not parse server response"});
                            return;
                        }

                        var outcome = {match: result.match_id};

                        // Find the requested player and gather game statistics
                        for (var j = 0; j < result.players.length; j++) {

                            // For some reason, account_id is missing in older matches; ignore them
                            if ('account_id' in result.players[j]) {
                                if (result.players[j].account_id.toString() === playerID) {
                                    var playerSlot = result.players[j].player_slot;

                                    // Player on radiant and won
                                    if (playerSlot <= 4 && result.radiant_win === true)
                                        outcome.win = true;
                                    // Player on dire and won
                                    else if (playerSlot >= 128 && result.radiant_win === false)
                                        outcome.win = true;
                                    // Player lost
                                    else
                                        outcome.win = false;

                                    outcome.gpm = result.players[j].gold_per_min;
                                    outcome.xpm = result.players[j].xp_per_min;
                                    outcome.kda = (result.players[j].kills + result.players[j].assists) / Math.max(1, result.players[j].deaths);
                                    outcome.lasthits = result.players[j].last_hits;
                                    outcome.denies = result.players[j].denies;

                                    outcomes.push(outcome);
                                    break;
                                }
                            } else {
                                console.log("error: wtf? missing account id " + playerID + " in match #" + i);
                            }
                        }

                        // Is this the last request?
                        if (numProcessed === matchIDs.length) {

                            // Sort matches from oldest to newest
                            outcomes.sort(function(a, b) {
                                var x = a['match']; var y = b['match'];
                                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                            });

                            callback({success: true, outcomes: outcomes});
                            return;
                        }
                    } else {
                        if (error) {
                            anyRequestFailed = true;
                            callback({success: false, reason: "could not contact server"});
                            return;
                        } else {
                            anyRequestFailed = true;
                            callback({success: false, reason: "server returned status " + response.statusCode.toString()});
                            return;
                        }
                    }
                });
            }
        }
    })
}

// Get the most recent X matches for the given player
function getMatchHistory(playerID, numMatches, callback) {
    console.log("info [steam-api]: requesting match history (n=" + numMatches.toString() + ") for player " + playerID);
    getMatchHistoryRec(playerID, numMatches, true, null, [], function(response) {
        if (response.success)
            console.log("info [steam-api]: retrieved " + response.matches.length.toString() + " matches for player " + playerID);
        callback(response);
    });
}

function getMatchHistoryRec(playerID, numMatches, isFirstCall, startMatchID, allMatchIDs, callback) {
    var params = {
        key: STEAM_API_KEY,
        language: 'en_us',
        format: 'JSON',
        account_id: playerID,
        matches_requested: Math.min(25, numMatches).toString()  // API only allows 25 matches per request
    };

    // If it's the the first call, we need to add a param to start
    // from the last match in the last response. This one we request
    // appears again in the next call, so increase the number of requests by 1
    if (!isFirstCall) {
        params.start_at_match_id = startMatchID;
        params.matches_requested = Math.min(25, numMatches+1).toString();
    }

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
                    numMatches--;
                }

                // Chain more requests while we still have more matches to find
                if (numMatches > 0 && result.matches.length === 25) {
                    startMatchID = result.matches[result.matches.length-1].match_id;
                    getMatchHistoryRec(playerID, numMatches, false, startMatchID, allMatchIDs, callback);
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

function getPlayerSummaries(playerIDs, callback) {
    console.log("info [steam-api]: requesting summaries for " + playerIDs.length.toString() + " players");

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
