app.controller("playerListController", ['$scope', '$http', '$location', function($scope, $http, $location) {
    var playerID = "46412387";

    // Request a list of the player's peers in recent games
    $http({
        method: 'GET',
        url: $location.path() + '/players/' + playerID
    }).success(function(response) {
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
    });
}]);
