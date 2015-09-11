var app = angular.module("dotapuff", ['chart.js']);

app.controller("controller", ['$scope', '$http', '$location', '$filter', function($scope, $http, $location, $filter) {
    var playerID = "46412387";

    // Initialize the left and right comparison players to a "no player" placeholder
    $scope.playerLeft = {id: "000", name: "No Player", avatar: $location.path() + "/img/no-player.png"};
    $scope.playerRight = {id: "000", name: "No Player", avatar: $location.path() + "/img/no-player.png"};

    $scope.isLoadingLeft = false;
    $scope.isLoadingRight = false;
    $scope.mode = 'kda';
    $scope.currStat = 'KDA';
    $scope.leftStats = null;
    $scope.rightStats = null;
    $scope.searchID = "46412387";

    // Set up the angular-chart
    $scope.chartData = [[], []];
    $scope.chartLabels = [];
    $scope.chartSeries = ['Unknown', 'Unknown'];
    $scope.chartOptions = {
      pointDot: false,
      bezierCurveTension: 0.3,
      datasetFill: false,
      maintainAspectRatio: false,
      showTooltips: false
    };
    $scope.chartColours = [{strokeColor: 'rgba(0,255,0,1)'},{strokeColor: 'rgba(255,0,0,1)'}]

    $scope.loadPeers = function(id) {
        $scope.players = [];
        // Request a list of the player's peers in recent games
        $http({
            method: 'GET',
            url: $location.path() + '/players/peers/' + id
        }).success(function(response) {
            if (response.success) {
                // Add the players to peer list
                $scope.players = response.players;

                // Ensure the original player searched for is first in the list
                for (var i = 0; i < $scope.players.length; i++) {
                    if ($scope.players[i].id === id) {
                        var temp = $scope.players[0];
                        $scope.players[0] = $scope.players[i];
                        $scope.players[i] = temp;
                        break;
                    }
                }
            } else {
                console.log("error: could not retrieve peers from server [" + response.reason + "]");
                alert("Could not retrieve peers from Dota 2 servers. Either the ID is invalid, or the steam servers are busy.");
            }
        });
    }

    $scope.loadPeers(playerID);

    $scope.changePlayer = function(id, isLeft) {
        // Disallow changing player when that side is already loading
        if (isLeft && $scope.isLoadingLeft || !isLeft && $scope.isLoadingRight)
            return;

        // Find the player
        for (var i = 0; i < $scope.players.length; i++) {
            if ($scope.players[i].id === id) {

                if (isLeft) {
                    $scope.playerLeft = $scope.players[i];
                    $scope.isLoadingLeft = true;
                } else {
                    $scope.playerRight = $scope.players[i];
                    $scope.isLoadingRight = true;
                }

                // Request the player's stats
                $http({
                    method: 'GET',
                    url: $location.path() + '/players/stats/' + id
                }).success(function(response) {
                    if (isLeft)
                        $scope.isLoadingLeft = false;
                    else
                        $scope.isLoadingRight = false;

                    if (response.success) {
                        // Populate the chart
                        response.outcomes = smoothStats(response.outcomes, Math.ceil(response.outcomes.length / 10));

                        if (isLeft) {
                            $scope.leftStats = response.outcomes;
                            $scope.renderStats($scope.leftStats, $scope.mode, 'left'); 
                        } else {
                            $scope.rightStats = response.outcomes;
                            $scope.renderStats($scope.rightStats, $scope.mode, 'right'); 
                        }

                        $scope.calcMeanStats();

                    } else {
                        alert("Could not retrieve player stats from Dota 2 servers. Please wait a moment, refresh, and try again.");
                        console.log("error: could not retrieve player stats " + id + " [" + response.reason + "]")
                    }
                });
                break;
            }
        }
    };

    $scope.calcMeanStats = function() {
        if ($scope.leftStats) {
            var sum = 0;
            for (var i = 0; i < $scope.leftStats.length; i++) {
                sum += $scope.leftStats[i][$scope.mode];
            }
            $scope.meanLeftStat = (sum / $scope.leftStats.length).toFixed(2);
        }
        if ($scope.rightStats) {
            var sum = 0;
            for (var i = 0; i < $scope.rightStats.length; i++) {
                sum += $scope.rightStats[i][$scope.mode];
            }
            $scope.meanRightStat = (sum / $scope.rightStats.length).toFixed(2);
        }
    }

    $scope.changeMode = function(mode) {
        $scope.mode = mode;

        if ($scope.leftStats) {
            $scope.renderStats($scope.leftStats, $scope.mode, 'left');
        }

        if ($scope.rightStats) {
            $scope.renderStats($scope.rightStats, $scope.mode, 'right');
        }

        $scope.currStat = mode.toUpperCase();

        $scope.calcMeanStats();
    }

    $scope.renderStats = function(outcomes, field, side) {
        $scope.chartData[side === 'left' ? 0 : 1] = [];
        $scope.chartSeries[side === 'left' ? 0 : 1] = $scope.playerRight.name;

        for (var i = 0; i < outcomes.length; i++) {
            $scope.chartData[side === 'left' ? 0 : 1].push(outcomes[i][$scope.mode]);
        }

        if ($scope.chartLabels === [] || $scope.chartLabels.length < outcomes.length) {
            $scope.chartLabels = [];

            for (var i = 0; i < outcomes.length; i++) {
                if ((i+1) % 5 === 0)
                  $scope.chartLabels.push((i+1).toString());
                else
                  $scope.chartLabels.push('');
            }
        }
    }

}]);

function smoothStats(outcomes, k) {
    var smoothFields = ['gpm', 'xpm', 'kda', 'lasthits', 'denies'];

    // Smooth each data field
    smoothFields.forEach(function(field) {
        var data = [];
        for (var i = 0; i < outcomes.length; i++)
            data.push(outcomes[i][field]);
        data = smoothData(data, 5);
        for (var i = 0; i < outcomes.length; i++)
            outcomes[i][field] = data[i];
    });

    outcomes = outcomes.slice(k);
    return outcomes;

    // Running mean smooth
    function smoothData (data, k) {
        var lookback = Array(k);
        var newData = [];

        for (var i = 0; i < data.length; i++) {
            if (i < k) {
                lookback[i] = data[i];
                newData.push(data[i]);
            } else {
                lookback[k-1] = data[i];
                var sum = lookback.reduce(function(a, b) { return a + b; });
                var mean = sum / k;
                newData.push(mean);
                lookback.push(lookback.shift());
            }
        }

        return newData;
    }
}

