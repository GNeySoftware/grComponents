-app
.directive('grAction', function () {
    return {
        restrict: "E",
        templateUrl: '/app/grActionTemplate.html',
        scope: {
            actionList: '=grActions',
            list: '=grTableList',
        },
        controller: ['$scope', function listSelectionController($scope) {
            $scope.isShow = function (isDefault) {
                var items = getSelectedItems();

                if (isDefault && isDefault == true)
                    return true;
                else
                    return items.length > 0;
            }

            $scope.executeCommand = function (btn) {
                if (btn.isDefault && btn.isDefault == true)
                    btn.method();
                else
                    btn.method(btn.allowMultiple == true ? getSelectedItems() : _.find(getSelectedItems(), 'selected'));
            };

            $scope.checkExecution = function (btn) {
                if (btn.isDefault && btn.isDefault == true) return true;

                var canExecute = true;
                if (angular.isFunction(btn.canExecute))
                    canExecute = btn.canExecute(btn.allowMultiple == true ? getSelectedItems() : _.find(getSelectedItems(), 'selected'));
                else
                    canExecute = btn.canExecute;

                var selectedRow = _.filter($scope.list, function (item) { return item.selected; });

                if ((!canExecute && canExecute != false) || canExecute == true) {

                    if (btn.allowMultiple == true && selectedRow.length >= 1)
                        return true;
                    else if ((!btn.allowMultiple || btn.allowMultiple == false) && selectedRow.length == 1)
                        return true;
                }
                return false;
            }

            $scope.btnStyle = function (btn) {
                var backgroundColorString = btn.backgroundColor ? "background:" + btn.backgroundColor + " !important;" : "";
                var fontColorString = btn.fontColor ? "color:" + btn.fontColor + " !important;" : "";
                return backgroundColorString + fontColorString;
            };

            function getSelectedItems() {
                return _.filter($scope.list, 'selected');
            }
        }],
    };
})

.directive('grList', function ($compile) {
    return {
        restrict: "A",
        scope: {
            list: '=grList'
        },
        controller: ['$scope', function listSelectionController($scope) {
            $scope.selectDeselectAll = function () {
                _.forEach($scope.list, function (item) {
                    item.selected = $scope.selected;
                });
            }
        }],
        link: function (scope, element, attrs) {
            element.children('colgroup').prepend(' <col style="width:25px;" />');
            var str = '<th><input type="checkbox" ng-model="selected" ng-click="selectDeselectAll()" /></th>';
            var compiledHtml = $compile(str)(scope);
            element.children('thead').children('tr').prepend(compiledHtml);
        }
    };
})
.directive('grListData', function ($compile) {
    return {
        restrict: "A",
        scope: {
            item: '@grListData'
        },
        link: function (scope, element, attrs) {
            //element.attr('ng-click', scope.item + '.selected = !' + scope.item + '.selected');
            //element = $compile(element.html())(scope); // pass your scope variable instead of $scope
            //attrs.$set('ngClick', scope.item + '.selected = true');
            var str = '<td><input type="checkbox" ng-model="' + scope.item + '.selected" /></td>';
            var compiledHtml = $compile(str)(angular.element(element).scope());
            $(element).prepend(compiledHtml);
        }
    };
})

.directive('grSearch', function ($http, $q) {
    return {
        restrict: 'E',
        templateUrl: '/app/grasslandFilterTemplate.html',
        scope: {
            filterOptions: '=grFilters',
            sortOptions: '=grSort',
            entity: '@grEntity',
            grChange: '&',
            baseQuery: '=grBaseQuery',
            resultSet: '=grResultSet',
            refreshQuery: '=grRefresh',
            multiFilters: '=grMultiFilters'
        },
        link: function (scope, element, attrs) {
            /*---------------------Basic Settings - Section Start---------------------*/
            scope.queryModel = {
                pageSize: 12,
                currentPage: 1,
                searchText: '',
                startDate: moment().startOf('month').format('YYYY-MM-DD'),
                endDate: moment().format('YYYY-MM-DD')
            };
            scope.calendar = {
                durationType: 'Day',
                durationTypeList: ['Day', 'Week', 'Month', 'Year', 'Custom'],
                durationList: [],
                duration: {}
            };
            /*---------------------Basic Settings - Section End---------------------*/

            /*---------------------ngChange - Section Start---------------------*/
            //Filter Options Changed
            scope.selectOption = function (filterSelection) {
                scope.selectedOption = filterSelection;
                scope.queryModel.type = scope.selectedOption.name;
                scope.queryModel.queryType = scope.selectedOption.queryType;

                switch (scope.queryModel.queryType) {
                    case 'Enum':
                        scope.selectedOption.selectedValue = scope.selectedOption.enumTypeList[0];
                        scope.queryModel.filterType = scope.selectedOption.propertyType + '.' + scope.selectedOption.enumTypeList[0].name.replace(/ /g, '');
                        break;
                    case 'Flag':
                        scope.selectedOption.selectedValue = scope.selectedOption.enumTypeList[0];
                        scope.queryModel.flagValues = [scope.selectedOption.enumTypeList[0].key];
                        break;
                    case 'DateTime':
                        scope.durationTypeChanged(scope.calendar.durationType);
                        scope.queryModel.startDate = scope.calendar.duration.startDate;
                        scope.queryModel.endDate = scope.calendar.duration.endDate;
                }

                scope.refresh();
            };

            //Sort Options Changed
            scope.selectSort = function (sortSelection) {
                scope.selectedSort = sortSelection;
                scope.queryModel.sort = scope.selectedSort.propertyName;
                scope.queryModel.sortDirection = scope.selectedSort.sortDirection;

                scope.refresh();
            };

            //Duration Type Changed
            scope.durationTypeChanged = function () {
                switch (scope.calendar.durationType) {
                    case 'Day':
                        scope.calendar.durationList = [
                            { displayText: 'Today (' + moment().format('dddd') + ')', startDate: moment().startOf('day').format('YYYY-MM-DD'), endDate: moment().endOf('day').format('YYYY-MM-DD') },
                            { displayText: 'Yesterday (' + moment().subtract(1, 'days').format('dddd') + ')', startDate: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DD'), endDate: moment().subtract(1, 'day').endOf('day').format('YYYY-MM-DD') },
                            { displayText: 'Previous Day (' + moment().subtract(2, 'days').format('dddd') + ')', startDate: moment().subtract(2, 'day').startOf('day').format('YYYY-MM-DD'), endDate: moment().subtract(2, 'day').endOf('day').format('YYYY-MM-DD') }
                        ];
                        break;
                    case 'Week':
                        scope.calendar.durationList = [
                            { displayText: 'Current Week (Week ' + moment().format('WW') + ')', startDate: moment().startOf('week').format('YYYY-MM-DD'), endDate: moment().endOf('week').format('YYYY-MM-DD') },
                            { displayText: 'Last Week (Week ' + moment().subtract(1, 'weeks').format('WW') + ')', startDate: moment().subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD'), endDate: moment().subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD') },
                            { displayText: 'Previous Week (Week ' + moment().subtract(2, 'weeks').format('WW') + ')', startDate: moment().subtract(2, 'weeks').startOf('week').format('YYYY-MM-DD'), endDate: moment().subtract(2, 'weeks').endOf('week').format('YYYY-MM-DD') }
                        ];
                        break;
                    case 'Month':
                        scope.calendar.durationList = [
                            { displayText: 'Current Month (' + moment().format('MMMM') + ')', startDate: moment().startOf('month').format('YYYY-MM-DD'), endDate: moment().endOf('month').format('YYYY-MM-DD') },
                            { displayText: 'Last Month (' + moment().subtract(1, 'months').format('MMMM') + ')', startDate: moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD'), endDate: moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD') },
                            { displayText: 'Previous Month (' + moment().subtract(2, 'months').format('MMMM') + ')', startDate: moment().subtract(2, 'months').startOf('month').format('YYYY-MM-DD'), endDate: moment().subtract(2, 'months').endOf('month').format('YYYY-MM-DD') }
                        ];
                        break;
                    case 'Year':
                        scope.calendar.durationList = [
                            { displayText: 'Current Year (' + moment().format('YYYY') + ')', startDate: moment().startOf('year').format('YYYY-MM-DD'), endDate: moment().endOf('year').format('YYYY-MM-DD') },
                            { displayText: 'Last Year (' + moment().subtract(1, 'years').format('YYYY') + ')', startDate: moment().subtract(1, 'years').startOf('year').format('YYYY-MM-DD'), endDate: moment().subtract(1, 'years').endOf('year').format('YYYY-MM-DD') }
                        ];
                        break;
                    case 'Custom':
                        scope.calendar.durationList = [];
                }

                if (scope.calendar.durationType != 'Custom')
                    scope.calendar.duration = scope.calendar.durationList[0];

                scope.durationChanged();
            }

            //Duration Changed
            scope.durationChanged = function () {
                scope.queryModel.startDate = scope.calendar.duration.startDate;
                scope.queryModel.endDate = scope.calendar.duration.endDate;
                scope.refresh();
            }

            //Filter value changed / Refresh
            scope.search = function () {
                switch (scope.queryModel.queryType) {
                    case 'Enum':
                        scope.queryModel.filterType = scope.selectedOption.propertyType + '.' + scope.selectedOption.selectedValue.name.replace(/ /g, '');
                        break;
                    case 'Flag':
                        scope.queryModel.flagValues = [scope.selectedOption.selectedValue.key];
                        break;
                    case 'DateTime':
                        scope.checkDate();
                }

                scope.refresh();
            };
            /*---------------------ngChange - Section End---------------------*/

            /*---------------------ngClick / Refresh & Validation - Section Start---------------------*/
            //Add Multiple Filter
            scope.addFilter = function (queryModel) {
                var filter = {
                    queryText: queryModel.searchText,
                    parameterName: queryModel.type,
                    displayName: scope.selectedOption.displayName,
                    displayText: queryModel.searchText,
                };

                if (queryModel.searchText && queryModel.searchText.length > 0)
                    filter.queryText = queryModel.searchText;

                if (queryModel.query)
                    filter.query = queryModel.query;

                if (queryModel.queryType)
                    filter.parameterType = queryModel.queryType;

                switch (queryModel.queryType) {
                    case 'Enum':
                        filter.enumValue = "PermasSky.Domain." + queryModel.filterType;
                        filter.displayText = scope.selectedOption.selectedValue.name;
                        break;
                    case 'Flag':
                        filter.flagValues = queryModel.flagValues;
                        filter.displayText = scope.selectedOption.selectedValue.name;
                        break;
                    case 'DateTime':
                        filter.startDate = moment(scope.queryModel.startDate).startOf('day').format('YYYY-MM-DD hh:mm:ss a');
                        filter.endDate = moment(scope.queryModel.endDate).endOf('day').format('YYYY-MM-DD hh:mm:ss a');
                        filter.displayText = scope.queryModel.startDate + ' > ' + scope.queryModel.endDate;
                        break;
                    case 'Range':
                        filter.minimum = scope.queryModel.minimum && scope.queryModel.minimum > 0 ? scope.queryModel.minimum : null;
                        filter.maximum = scope.queryModel.maximum && scope.queryModel.maximum > 0 ? scope.queryModel.maximum : null;
                        filter.displayText = 'RM' + (filter.minimum && filter.minimum > 0 ? filter.minimum : '0') + ' ~ ' +
                                             (filter.maximum && filter.maximum > 0 ? ('RM' + filter.maximum) : 'Max');
                }

                if (!queryModel.multipleFilters)
                    queryModel.multipleFilters = [];
                queryModel.multipleFilters.push(filter);
                queryModel.minimum = null;
                queryModel.maximum = null;
                queryModel.searchText = '';
                queryModel.flagValues = [];
                queryModel.query = null;
            }

            //Remove Multiple Filter
            scope.removeFilter = function (filter) {
                var index = scope.queryModel.multipleFilters.indexOf(filter);
                scope.queryModel.multipleFilters.splice(index, 1);

                scope.refresh();
            }

            //Reset Multiple Filter
            scope.resetFilter = function () {
                scope.queryModel.multipleFilters = [];
                scope.queryModel.searchText = "";

                scope.refresh();
            }

            //Check Date Duration
            scope.checkDate = function () {
                if (scope.queryModel.startDate != null) {
                    var startDate = moment(scope.queryModel.startDate).startOf('day').format();
                    var endDate = moment(scope.queryModel.endDate).endOf('day').format();
                    var checkDate = moment(endDate).isBefore(startDate);
                }

                if (checkDate == true)
                    scope.queryModel.endDate = scope.queryModel.startDate;
            }

            //Refresh / Post QueryModel
            scope.refresh = function () {
                scope.query = angular.copy(scope.baseQuery);
                scope.query.currentPage = scope.query.currentPage ? scope.query.currentPage - 1 : scope.queryModel.currentPage - 1;
                scope.query.multipleFilters = scope.multiFilters ? scope.multiFilters : angular.copy(scope.queryModel.multipleFilters);
                scope.query.searchText = scope.queryModel.searchText ? scope.queryModel.searchText : '';
                scope.query.type = scope.selectedOption ? scope.selectedOption.name : scope.query.type;
                scope.query.queryType = scope.queryModel.queryType ? scope.queryModel.queryType : scope.query.queryType;
                scope.query.sort = scope.queryModel.sort ? scope.queryModel.sort : scope.query.sort;
                scope.query.sortDirection = scope.queryModel.sort ? scope.queryModel.sortDirection : scope.query.sortDirection;

                if (scope.queryModel.filterType)
                    scope.query.filterType = scope.queryModel.filterType;

                switch (scope.query.queryType) {
                    case 'Enum':
                        scope.query.enumValue = "PermasSky.Domain." + scope.queryModel.filterType;
                        break;
                    case 'Flag':
                        scope.query.flagValues = scope.queryModel.flagValues;
                        break;
                    case 'DateTime':
                        scope.query.startDate = moment(scope.queryModel.startDate).startOf('day').format('YYYY-MM-DD hh:mm:ss a');
                        scope.query.endDate = moment(scope.queryModel.endDate).endOf('day').format('YYYY-MM-DD hh:mm:ss a');
                        break;
                    case 'Range':
                        scope.query.minimum = scope.queryModel.minimum && scope.queryModel.minimum > 0 ? scope.queryModel.minimum : null;
                        scope.query.maximum = scope.queryModel.maximum && scope.queryModel.maximum > 0 ? scope.queryModel.maximum : null;
                }

                $http.get('/service/' + scope.entity + '/query?QueryModel=' + JSON.stringify(scope.query)).success(function (data) {
                    scope.resultSet = data;

                    if (scope.grChange)
                        scope.grChange({ data: scope.resultSet });

                    scope.refreshQuery = false;
                });
            };
            /*---------------------ngClick / Refresh - Section End---------------------*/

            /*---------------------General Watcher - Section Start---------------------*/
            //Pagination watcher
            if (scope.baseQuery) {
                scope.$watch('baseQuery.currentPage', function (newValue, oldValue) {
                    if (newValue != oldValue)
                        scope.refresh();
                })
            }

            //Refresh watcher
            scope.$watch('refreshQuery', function (newValue, oldValue) {
                if (newValue)
                    scope.refresh();
            })

            //Toggle Calender
            scope.openCalendar = function (toggleName) {
                scope.calendar[toggleName] = true;
            };

            //Filter Button watcher
            scope.isShowFilterBtn = function () {
                switch (true) {
                    //Check Search Text
                    case !scope.selectedOption.queryType: 
                        return !scope.queryModel.searchText.length > 0;
                    //Check Selection
                    case scope.selectedOption.selectedValue: 
                        return scope.selectedOption.selectedValue.name.length > 0;
                    //Check Price Range
                    case scope.selectedOption.queryType == 'Range': 
                        if (scope.queryModel.minimum && scope.queryModel.maximum)
                            return !scope.queryModel.minimum > 0 || !scope.queryModel.maximum > 0;
                        else if (scope.queryModel.minimum)
                            return !scope.queryModel.minimum > 0;
                        else if (scope.queryModel.maximum)
                            return !scope.queryModel.maximum > 0;
                        else
                            return true;
                }
                return false;
            }
            /*---------------------General Watcher - Section End---------------------*/

            /*---------------------Initializer - Section Start---------------------*/
            //Initialize Sort Options
            scope.initSortOptions = function () {
                var defer = $q.defer();
                scope.sortList = [{ displayName: 'Default', sortDirection: null }];

                _.each(scope.sortOptions, function (sortOption) {
                    if (!sortOption.ascText && sortOption.descText) {
                        scope.sortList.push({
                            propertyName: sortOption.propertyName,
                            displayName: sortOption.propertyName,
                            sortDirection: 0
                        });
                    }
                    else {
                        if (sortOption.ascText) {
                            scope.sortList.push({
                                propertyName: sortOption.propertyName,
                                displayName: sortOption.ascText,
                                sortDirection: 0
                            });
                        }

                        if (sortOption.descText) {
                            scope.sortList.push({
                                propertyName: sortOption.propertyName,
                                displayName: sortOption.descText,
                                sortDirection: 1
                            });
                        }
                    }
                });

                if (!scope.selectedSort)
                    scope.selectedSort = scope.sortList[0];

                defer.resolve();

                return defer.promise;
            }

            //Initialize Filter Options
            scope.initFilterOptions = function () {
                var defer = $q.defer();

                if (scope.filterOptions && scope.filterOptions.length > 0) {
                    if (!scope.selectedOption)
                        scope.selectedOption = scope.filterOptions[0];

                    var enumFilterOptions = _.filter(scope.filterOptions, function (enumFilterOption) {
                        return enumFilterOption.queryType == 'Enum' || enumFilterOption.queryType == 'Flag';
                    });

                    var preloadDataPromise = scope.processEnumFilterOptions(enumFilterOptions);
                    preloadDataPromise.then(function () {
                        defer.resolve();
                    });
                } else {
                    defer.resolve();
                }

                return defer.promise;
            };

            //Initialize Enum Filter Options
            scope.processEnumFilterOptions = function (enumFilterOptions) {
                var defer = $q.defer();
                var urlCalls = [];
                _.each(enumFilterOptions, function (enumFilteroption) {
                    urlCalls.push($http.get('/api/enum/EnumCollection?name=' + enumFilteroption.propertyType));
                });

                $q.all(urlCalls).then(function (data) {
                    _.each(data, function (result, i) {
                        enumFilterOptions[i].enumTypeList = []
                        _.each(result.data, function (item, itemKey) {
                            enumFilterOptions[i].enumTypeList.push({ key: parseInt(itemKey), name: item });
                        })
                    });
                    defer.resolve();
                },
                function (error) {
                    defer.reject(error);
                },
                function (updates) {
                    defer.update(updates);
                });

                return defer.promise;
            };

            //Execute one-time initialization
            scope.initFilterOptions();
            scope.initSortOptions();
            scope.refresh();
            /*---------------------Initializer - Section End---------------------*/
        }
    };
});