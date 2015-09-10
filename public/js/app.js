var app = angular.module("dotapuff", ['chart.js']);

app.controller("controller", ['$scope', '$http', '$location', '$filter', function($scope, $http, $location, $filter) {
    var playerID = "46412387";

    // Request a list of the player's peers in recent games
    $http({
        method: 'GET',
        url: $location.path() + '/players/' + playerID
    }).success(function(response) {
        if (response.success) {
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
        }
    });

    // Initialize the left and right comparison players to a "no selection" placeholder
    $scope.playerLeft = {id: "000", name: "No Player", avatar: "http://localhost:3000/img/no-player.png"};
    $scope.playerRight = {id: "000", name: "No Player", avatar: "http://localhost:3000/img/no-player.png"};

    $scope.changeLeftPlayer = function(id) {
        for (var i = 0; i < $scope.players.length; i++) {
            if ($scope.players[i].id === id) {
                $scope.playerLeft = $scope.players[i];
                break;
            }
        }
    };

    $scope.changeRightPlayer = function(id) {
        for (var i = 0; i < $scope.players.length; i++) {
            if ($scope.players[i].id === id) {
                $scope.playerRight = $scope.players[i];
                break;
            }
        }
    };
}]);
