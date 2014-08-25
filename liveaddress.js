var liveaddress = angular.module('liveaddress', []);

liveaddress.directive('liveaddress', ['$http', '$q', function($http, $q){
  return {
    restrict: 'A',
    templateUrl: 'partial.html',
    replace: true,
    scope: {
      token: '=',
      address: '=?',
      update: '=?',
      inputClass: '=?'
    },
    link: function(scope, element, attrs){
      var canceler;

      scope.suggestions = [];
      scope.current = 0;

      scope.$watch('address', function(newAddress, oldAddress){
        if (canceler) {
          canceler.resolve();
        }

        if (scope.suggestions && scope.suggestions[scope.current] && scope.suggestions[scope.current].text == newAddress) {
          return;
        }

        if (!newAddress) {
          scope.suggestions = [];
          scope.current = 0;
          return;
        }

        canceler = $q.defer();

        $http({
          method: 'GET',
          url: 'https://autocomplete-api.smartystreets.com/suggest',
          params: {
            'auth-id': scope.token,
            'prefix': newAddress
          },
          timeout: canceler
        }).success(function(data, status, headers, config){
          scope.suggestions = data.suggestions;
          scope.current = 0;
        }).error(function(data, status, headers, config){
          scope.suggestions = [];
          scope.current = 0;
        });
      });

      var updateSuggestion = function(){
        var current = scope.suggestions ? scope.suggestions[scope.current] : false;
        if (current) {
          scope.update && scope.update(current);
        } else {
          scope.address = '';
          scope.update && scope.update(false);
        }
      };

      scope.$watch('suggestions', updateSuggestion);
      scope.$watch('current', function(current, lastCurrent){
        updateSuggestion();
        if (scope.suggestions && (current || current != lastCurrent)) {
          scope.address = scope.suggestions[scope.current].text;
        }
      });

      scope.handleKeydown = function(e){
        if (e.which == 38) {
          //up
          if (scope.current == 0) {
            scope.current = scope.suggestions.length-1;
          } else {
            scope.current--;
          }
        } else if (e.which == 40) {
          //down
          if (scope.current == scope.suggestions.length-1) {
            scope.current = 0;
          } else {
            scope.current++;
          }
        } else {
          return;
        }
        e.preventDefault();
        return false;
      };
    }
  };
}]);