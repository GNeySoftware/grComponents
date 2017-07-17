angular.module('grComponents')
.factory('authInterceptorService', ['$q', '$location',
'localStorageService', function ($q, $location, localStorageService) {
    var authInterceptorServiceFactory = {};

    var _request = function (config) {

        config.headers = config.headers || {};

        var authData = localStorageService.get('authorizationData');
        if (authData) {
            config.headers.Authorization = 'Bearer ' + authData.token;
        }

        return config;
    }

    var _responseError = function (rejection) {
        if (rejection.status === 401) {
            $location.path('/login');
        }
        return $q.reject(rejection);
    }

    authInterceptorServiceFactory.request = _request;
    authInterceptorServiceFactory.responseError = _responseError;

    return authInterceptorServiceFactory;
}])
.factory('authService', ['$location', '$http', '$q', 'localStorageService', '$rootScope', function ($location, $http,
    $q, localStorageService, $rootScope) {
    var serviceBase = '/';
    var authServiceFactory = {};

    var _authentication = {
        isAuth: false,
        userName: ""
    };

    var _saveRegistration = function (registration) {
        _logOut();

        return $http.post(serviceBase + 'api/account/register', registration).then(function (response) {
            return response;
        });
    };

    var _getUserData = function (deferred, tokenData, additionalFunc) {
        $http.get('/api/account/userroledata').success(function (roleData) {
            //Roles & Rules
            _authentication.roles = roleData.roles;
            _authentication.rules = roleData.rules;
            $http.get('/api/userProfile/current').success(function (userData) {
                //Full Name
                _authentication.displayName = userData.displayName;
                var store = {
                    token: tokenData.access_token,
                    userName: tokenData.userName,
                    displayName: userData.displayName,
                    roles: roleData.roles,
                    rules: roleData.rules,
                };

                if (additionalFunc) {
                    additionalFunc().then(function (data) { //return either value or object
                        _authentication.additional = data;
                        store.additional = data;
                        localStorageService.set('authorizationData', store);
                        deferred.resolve(tokenData);
                        $rootScope.$broadcast('loggedIn');
                    });
                } else {
                    localStorageService.set('authorizationData', store);
                    deferred.resolve(tokenData);
                    $rootScope.$broadcast('loggedIn');
                }
            });
        });
    }
    var _login = function (loginData, additionalFunc, tokenData) {
        var deferred = $q.defer();

        if (tokenData == null) {
            var data = "grant_type=password&username=" +
                            loginData.userName + "&password=" + loginData.password;

            $http.post(serviceBase + 'token', data, {
                headers:
                { 'Content-Type': 'application/x-www-form-urlencoded' }
            }).success(function (response) {
                _authentication.isAuth = true;
                _authentication.userName = loginData.userName;

                localStorageService.set('authorizationData',
                {
                    token: response.access_token,
                    userName: loginData.userName
                });

                _getUserData(deferred, response, additionalFunc);
            }).error(function (err, status) {
                _logOut();
                deferred.reject(err);
            });
        }
        else {
            _authentication.isAuth = true;
            _authentication.userName = tokenData.userName;
            _authentication.external = true;

            localStorageService.set('authorizationData',
            {
                token: tokenData.access_token,
                userName: tokenData.userName,
                external: true,
            });

            _getUserData(deferred, tokenData, additionalFunc);
        }

        return deferred.promise;
    };

    var _logOut = function () {
        localStorageService.remove('authorizationData');

        _authentication.isAuth = false;
        _authentication.userName = "";
        _authentication.displayName = "";
        _authentication.roles = {};
        _authentication.rules = {};
    };

    var _fillAuthData = function () {
        var authData = localStorageService.get('authorizationData');
        if (authData) {
            _authentication.isAuth = true;
            _authentication.userName = authData.userName;
            _authentication.displayName = authData.displayName;
            _authentication.roles = authData.roles
            _authentication.rules = authData.rules;

            if (authData.additional)
                _authentication.additional = authData.additional;
        }
    }

    var _authorize = function (rule) {
        if (rule == '')
            return true;

        if (_.some(_authentication.roles) && _authentication.roles.indexOf('Administrator') > -1)
            return true;

        if (_.some(_authentication.rules) && _authentication.rules.indexOf(rule) > -1)
            return true;

        return false;
    }

    authServiceFactory.saveRegistration = _saveRegistration;
    authServiceFactory.login = _login;
    authServiceFactory.logOut = _logOut;
    authServiceFactory.fillAuthData = _fillAuthData;
    authServiceFactory.authentication = _authentication;
    authServiceFactory.authorize = _authorize;

    return authServiceFactory;
}])
//filters
.filter('audit', function () {
    return function (audit) {
        return moment(audit.updatedDate).fromNow() + '\n\r' + (audit.updatedBy? audit.updatedBy : 'system');
    }
});




;