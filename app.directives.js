'use strict';


angular
    .module('myApp')
    // Angular File Upload module does not include this directive
    // Only for example

    /**
    * The ng-thumb directive
    * @author: nerv
    * @version: 0.1.2, 2014-01-09
    */

    .service("$history", function ($state, $rootScope, $window) {

        var history = [];

        angular.extend(this, {
            push: function (state, params) {
                history.push({ state: state, params: params });
            },
            all: function () {
                return history;
            },
            go: function (step) {
                // TODO:
                // (1) Determine # of states in stack with URLs, attempt to
                //    shell out to $window.history when possible
                // (2) Attempt to figure out some algorthim for reversing that,
                //     so you can also go forward

                var prev = this.previous(step || -1);
                return $state.go(prev.state, prev.params);
            },
            previous: function (step) {
                return history[history.length - Math.abs(step || 1)];
            },
            back: function () {
                return this.go(-1);
            }
        });

    })
    // reference: http://chariotsolutions.com/blog/post/angularjs-corner-using-promises-q-handle-asynchronous-calls/
    .service('asyncService', function ($http, $q) {
        return {
            loadDataFromUrls: function (urls) {
                var defer = $q.defer();
                var urlCalls = [];
                _.each(urls, function (url) { urlCalls.push($http.get(url.url)); });

                $q.all(urlCalls).then(function (data) {
                    var result = _.map(data, function (d, i) { return { data: d.data, name: urls[i].name } });
                    defer.resolve(result);
                },
                function (error) {
                    defer.reject(error);
                },
                function (updates) {
                    defer.update(updates);
                });

                return defer.promise;
            }
        }
    })

        //.service('grasslandFilter', function ($http, $q) {
        //    return {
        //        createFilterModel: function (model) {
        //            var filterModel = {
        //                enumString: '',
        //                selectedEnumTypeList: [],
        //                filterSelections: [
        //                ],
        //            }

        //            return filterModel;
        //            //var defer = $q.defer();
        //            //var urlCalls = [];
        //            //_.each(modal, function (url) { urlCalls.push($http.get(url.url)); });

        //            //$q.all(urlCalls).then(function (data) {
        //            //    var result = _.map(data, function (d, i) { return { data: d.data, name: modal[i].name } });
        //            //    defer.resolve(result);
        //            //},
        //            //function (error) {
        //            //    defer.reject(error);
        //            //},
        //            //function (updates) {
        //            //    defer.update(updates);
        //            //});

        //            //return defer.promise;
        //        }
        //    }
        //})

    .run(function ($history, $state, $rootScope) {
        //var connection = $.connection.hub.url = "/signalr";
        $rootScope.$on("$stateChangeSuccess", function (event, to, toParams, from, fromParams) {

            
            if ($.connection && $.connection.hub.state && $.connection.hub.state !== 4 /* disconnected */) {
                ///console.log('signlar connection abort');
                $.connection.hub.stop();
            }

            if (!from.abstract) {
                $history.push(from, fromParams);
            }
        });

        $history.push($state.current, $state.params);

    })
    
    

    .directive('ngThumb', ['$window', function ($window) {
        var helper = {
            support: !!($window.FileReader && $window.CanvasRenderingContext2D),
            isFile: function (item) {
                return angular.isObject(item) && item instanceof $window.File;
            },
            isImage: function (file) {
                var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        };

        return {
            restrict: 'A',
            template: '<canvas/>',
            link: function (scope, element, attributes) {
                if (!helper.support) return;

                var params = scope.$eval(attributes.ngThumb);

                if (!helper.isFile(params.file)) return;
                if (!helper.isImage(params.file)) return;

                var canvas = element.find('canvas');
                var reader = new FileReader();

                reader.onload = onLoadFile;
                reader.readAsDataURL(params.file);

                function onLoadFile(event) {
                    var img = new Image();
                    img.onload = onLoadImage;
                    img.src = event.target.result;
                }

                function onLoadImage() {
                    var width = params.width || this.width / this.height * params.height;
                    var height = params.height || this.height / this.width * params.width;
                    canvas.attr({ width: width, height: height });
                    canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
                }
            }
        };
    }])
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter, { 'event': event });
                    });

                    event.preventDefault();
                }
            });
        };
    })
app.directive("passwordVerify", function () {
    return {
        require: "ngModel",
        scope: {
            passwordVerify: '='
        },
        link: function (scope, element, attrs, ctrl) {
            scope.$watch(function () {
                var combined;

                if (scope.passwordVerify || ctrl.$viewValue) {
                    combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                }
                return combined;
            }, function (value) {
                if (value) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        var origin = scope.passwordVerify;
                        if (origin !== viewValue) {
                            ctrl.$setValidity("passwordVerify", false);
                            return undefined;
                        } else {
                            ctrl.$setValidity("passwordVerify", true);
                            return viewValue;
                        }
                    });
                }
            });
        }
    };
})


 .directive('validatePasswordCharacters', function() {
  var REQUIRED_PATTERNS = [
    /\d+/,    //numeric values
    /[a-z]+/, //lowercase values
    /[A-Z]+/, //uppercase values
    /\W+/,    //special characters
    /^\S+$/   //no whitespace allowed
  ];

  return {
    require : 'ngModel',
    link : function($scope, element, attrs, ngModel) {
      ngModel.$validators.passwordCharacters = function(value) {
        var status = true;
        angular.forEach(REQUIRED_PATTERNS, function(pattern) {
          status = status && pattern.test(value);
        });
        return status;
      }; 
    }
  }
 })


//.directive('showErrors', function () {
//    return {
//        restrict: 'A',
//        require: '^form',
//        link: function (scope, el, attrs, formCtrl) {
//            // find the text box element, which has the 'name' attribute
//            var inputEl = el[0].querySelector("[name]");
//            // convert the native text box element to an angular element
//            var inputNgEl = angular.element(inputEl);
//            // get the name on the text box so we know the property to check
//            // on the form controller
//            var inputName = inputNgEl.attr('name');
//            // only apply the has-error class after the user leaves the text boxz

//            var formSubmitted = formCtrl.$submitted;
//            var inputTouched = inputNgEl.$touched;
//            var error = inputNgEl.$error;


//            //el.attr('ng-class', "{ 'has-error': (" + formCtrl.$name + ".$submitted ||" + formCtrl.$name + "." + inputName + ".$touched) && "
//            //    + formCtrl.$name + "." + inputName + ".$error }");


//            //inputNgEl.bind('blur', function () {
//            //    el.toggleClass('has-error', formCtrl[inputName].$invalid);
//            //});
//        }
//    }
//})


//temporary fix
.directive('datepickerPopup', function (dateFilter, datepickerPopupConfig) {
    return {
        restrict: 'A',
        priority: 1,
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
            var dateFormat = attr.datepickerPopup || datepickerPopupConfig.datepickerPopup;
            ngModel.$formatters.push(function (value) {
                return dateFilter(value, dateFormat);
            });
        }
    };
})
.directive('numberonlyinput', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
})

.directive('checkdateformat', function () {
    var INTEGER_REGEXP = /^(19|20)\d\d([-])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/;
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.checkdateformat = function (modelValue, viewValue) {
                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty models to be valid
                    return true;
                }

                if (INTEGER_REGEXP.test(viewValue)) {
                    // it is valid
                    return true;
                }

                // it is invalid
                return false;
            };
        }
    };
})
.directive('datepickerLocaldate', ['$parse', function ($parse) {
    var directive = {
        restrict: 'A',
        require: ['ngModel'],
        link: link
    };
    return directive;

    function link(scope, element, attr, ctrls) {
        var ngModelController = ctrls[0];

        // called with a JavaScript Date object when picked from the datepicker
        ngModelController.$parsers.push(function (viewValue) {
            // undo the timezone adjustment we did during the formatting
            viewValue.setMinutes(viewValue.getMinutes() - viewValue.getTimezoneOffset());
            // we just want a local date in ISO format
            return viewValue.toISOString().substring(0, 10);
        });

        // called with a 'yyyy-mm-dd' string to format
        ngModelController.$formatters.push(function (modelValue) {
            if (!modelValue) {
                return undefined;
            }
            // date constructor will apply timezone deviations from UTC (i.e. if locale is behind UTC 'dt' will be one day behind)
            var dt = new Date(modelValue);
            // 'undo' the timezone offset again (so we end up on the original date again)
            dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
            return dt;
        });
    }
}])
    .directive('customPopover', function () {
        return {
            restrict: 'A',
            template: '<span>{{label}}</span>',
            link: function (scope, el, attrs) {
                scope.label = attrs.popoverLabel;
                $(el).popover({
                    trigger: 'click',
                    html: true,
                    content: attrs.popoverHtml,
                    placement: function (tip, element) {
                        var offset = $(element).offset();
                        height = $(document).outerHeight();
                        width = $(document).outerWidth();
                        vert = 0.5 * height - offset.top;
                        vertPlacement = vert > 0 ? 'bottom' : 'top';
                        horiz = 0.5 * width - offset.left;
                        horizPlacement = horiz > 0 ? 'right' : 'left';
                        placement = Math.abs(horiz) > Math.abs(vert) ? horizPlacement : vertPlacement;
                        return placement;
                    }
                });
            }
        };
    })
.directive("starRating", function () {
    return {
        restrict: "EA",
        template: "<ul class='rating' ng-class='{readonly: readonly}'>" +
                   "  <li ng-repeat='star in stars' ng-class='star' ng-click='toggle($index)'>" +
                   "    <i class='fa fa-star'></i>" + //&#9733
                   "  </li>" +
                   "</ul>",
        scope: {
            ratingValue: "=ngModel",
            max: "=?", //optional: default is 5
            onRatingSelected: "&?",
            readonly: "=?"
        },
        link: function (scope, elem, attrs) {
            if (scope.max == undefined) { scope.max = 5; }
            function updateStars() {
                scope.stars = [];
                for (var i = 0; i < scope.max; i++) {
                    scope.stars.push({
                        filled: i < scope.ratingValue
                    });
                }
            };
            scope.toggle = function (index) {
                if (scope.readonly == undefined || scope.readonly == false) {
                    scope.ratingValue = index + 1;
                    scope.onRatingSelected({
                        rating: index + 1
                    });
                }
            };
            scope.$watch("ratingValue", function (oldVal, newVal) {
                if (newVal) { updateStars(); }
            });
        }
    };
});
