angular.module('grComponents')
    .directive('grMeta', function () {
        return {
            restrict: "E",
            scope: {
                meta: '=',
                entityName: '@entityName',
            },
            controller: ['$scope', '$http', function dynamicController($scope, $http) {
                $http.get('/service/' + $scope.entityName + '/meta').success(function (data) {
                    $scope.meta = data;
                });
            }]
        }
    })
    .directive('grDynAtt', function () {
        return {
            link: function (scope, element, attrs) {
                var attributes = $(element).parents('gr-dyn')[0].attributes;
                $.each(attributes, function (i, attrib) {
                    var whiteList = ['step', 'max', 'min', 'username'];
                    if (whiteList.indexOf(attrib.name) > -1)
                        $(element).attr(attrib.name, attrib.value);
                })
            }
        }
    })
    .directive('grDyn', function ($state, $compile) {
        return {
            restrict: "E",
            templateUrl: '/grComponents/grDynamicTemplate.html',
            scope: {
                key: '=?key',
                keyProperty: '=?keyProperty',
                keyPropertyName: '@?keyProperty',
                displayProperty: '=?displayProperty',
                displayPropertyName: '@?displayProperty',
                searchProperty: '=?searchProperty',
                searchPropertyName: '@?searchProperty',
                text: '=?text',
                model: '=?model',
                modelName: '@?model',
                entityName: '=?entityName',
                entityNameName: '@?entityName',
                enumName: '@?enumName',
                flagName: '@?flagName',
                icon: '@?icon',
                label: '@?label',
                min: '=?min',
                max: '=?max',
                input: '@?input',
                placeholder: '@?',
                includes: '@?',
                col: '=?',
                link: '=?',
                state: '@?',
                template: '@?',
                query: '=?',
                autoExpand: '=?',
                queryName: '@?query',
                rows: '=?',
                required: '=?',
                options: '=?',
                hideDefaultOption: '=?',
                change: '&?',
                displayExpression: '@?'
            },
            link: function (scope, element, attrs) {
                var form = $(element).parents('form');
                if (form.length > 0) {
                    var formName = form.attr('name');
                    scope.parentForm = angular.element(form).scope()[formName];
                }

                if (!element.attr('class') || element.attr('class').indexOf('col-') == -1) {
                    element.attr('class', 'col-sm-6 gr-dyn');
                }
                else {
                    element.addClass("gr-dyn");
                }

                if (attrs.state) {
                    var content = $(element).find('.gr-content');
                    var path = scope.modelName;
                    var nameProperty = attrs.displayProperty;

                    if (!nameProperty)
                        nameProperty = 'name';
                    path = path + '.' + nameProperty;

                    var link = '<a href="#" class="control-display gr-dyn-link" ui-sref="' + attrs.state + '">{{' + path + '}}</a>'
                    content.empty();
                    content.append($compile(link)(scope.$parent));
                }

                if (attrs.noLabel) {
                    $(element).find('label').remove();
                    $(element).find('span').remove();
                    $(element).addClass('no-label');
                }

                if (attrs.autoExpand) {
                    scope.autoExpand = true;
                }

                if (attrs.rows) {
                    scope.rows = attrs.rows;
                }

                if (attrs.required == "") {
                    scope.required = true;
                }

                if (attrs.hideDefaultOption == "") {
                    scope.hideDefaultOption = true;
                }
            },
            controller: ['$scope', '$q', '$http', '$state', '$element', function dynamicController($scope, $q, $http, $state, $element) {
                if ($scope.autoExpand) {
                    $($element).on('keydown', 'textarea', function () {
                        var el = this;
                        setTimeout(function () {
                            el.style.cssText = 'height:auto; padding:0';
                            // for box-sizing other than "content-box" use:
                            // el.style.cssText = '-moz-box-sizing:content-box';
                            el.style.cssText = 'height:' + (el.scrollHeight + 10) + 'px !important';
                        }, 0);
                    });

                    //$($element).on('loaded', 'textarea', function () {
                    //    var el = this;
                    //    setTimeout(function () {
                    //        el.style.cssText = 'height:auto; padding:0';
                    //        // for box-sizing other than "content-box" use:
                    //        // el.style.cssText = '-moz-box-sizing:content-box';
                    //        el.style.cssText = 'height:' + (el.scrollHeight + 10) + 'px !important';
                    //    }, 0);
                    //});
                }

                if (!$scope.rows)
                    $scope.rows = 4;

                $scope.internalChange = function () {
                    if ($scope.change)
                        $scope.$eval($scope.change);
                }

                $scope.parentForm = null;
                $scope.emailFormat = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;

                $scope.refereshSelection = function () {
                    if ($scope.input == 'select' && $scope.queryName && $scope.options == null)
                        return;

                    if ($scope.options && $scope.key != null) {
                        var selected = _.find($scope.selection, function (item) {
                            return $scope.getKey(item, $scope.keyProperty) == $scope.key;
                        });
                        if (selected)
                            $scope.box.model = selected;
                    }
                    else if ($scope.options == null) {
                        var url = '';
                        if ($scope.includes)
                            url = 'includes=' + $scope.includes;

                        //temp
                        if ($scope.searchProperty || $scope.searchPropertyName || $scope.displayProperty || $scope.displayPropertyName)
                        {
                            var property = '';
                            if ($scope.searchProperty)
                                property = $scope.searchProperty;
                            else if ($scope.searchPropertyName)
                                property = $scope.searchPropertyName;
                            else if ($scope.displayProperty)
                                property = $scope.displayProperty;
                            else if ($scope.displayPropertyName)
                                property = $scope.displayPropertyName;

                            url += (url ? '&' : '') + 'sort=' + property + '&sortDirection=0'
                        }

                        if (!$scope.entityName)
                            $scope.entityName = $scope.entityNameName;

                        if ($scope.entityName) {
                            $http.get('/service/' + $scope.entityName + '/query' + (url ? ('?' + url) : '')).success(function (data) {
                                $scope.selection = data.list;
                                if ($scope.key != null) {
                                    var selected = _.find($scope.selection, function (item) {
                                        return $scope.getKey(item, $scope.keyProperty) == $scope.key;
                                    });
                                    if (selected)
                                        $scope.box.model = selected;
                                }
                            });
                        }

                    }
                }

                $scope.getKey = function (obj, path) {
                    if (!path || !obj)
                        return obj;

                    var paths = path.split('.'),
                        current = obj,
                        i;

                    for (i = 0; i < paths.length; ++i) {
                        if (current[paths[i]] == undefined) {
                            return undefined;
                        } else {
                            current = current[paths[i]];
                        }
                    }
                    return current;
                }

                $scope.getValue = function (obj, path) {
                    if (!path || !obj)
                        return obj;

                    if ($scope.displayExpression) {
                        var item = obj;
                        return eval($scope.displayExpression);
                    }

                    var paths = path.split('.'),
                        current = obj,
                        i;

                    for (i = 0; i < paths.length; ++i) {
                        if (current[paths[i]] == undefined) {
                            return undefined;
                        } else {
                            current = current[paths[i]];
                        }
                    }
                    return current;
                }

                $scope.inputName = function (name) {
                    return name.replace('.', '');
                }

                $scope.flagRaised = function (key) {
                    return $scope.model & key || (key == 0 && $scope.model != null && $scope.model == 0);
                }

                $scope.refreshEnumeration = function () {
                    var name = $scope.enumName;
                    if ($scope.flagName)
                        name = $scope.flagName;

                    $http.get('/api/enum/enumCollection?name=' + name).success(function (data) {
                        $scope.selection = data;
                    });
                }

                $scope.select = function (item) {
                    if ($scope.input == 'enum' || $scope.type == 'enum')
                        $scope.model = item;
                    else if ($scope.flagRaised(item))
                        $scope.model = $scope.model & ~item;
                    else if (item == 0)
                        $scope.model = 0;
                    else
                        $scope.model = $scope.model | item;
                }

                if (!$scope.label && $scope.modelName) {
                    var propertyList = $scope.modelName.split('.');
                    $scope.label = propertyList[propertyList.length - 1];
                    $scope.label = $scope.label.replace(/([A-Z])/g, ' $1').trim();
                    $scope.label = $scope.label.charAt(0).toUpperCase() + $scope.label.slice(1);
                }

                //if ($scope.input) {
                //    if (Number.isInteger($scope.model)) {
                //        input = 'integer';
                //    }
                //}

                if ($scope.input == 'date') {
                    $scope.$watch('model', function (newValue) {
                        if (typeof newValue == 'string' && newValue != 'Invalid date')
                            $scope.calendar.selectedDate = moment(newValue).toDate();
                        else if ($scope.calendar.selectedDate != newValue)
                            $scope.calendar.selectedDate = newValue;
                    });
                    $scope.calendar = { selectedDate: $scope.model };
                    $scope.dateChanged = function () {
                        $scope.model = $scope.calendar.selectedDate;
                    }
                } else if ($scope.input == 'time') {
                    if ($scope.model == null)
                        $scope.model = new Date();

                    $scope.$watch('model', function (newValue) {
                        $scope.time.selectedTime = newValue;
                    });

                    $scope.time = { selectedTime: $scope.model };
                    $scope.timeChanged = function () {
                        $scope.model = $scope.time.selectedTime;
                    }
                } else if ($scope.input == 'autoComplete' || $scope.input == 'select' || $scope.input == 'multiAutoComplete') {
                    if ($scope.model == null)
                        $scope.model = null;

                    if ($scope.key == null)
                        $scope.key = null;

                    if (!$scope.keyProperty) {
                        $scope.keyProperty = $scope.keyPropertyName;
                        if (!$scope.keyProperty)
                            $scope.keyProperty = 'id';
                    }

                    if (!$scope.displayProperty) {
                        $scope.displayProperty = $scope.displayPropertyName;
                        if (!$scope.displayProperty)
                            $scope.displayProperty = 'name';
                    }

                    $scope.box = { model: $scope.model, key: $scope.key };
                    $scope.$watch('model', function (newValue) {
                        $scope.box.model = newValue;
                        if (newValue == null && $scope.text)
                            $scope.box.model = $scope.text;

                        $scope.internalChange();
                    })

                    $scope.$watch('key', function (newValue) {
                        $scope.box.key = newValue;
                    })

                    $scope.$watch('box.model', function (newValue, oldValue) {
                        if ($scope.input == 'multiAutoComplete') {
                            $scope.model = newValue;
                        } else {
                            if ($scope.type == 'enum') {
                                $scope.model = newValue;
                            } else if (typeof newValue === 'string') {
                                $scope.text = newValue;
                                //added
                                $scope.key = null;
                                $scope.model = null;
                            } else if (newValue != null) {
                                var keyValue = newValue;
                                _.each($scope.keyProperty.split('.'), function (key) {
                                    keyValue = keyValue[key];
                                });
                                $scope.key = keyValue;
                                $scope.text = $scope.getValue(newValue, $scope.displayProperty);
                                $scope.model = newValue;
                                $scope.form.value.$validate();
                            } else if (oldValue != null && newValue == null) {
                                $scope.key = null;
                                $scope.text = "";
                                $scope.model = null;
                            }
                        }
                    });

                    $scope.$watch('box.key', function (newValue) {
                        if ($scope.input == 'autoComplete') {
                            $scope.box.key = newValue;
                            if ($scope.box.model == null && $scope.box.key)
                                $scope.loadItem();
                        }
                    });

                    if ($scope.input == 'select') {
                        $scope.$watch('options', function (newValue) {
                            if ($scope.options != null) {
                                $scope.selection = $scope.options;
                                $scope.refereshSelection();
                            }
                        });

                        $scope.$watch('key', function (newValue) {
                            if ($scope.options != null) {
                                $scope.selection = $scope.options;
                                $scope.refereshSelection();
                            }
                            else if ($scope.enumName || $scope.flagName)
                                $scope.refreshEnumeration();
                            else
                                $scope.refereshSelection();
                        });

                        $scope.$watch('query', function (newValue) {
                            if (newValue && $scope.options == null) {
                                $scope.query.pageSize = 0;
                                $scope.search('').then(function (data) {
                                    $scope.options = data;
                                    $scope.selection = $scope.options;
                                });
                            }
                        })

                        if ($scope.options != null)
                            $scope.selection = $scope.options;
                        else if ($scope.enumName || $scope.flagName)
                            $scope.refreshEnumeration();
                        else
                            $scope.refereshSelection();
                    }
                } else if ($scope.input == 'enum' || $scope.input == 'flag') {
                    $scope.refreshEnumeration();
                }
                    //diplay
                else {
                    $scope.box = { model: $scope.model, key: $scope.key };
                    $scope.$watch('model', function (newValue) {
                        $scope.box.model = newValue;
                    })

                    $scope.$watch('key', function (newValue) {
                        $scope.box.key = newValue;
                    })

                    $scope.$watch('box.key', function (newValue) {
                        if (!$scope.input) {
                            $scope.loadItem();
                        }
                    })

                    $scope.$watch('box.model', function (newValue) {

                        $scope.model = newValue;

                        if (!$scope.input && $scope.model != null) {
                            if ($scope.enumName) {
                                $http.get('/api/enum/enumCollection/?name=' + $scope.enumName).success(function (data) {
                                    $scope.box.display = data[$scope.model];
                                })
                            } else if ($scope.flagName) {
                                $http.get('/api/enum/enumCollection/?name=' + $scope.flagName).success(function (data) {
                                    if ($scope.model == 0)
                                        $scope.box.display = data[$scope.model];
                                    else {
                                        var names = [];
                                        for (var key in data) {
                                            if (key & $scope.model) {
                                                names.push(data[key]);
                                            }
                                        }

                                        $scope.box.display = names.join();
                                    }
                                })
                            }
                        }
                    });
                }

                $scope.loadItem = function () {
                    if (($scope.entityName || $scope.entityNameName) && $scope.box && $scope.box.key) {
                        if (!$scope.keyProperty)
                            $scope.keyProperty = 'id';

                        if (!$scope.displayProperty) {
                            $scope.displayProperty = $scope.displayPropertyName;
                            if (!$scope.displayProperty)
                                $scope.displayProperty = 'name';

                        }

                        var url = '';
                        if ($scope.includes)
                            url = '?includes=' + $scope.includes;

                        if (!$scope.entityName)
                            $scope.entityName = $scope.entityNameName;

                        $http.get('/service/' + $scope.entityName + '/' + $scope.box.key + url).success(function (data) {
                            $scope.box.display = $scope.getValue(data, $scope.displayProperty);
                            $scope.model = data;
                        })
                    }
                    else if ($scope.box && $scope.box.key == null) {
                        $scope.box.display = null;
                        $scope.model = null;
                    }
                }

                $scope.search = function (keyword) {
                    var deferred = $q.defer();

                    if (!$scope.query) {
                        var url = '';
                        if ($scope.includes) {
                            url = '&';
                            var a = $scope.includes.split(",")
                            _.each(a, function (item, i) {
                                url += 'includes=' + item;
                                if (i != (a.length - 1))
                                    url += '&';
                            });
                        }
                        //url = '&includes=' + $scope.includes;
                        var searchProperty = $scope.searchProperty;
                        if (!searchProperty)
                            searchProperty = $scope.searchPropertyName;
                        if (!searchProperty)
                            searchProperty = $scope.displayProperty;

                        if (!$scope.entityName)
                            $scope.entityName = $scope.entityNameName;

                        $http.get('/service/' + $scope.entityName + '/query?type=' + searchProperty + '&pageSize=5&searchText=' + keyword + url).success(function (data) {
                            deferred.resolve(data.list);
                        });
                    } else {
                        var searchProperty = $scope.searchProperty;
                        if (!searchProperty)
                            searchProperty = $scope.searchPropertyName;
                        if (!searchProperty)
                            searchProperty = $scope.displayProperty;

                        var baseQuery = angular.copy($scope.query);
                        if (!baseQuery.multipleFilters) {
                            baseQuery.multipleFilters = [];
                            baseQuery.multipleFilters.push({
                                parameterType: 'String',
                                parameterName: searchProperty
                            });
                        }

                        baseQuery.multipleFilters[0].queryText = keyword;

                        if (!$scope.entityName)
                            $scope.entityName = $scope.entityNameName;

                        $http.get('/service/' + $scope.entityName + '/query?queryModel=' +
                            JSON.stringify(baseQuery)).success(function (data) {
                                deferred.resolve(data.list);
                            });
                }

                    return deferred.promise;
                }

                $scope.$watch('parentForm', function () {
                    if ($scope.parentForm) {
                        $scope.$watch('parentForm.$submitted', function () {
                            if ($scope.parentForm.$submitted)
                                $scope.form.$setSubmitted();
                        });
                    }
                });
            }],
        };
    })
    .directive('convertToNumber', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return val != null ? parseInt(val, 10) : null;
                });
                ngModel.$formatters.push(function (val) {
                    return val != null ? '' + val : null;
                });
            }
        };
    })

//.directive('grMeta', function () {

//}

.directive('grTemplate', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            modelName: '@modelName',
        },
        link: function (scope, element, attrs) {
            var template = element.html();
            $(template).attr('ng-model', attrs['modelName']);
            element.replaceWith($compile(template)(scope.$parent.$parent));
        }
    };
})
.directive('autoCompleteValidator', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.selected = function (modelValue, viewValue) {
                if (!$($(elm).parents('gr-dyn')[0]).attr('text') && scope.required) {
                    if (typeof scope.box.model == 'string' || typeof scope.box.model == 'undefined' || scope.box.model == null)
                        return false;
                }
                return true;
            };
        }
    };
})

.directive('username', function ($q, $timeout) {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var usernames = ['Jim', 'John', 'Jill', 'Jackie'];
            ctrl.$asyncValidators.username = function (modelValue, viewValue) {
                var def = $q.defer();

                if (ctrl.$isEmpty(modelValue)) {
                    // consider empty model valid
                    return def.promise;
                }


                $timeout(function () {
                    // Mock a delayed response
                    if (usernames.indexOf(modelValue) === -1) {
                        // The username is available
                        def.resolve('message here');
                    } else {
                        def.reject();
                    }

                }, 2000);

                return def.promise;
            };
        }
    };
});