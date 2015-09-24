var app = angular.module("dotapuff", ['chart.js']);

app.controller("controller", ['$scope', '$http', '$location', function($scope, $http, $location) {

    $scope.playerID = "46412387";  // By default, my steam ID

    defineHandlers();
    initPage();

    function initPage() {
        // Initialize the left and right comparison players to a "no player" placeholder
        $scope.playerLeft = {id: "000", name: "No Player", avatar: window.location.href.replace(/\/$/, "") + "/img/no-player.png"};
        $scope.playerRight = {id: "000", name: "No Player", avatar: window.location.href.replace(/\/$/, "") + "/img/no-player.png"};

        $scope.isLoadingLeft = false;
        $scope.isLoadingRight = false;
        $scope.metric = 'kda';
        $scope.leftStats = null;
        $scope.rightStats = null;

        // Set up the angular chart
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

        // Load a list f peers
        $scope.loadPeers($scope.playerID);
    }

    function defineHandlers() {
        // Load a list of recent peers for the given player
        $scope.loadPeers = function(id) {
            $scope.players = [];
            $http({
                method: 'GET',
                url: window.location.href.replace(/\/$/, "") + '/api/v1/players/peers/' + id
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
            }).error(function(response, status) {
                console.log("error: could not read server [status=" + status.toString() + "]");
                alert("Could not reach server (status=" + status.toString() + ")");
            });
        }

        // Set a player to be the left or right comparison player
        $scope.changePlayer = function(id, isLeft) {
            // Disallow changing player when that side is already loading
            if (isLeft && $scope.isLoadingLeft || !isLeft && $scope.isLoadingRight)
                return;

            var player = findPlayerByID($scope.players, id);

            if (isLeft) {
                $scope.playerLeft = player;
                $scope.isLoadingLeft = true;
            } else {
                $scope.playerRight = player;
                $scope.isLoadingRight = true;
            }

            // Request the player's stats
            $http({
                method: 'GET',
                url: window.location.href.replace(/\/$/, "") + '/api/v1/players/stats/' + id
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
                        renderStats($scope.leftStats, $scope.metric, 'left'); 
                    } else {
                        $scope.rightStats = response.outcomes;
                        renderStats($scope.rightStats, $scope.metric, 'right'); 
                    }

                    calcMeanStats();

                } else {
                    alert("Could not retrieve player stats from Dota 2 servers. Please wait a moment, refresh, and try again.");
                    console.log("error: could not retrieve player stats " + id + " [" + response.reason + "]")
                }
            }).error(function(response, status) {
                console.log("error: could not read server [status=" + status.toString() + "]");
                alert("Could not reach server (status=" + status.toString() + ")");
            });
        };

        // Change the current metric for measuring performance
        $scope.changeMetric = function(metric) {
            $scope.metric = metric;

            // Render the given metric on the chart
            if ($scope.leftStats)
                renderStats($scope.leftStats, $scope.metric, 'left');

            if ($scope.rightStats)
                renderStats($scope.rightStats, $scope.metric, 'right');

            calcMeanStats();
        }
    }

    // Calculate the mean for currently-displayed stat for the left and right players
    function calcMeanStats() {
        var i, sum;
        if ($scope.leftStats) {
            sum = 0;
            for (i = 0; i < $scope.leftStats.length; i++) {
                sum += $scope.leftStats[i][$scope.metric];
            }
            $scope.meanLeftStat = (sum / $scope.leftStats.length).toFixed(2);
        }
        if ($scope.rightStats) {
            sum = 0;
            for (i = 0; i < $scope.rightStats.length; i++) {
                sum += $scope.rightStats[i][$scope.metric];
            }
            $scope.meanRightStat = (sum / $scope.rightStats.length).toFixed(2);
        }
    }

    // Graph the given metric for the given side
    function renderStats(outcomes, metric, side) {
        // Clean chart
        $scope.chartData[side === 'left' ? 0 : 1] = [];
        $scope.chartSeries[side === 'left' ? 0 : 1] = $scope.playerRight.name;

        // Add data points
        for (var i = 0; i < outcomes.length; i++)
            $scope.chartData[side === 'left' ? 0 : 1].push(outcomes[i][metric]);

        // Add the x-axis labels
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

    // Replace each data piont with a running average of the previous k points
    // Note: each field will have the first k points truncated
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

    function findPlayerByID(players, id) {
        for (var i = 0; i < players.length; i++)
            if (players[i].id === id)
                return players[i];
        return null;
    }

}]);

