app.controller("playerListController", ['$scope', '$http', '$location', function($scope, $http, $location) {
    $http({
        method: 'GET',
        url: $location.path() + '/players/46412387',
    }).success(function(response) {
        console.log(response);
        $scope.players = response.players;
    });
}]);
