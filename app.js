var app = angular.module('app', ['liveaddress']);

app.controller('testCtrl', ['$scope', function($scope){
  $scope.address = '';

  $scope.update = function(data){
    console.log(data);
  };
}]);