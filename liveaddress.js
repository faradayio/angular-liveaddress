var liveaddress = angular.module('liveaddress', []);

var hereDoc = function(f) {
  return f.toString().
    replace(/^[^\/]+\/\*!?/, '').
    replace(/\*\/[^\/]+$/, '');
};

liveaddress.run(['$templateCache', function($templateCache) {
  $templateCache.put('angular-liveaddress.html', hereDoc(function(){/*
    <div class="liveaddress">
      <input type="text" ng-model="address" ng-class="inputClass" ng-keydown="handleKeydown($event)" ng-blur="handleBlur()"/>
      <ul class="suggestions" ng-show="!geocoded && suggestions">
        <li
          ng-repeat="(i, suggestion) in suggestions"
          ng-class="{current: i == current}"
          ng-click="select(i)"
          ng-mousedown="ignoreNextBlur()"
        >{{ suggestion.text }}</li>
      </ul>
    </div>
  */})
  );
}]);

liveaddress.directive('liveaddress', ['$http', '$q', function($http, $q){
  return {
    restrict: 'A',
    templateUrl: 'angular-liveaddress.html',
    replace: true,
    scope: {
      token: '=',
      geocoded: '=?ngModel',
      selection: '=?',
      inputClass: '=?'
    },
    link: function(scope, element, attrs){
      var canceler, geocodeCanceler;

      scope.suggestions = [];
      scope.current = 0;
      scope.geocoded = false;
      scope.selection = false;

      scope.$watch('address', function(newAddress, oldAddress){
        if (canceler) {
          canceler.resolve();
        }

        if (scope.suggestions && scope.suggestions[scope.current] && scope.suggestions[scope.current].text == newAddress) {
          return;
        }
        scope.geocoded = false;

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

      scope.$watch('current', function(current, lastCurrent){
        if (scope.suggestions && scope.suggestions[current] && (current || current != lastCurrent)) {
          scope.address = scope.suggestions[scope.current].text;
        }
      });

      scope.$watch('selection', function(selection){
        if (!selection) return;
        if (geocodeCanceler) {
          geocodeCanceler.resolve();
        }
        geocodeCanceler = $q.defer();

        $http({
          method: 'GET',
          url: 'https://api.smartystreets.com/street-address',
          params: {
            'auth-token': scope.token,
            'street': selection.street_line,
            'city': selection.city,
            'state': selection.state
          },
          timeout: geocodeCanceler
        }).success(function(data, status, headers, config){
          scope.geocoded = data[0] || {error: 'noresults'};
        });
      });

      scope.handleKeydown = function(e){
        if (e.which == 13) {
          scope.handleBlur();
        } else if (e.which == 38) {
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

      scope.select = function(item){
        scope.current = item;
        scope.selection = scope.suggestions[scope.current] || false;
      };

      var ignoreBlur = false;

      scope.handleBlur = function(){
        if (ignoreBlur) {
          ignoreBlur = false;
        } else {
          if (scope.suggestions[scope.current]) {
            scope.selection = scope.suggestions[scope.current];
            scope.address = scope.suggestions[scope.current].text;
          } else {
            scope.selection = false;
          }
        }
      };

      scope.ignoreNextBlur = function(){
        ignoreBlur = true;
      };
    }
  };
}]);