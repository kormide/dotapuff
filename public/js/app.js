var app = angular.module("dotapuff", ['chart.js']);

app.controller("controller", ['$scope', '$http', '$location', '$filter', function($scope, $http, $location, $filter) {
    var playerID = "46412387";

    // Request a list of the player's peers in recent games
    $http({
        method: 'GET',
        url: $location.path() + '/players/peers/' + playerID
    }).success(function(response) {
        if (response.success) {
            // Add the players to peer list
            $scope.players = response.players;

            // Ensure the original player searched for is first in the list
            for (var i = 0; i < $scope.players.length; i++) {
                if ($scope.players[i].id === playerID) {
                    var temp = $scope.players[0];
                    $scope.players[0] = $scope.players[i];
                    $scope.players[i] = temp;
                    break;
                }
            }
        } else {
            console.log("error: could not retrieve peers from server [" + response.reason + "]");
            alert("Could not retrieve peers from Dota 2 servers. Please wait a moment, refresh, and try again.");
        }
    });

    // Initialize the left and right comparison players to a "no player" placeholder
    $scope.playerLeft = {id: "000", name: "No Player", avatar: "http://localhost:3000/img/no-player.png"};
    $scope.playerRight = {id: "000", name: "No Player", avatar: "http://localhost:3000/img/no-player.png"};

    // Set up the angular-chart
    //$scope.data = [[1, 2, 3, 1, 5, 3, 2], [1, 5, 2, 3, 1, 4, 2]];
    //$scope.labels = ['1', '', '', '', '5', '', '7'];
    $scope.chartData = [[], []];
    $scope.chartLabels = [];
    $scope.chartSeries = ['Unknown', 'Unknown'];
    $scope.chartOptions = {
      pointDot: false,
      bezierCurveTension: 0.3,
      datasetFill: false,
      maintainAspectRatio: false
    };
    $scope.chartColours = [{strokeColor: 'rgba(255,0,0,1)'}, {strokeColor: 'rgba(0,255,0,1)'}]

    // Change the left comparison player
    $scope.changeLeftPlayer = function(id) {
        for (var i = 0; i < $scope.players.length; i++) {
            if ($scope.players[i].id === id) {
                $scope.playerLeft = $scope.players[i];

                // Request the player's stats
                $http({
                    method: 'GET',
                    url: $location.path() + '/players/stats/' + id
                }).success(function(response) {
                    if (response.success) {

                        // Populate the chart
                        $scope.chartData[0] = [];
                        $scope.chartLabels = [];
                        $scope.chartSeries[0] = $scope.playerLeft.name;
                        for (var i = 0; i < response.outcomes.length; i++) {
                            $scope.chartData[0].push(response.outcomes[i].xpm);
                            if (i % 10 === 0)
                              $scope.chartLabels.push(i.toString());
                            else
                              $scope.chartLabels.push('');
                        }

                    } else {
                        alert("Could not retrieve player stats from Dota 2 servers. Please wait a moment, refresh, and try again.");
                        console.log("error: could not retrieve player stats " + id + " [" + response.reason + "]")
                    }
                });
                break;
            }
        }
    };

    // Change the right comparison player
    $scope.changeRightPlayer = function(id) {
        for (var i = 0; i < $scope.players.length; i++) {
            if ($scope.players[i].id === id) {
                $scope.playerRight = $scope.players[i];

                // Request the player's stats
                $http({
                    method: 'GET',
                    url: $location.path() + '/players/stats/' + id
                }).success(function(response) {
                    if (response.success) {

                        // Populate the chart
                        $scope.chartData[1] = [];
                        $scope.chartLabels = [];
                        $scope.chartSeries[1] = $scope.playerRight.name;
                        for (var i = 0; i < response.outcomes.length; i++) {
                            $scope.chartData[1].push(response.outcomes[i].xpm);
                            if (i % 10 === 0)
                              $scope.chartLabels.push(i.toString());
                            else
                              $scope.chartLabels.push('');
                        }
                    } else {
                        alert("Could not retrieve player stats from Dota 2 servers. Please wait a moment, refresh, and try again.");
                        console.log("error: could not retrieve player stats " + id + " [" + response.reason + "]")
                    }
                });
                break;
            }
        }
    };
}]);
