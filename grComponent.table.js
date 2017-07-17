angular.module('grComponents')
.directive('grTable', function ($compile) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: '/grComponents/grTableTemplate.html',
        scope: {
            list: '=?list',
            columnList: '=columns',
            query: '=?query',
            resultSet: '=?resultSet',
            refresh: '=refresh',
            showSelection: '=?'
        },
        controller: ['$scope', function tableController($scope) {
            $scope.executeCommand = function (column, item) {
                column.command(item);
            };

            $scope.filterFn = function (column) {
                var authorized = column.authorized == null || column.authorized;
                var show = column.show == null || column.show;
                return authorized && show;
            };

            $scope.selectOne = function (selectedItem) {
                var selection = selectedItem.selected;
                if ($scope.showSelection && $scope.resultSet && $scope.resultSet.list) {
                    _.each($scope.resultSet.list, function (item) {
                        item.selected = false;
                    });
                }

                if ($scope.showSelection && $scope.list) {
                    _.each($scope.list, function (item) {
                        item.selected = false;
                    });
                }

                selectedItem.selected = !selection;
            }

            $scope.getRowStyle = function (item) {
                var hasRowStyle = _.filter($scope.columnList, function (column) {
                    return column.rowStyle != null;
                });

                return _.reduce(hasRowStyle, function (result, column) {
                    return result + ' ' + column.rowStyle(item);
                }, '');
            }

            $scope.getFormat = function (column) {
                if (column.format)
                    return " | " + column.format;

                if (column.queryType) {
                    switch (column.queryType) {
                        case 'DateTime':
                            return " | date: 'd-M-yyyy'";
                        case 'Enum':
                            if (column.filter)
                                return " | EnumDisplay: column.filter.selection";

                            return " | EnumDisplay: column.selection";
                        case 'Flag':
                            if (column.filter)
                                return " | FlagDisplay: column.filter.selection";

                            return " | FlagDisplay: column.selection";
                    }
                }

                return '';
            }

            $scope.sort = function (column) {
                if (column.sort == false)
                    return;
                _.each($scope.columnList, function (item) {
                    if (item != column) {
                        item.asc = null;
                        item.desc = null;
                    }
                })

                if (column.type) {
                    if (!column.asc && !column.desc) {
                        column.asc = true;
                    }
                    else {
                        var asc = column.asc;
                        column.asc = column.desc;
                        column.desc = asc;
                    }
                }

                $scope.refresh = true;
            }
        }],
        link: function (scope, element, attrs) {
            //var compiledHtml = $compile(element.html())(angular.element(element).scope());
            //$(element).prepend(compiledHtml);
        }
    };
})

.directive('grList', function ($compile) {
    return {
        restrict: "A",
        scope: {
            list: '=grList',
            showSelection: '='
        },
        controller: ['$scope', function listSelectionController($scope) {
            $scope.selectDeselectAll = function () {
                _.forEach($scope.list, function (item) {
                    item.selected = $scope.selected;
                });
            }
        }],
        link: function (scope, element, attrs) {
            if (scope.showSelection) {
                element.children('colgroup').prepend(' <col style="width:25px;" />');
                var str = '<th><input type="checkbox" ng-model="selected" ng-click="selectDeselectAll()" /></th>';
                var compiledHtml = $compile(str)(scope);
                element.children('thead').children('tr').prepend(compiledHtml);
            }
        }
    };
})
.directive('grListData', function ($compile) {
    return {
        restrict: "A",
        scope: {
            item: '@grListData',
            showSelection: '='
        },
        link: function (scope, element, attrs) {
            //element.attr('ng-click', scope.item + '.selected = !' + scope.item + '.selected');
            //element = $compile(element.html())(scope); // pass your scope variable instead of $scope
            //attrs.$set('ngClick', scope.item + '.selected = true');
            if (scope.showSelection) {
                var str = '<td><input ng-dblclick="$event.stopPropagation();" type="checkbox" ng-model="' + scope.item + '.selected" /></td>';
                var compiledHtml = $compile(str)(angular.element(element).scope());
                $(element).prepend(compiledHtml);
            }
        }
    };
})
.directive('grCell', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            item: '=item',
            template: '=template',
            parent: '=parent'
        },
        link: function (scope, element, attrs) {
            scope.$watch('template', function(){
                element.replaceWith($compile(scope.template)(scope));
            })

        }
    };
})
.filter('EnumDisplay', function () {
    return function (data, selection) {
        if (selection)
            return selection[data].name;
    }
})
.filter('FlagDisplay', function () {
    return function (data, selection) {
        if (selection) {
            if (data == 0)
                return selection[data];
            else {
                var names = [];
                for (var key in selection) {
                    if (key & data) {
                        names.push(selection[key].name);
                    }
                }
                return names.join();
            }
        }
    }
});


;