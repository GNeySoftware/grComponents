angular.module('grComponents')
.directive('grQuery', function ($http, $q) {
    return {
        restrict: 'E',
        templateUrl: '/grComponents/grQueryTemplate.html',
        scope: {
            sortOptions: '=?grSort',
            entity: '@grEntity',
            grChange: '&',
            baseQuery: '=grBaseQuery',
            resultSet: '=grResultSet',
            refreshQuery: '=grRefresh',
            multiFilters: '=grMultiFilters',
            additionalFilters: '=?',
            columns: '=?',
            filters: '=?',
            meta: '=?',
            disableExport: '=?'
        },
        link: function (scope, element, attrs) {
            if (!scope.baseQuery) {
                scope.baseQuery = {
                    pageSize: 20,
                    currentPage: 1
                };
            }

            if (!scope.filters) {
                scope.filters = _.filter(scope.columns, function (item) {
                    var show = item.show == null || item.show;
                    return show && item.type;
                });

                scope.selectedFilter = scope.filters[0];
            }

            function generateDurationSelection(text, addition, type) {
                var format = '';
                switch (type) {
                    case 'day':
                        format = 'dddd';
                        break;

                    case 'week':
                        format = 'WW';
                        break;

                    case 'month':
                        format = 'MMMM';
                        break;

                    case 'year':
                        format = 'YYYY';
                        break;
                }

                return {
                    displayText: text + ' (' + moment().add(addition, type).format(format) + ')',
                    startDate: moment().add(addition, type).startOf(type).toDate(),
                    endDate: moment().add(addition, type).endOf(type).toDate()
                }
            }

            function prepareDurationList(items, type) {
                return _.map(items, function (item) {
                    return generateDurationSelection(item.display, item.offset, type);
                })
            }

            scope.$watch('queryModel.searchText', function () {
                scope.refresh();
            })

            /*---------------------Basic Settings - Section Start---------------------*/
            scope.queryModel = {
                pageSize: 20,
                currentPage: 1
            };

            scope.calendar = {
                durationTypeList: [
                    {
                        name: 'Day',
                        list: prepareDurationList([
                                { display: 'Today', offset: 0 },
                                { display: 'Yesterday', offset: -1 },
                                { display: 'Previous Day', offset: -2 },
                                { display: 'Tomorrow', offset: 1 },
                                { display: 'Next Day', offset: 2 },
                        ], 'day')
                    },
                    {
                        name: 'Week',
                        list: prepareDurationList([
                                { display: 'Current Week', offset: 0 },
                                { display: 'Last Week', offset: -1 },
                                { display: 'Previous Week', offset: -2 },
                                { display: 'Next Week', offset: 1 },
                        ], 'week')
                    },
                    {
                        name: 'Month',
                        list: prepareDurationList([
                                { display: 'Current Month', offset: 0 },
                                { display: 'Last Month', offset: -1 },
                                { display: 'Previous Month', offset: -2 },
                                { display: 'Next Month', offset: 1 }
                        ], 'month')
                    },
                    {
                        name: 'Year',
                        list: prepareDurationList([
                                { display: 'Current Year', offset: 0 },
                                { display: 'Last Year', offset: -1 },
                                { display: 'Next Year', offset: -1 },
                        ], 'year')
                    },
                    { name: 'Custom' }
                ],
            };

            scope.calendar.durationType = scope.calendar.durationTypeList[0];
            /*---------------------Basic Settings - Section End---------------------*/

            /*---------------------ngChange - Section Start---------------------*/

            //Duration Type Changed
            scope.durationTypeChanged = function () {
                if (scope.calendar.durationType != 'Custom')
                    scope.calendar.duration = scope.calendar.durationType.list[0];

                scope.refresh();
            }

            //Filter Options Changed
            scope.selectOption = function (filter) {
                scope.selectedFilter = filter;
                if (filter.entityName)
                    filter.queryType = 'Entity';

                switch (filter.queryType) {
                    case 'Enum':
                    case 'Flag':
                        scope.selectedFilter.selectedValue = Object.keys(scope.selectedFilter.selection)[0];
                        break;
                    case 'DateTime':
                        scope.durationTypeChanged();
                        break;
                }

                scope.refresh();
            };

            ////Sort Options Changed
            //scope.selectSort = function (sortSelection) {
            //    scope.selectedSort = sortSelection;
            //    scope.queryModel.sort = scope.selectedSort.propertyName;
            //    scope.queryModel.sortDirection = scope.selectedSort.sortDirection;

            //    scope.refresh();
            //};
            /*---------------------ngChange - Section End---------------------*/

            /*---------------------ngClick / Refresh & Validation - Section Start---------------------*/
            //Add Multiple Filter
            scope.addFilter = function () {
                var filter = buildFilter();

                if (filter == null)
                    return;

                if (!scope.queryModel.multipleFilters)
                    scope.queryModel.multipleFilters = [];
                scope.queryModel.multipleFilters.push(filter);
                scope.queryModel.minimum = null;
                scope.queryModel.maximum = null;
                scope.queryModel.searchText = '';
                scope.queryModel.flagValues = [];
                scope.queryModel.query = null;
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

            function buildFilter() {
                var filter = {
                    parameterName: scope.selectedFilter.type,
                    parameterType: scope.selectedFilter.queryType,
                    displayName: scope.selectedFilter.name,
                };

                switch (scope.selectedFilter.queryType) {
                    case 'Enum':
                        filter.enumValue = scope.selectedFilter.enumName + '.' + scope.selectedFilter.selection[scope.selectedFilter.selectedValue].key;
                        filter.displayText = scope.selectedFilter.selection[scope.selectedFilter.selectedValue];
                        break;
                    case 'Flag':
                        filter.flagValues = scope.selectedFilter.selectedValue;
                        filter.displayText = scope.selectedFilter.selection[scope.selectedFilter.selectedValue];
                        break;
                    case 'DateTime':
                        filter.startDate = scope.calendar.duration.startDate;
                        filter.endDate = scope.calendar.duration.endDate;
                        filter.displayText = scope.calendar.duration.displayText;
                        break;
                    case 'Range':
                        filter.minimum = scope.queryModel.minimum && scope.queryModel.minimum > 0 ? scope.queryModel.minimum : null;
                        filter.maximum = scope.queryModel.maximum && scope.queryModel.maximum > 0 ? scope.queryModel.maximum : null;
                        filter.displayText = 'RM' + (filter.minimum && filter.minimum > 0 ? filter.minimum : '0') + ' ~ ' +
                            (filter.maximum && filter.maximum > 0 ? ('RM' + filter.maximum) : 'Max');
                        break;
                    default:
                        if (scope.queryModel.searchText == null || scope.queryModel.searchText == '')
                            return null;
                        filter.queryText = scope.queryModel.searchText;
                        filter.displayText = filter.queryText;
                }

                return filter;
            }


            var querying = false;

            scope.export = function () {
                var exportModel = {
                    columns: []
                };
                var queryModel = {};
                if (scope.baseQuery)
                    queryModel = angular.copy(scope.baseQuery);

                queryModel.pageSize = 0;
                queryModel.currentPage = 0;

                if (!queryModel.multipleFilters) {
                    queryModel.multipleFilters = [];
                }

                if (scope.queryModel.multipleFilters) {
                    _.each(scope.queryModel.multipleFilters, function (item) {
                        queryModel.multipleFilters.push(item);
                    })
                }

                if (scope.filters.length > 0) {
                    var filter = buildFilter();
                    if (filter)
                        queryModel.multipleFilters.push(filter);
                }

                _.each(scope.columns, function (column) {
                    if (column.type) {
                        exportModel.columns.push({
                            header: column.displayName,
                            name: column.type
                        })
                    }
                })

                exportModel.queryModel = queryModel;
                $http({
                    responseType: "blob",
                    method: 'GET',
                    url: '/service/' + scope.entity + '/export?ExportModel=' + encodeURIComponent(JSON.stringify(exportModel))
                }).
                  success(function (data, status, headers, config) {
                      var blob = new Blob([data], { type: "application/vnd.ms-excel" });

                      if (window.navigator && window.navigator.msSaveOrOpenBlob)
                          window.navigator.msSaveOrOpenBlob(blob, 'export.xlsx');
                      else {
                          var objectUrl = window.URL.createObjectURL(blob);
                          var anchor = angular.element('<a/>');
                          anchor.attr({
                              href: objectUrl,
                              target: '_blank',
                              download: 'export.xlsx'
                          })[0].click();
                      }
                  }).
                  error(function (data, status, headers, config) {
                  });
            }

            var newRequest = false;

            //Refresh / Post QueryModel
            scope.refresh = function () {
                if (querying) {
                    newRequest = true;
                    return;
                }

                scope.refreshQuery = true;
                querying = true;

                var queryModel = {};
                if (scope.baseQuery)
                    queryModel = angular.copy(scope.baseQuery);

                queryModel.pageSize = queryModel.pageSize == null ? 20 : queryModel.pageSize;

                if (!queryModel.currentPage)
                    queryModel.currentPage = 1;

                queryModel.currentPage = queryModel.currentPage - 1;



                if (!queryModel.multipleFilters) {
                    queryModel.multipleFilters = [];
                }

                if (scope.queryModel.multipleFilters) {
                    _.each(scope.queryModel.multipleFilters, function (item) {
                        queryModel.multipleFilters.push(item);
                    })
                }

                if (scope.filters.length > 0) {
                    var filter = buildFilter();
                    if (filter)
                        queryModel.multipleFilters.push(filter);
                }

                _.each(scope.columns, function (column) {
                    if (column.asc)
                        queryModel.sort = column.type;
                    else if (column.desc)
                        queryModel.sort = column.type + ' DESC';
                })

                $http.get('/service/' + scope.entity + '/query?QueryModel=' + encodeURIComponent(JSON.stringify(queryModel)),
                 { timeout: 20000 }).success(function (data) {
                     if (newRequest) {
                         newRequest = false;
                         scope.refreshQuery = false;
                         querying = false;
                         scope.refresh();
                         return;
                     }

                     scope.resultSet = data;

                     if (scope.grChange)
                         scope.grChange({ data: scope.resultSet });

                     scope.refreshQuery = false;
                     querying = false;
                 }).error(function (err) {
                     scope.refreshQuery = false;
                     querying = false;
                     if (err)
                         toastr.error(err);
                     else
                         toastr.error('No response from server. Please try again. If problem persists, please contact Administrator.');
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

                scope.$watch('baseQuery.pageSize', function (newValue, oldValue) {
                    if (newValue != oldValue)
                        scope.refresh();
                })
            }

            //Refresh watcher
            scope.$watch('refreshQuery', function (newValue, oldValue) {
                if (newValue)
                    scope.refresh();
            })

            //Toggle Calendar
            scope.openCalendar = function (toggleName) {
                scope.calendar[toggleName] = true;
            };

            //Filter Button watcher
            scope.isShowFilterBtn = function () {
                if (scope.selectedFilter && !scope.selectedFilter.queryType && scope.queryModel.searchText)
                    return !scope.queryModel.searchText && !scope.queryModel.searchText.length > 0;
            }
            /*---------------------General Watcher - Section End---------------------*/

            /*---------------------Initializer - Section Start-- -------------------*/
            //Initialize Sort Options
            scope.initSortOptions = function () {
                var defer = $q.defer();
                scope.sortList = [{ displayName: 'Default', sortDirection: null }];

                _.each(scope.sortOptions, function (sortOption) {
                    var item = {
                        propertyName: sortOption.propertyName,
                        displayName: sortOption.propertyName,
                        sortDirection: 0
                    }

                    if (sortOption.ascText || sortOption.descText) {
                        if (sortOption.ascText) {
                            item.displayName = sortOption.ascText;
                            scope.sortList.push(item);
                        }

                        if (sortOption.descText) {
                            item.displayName = sortOption.descText;
                            item.sortDirection = 1;
                            scope.sortList.push(item);
                        }
                    }
                    else {
                        scope.sortList.push(item);
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

                if (scope.filters && scope.filters.length > 0) {
                    if (!scope.selectedFilter)
                        scope.selectedFilter = scope.filters[0];

                    var enumOrFlagFilters = _.filter(scope.filters, function (filter) {
                        return filter && filter.queryType && filter.queryType == 'Enum' || filter.queryType == 'Flag';
                    });

                    var preloadDataPromise = scope.processEnumFilterOptions(enumOrFlagFilters);
                    preloadDataPromise.then(function () {
                        defer.resolve();
                    });
                } else {
                    defer.resolve();
                }

                return defer.promise;
            };

            //Initialize Enum Filter Options
            scope.processEnumFilterOptions = function (enumOrFlagFilters) {
                var defer = $q.defer();
                var urlCalls = [];
                _.each(enumOrFlagFilters, function (filterWithEnumOrFlag) {
                    urlCalls.push($http.get('/api/enum?name=' + filterWithEnumOrFlag.enumName));
                });

                $q.all(urlCalls).then(function (data) {
                    _.each(data, function (result, i) {
                        enumOrFlagFilters[i].selection = result.data;
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
})