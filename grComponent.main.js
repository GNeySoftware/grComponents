angular.module('grComponents', [])
.directive('grAction', function () {
    return {
        restrict: "E",
        templateUrl: '/grComponents/grActionTemplate.html',
        scope: {
            actionList: '=grActions',
            list: '=grTableList',
        },
        controller: ['$scope', '$state', '$filter', 'authService', function listSelectionController($scope, $state, $filter, authService) {
            $scope.authService = authService;

            $scope.$watch('actionList', function (actions) {
                if (actions) {
                    var ruleRoot = $state.current.ruleRoot;
                    _.each(actions, function (item) {
                        if (!item.rule && item.rule != false)
                            item.rule = ruleRoot + '.Actions.' + $filter('capitalize')(item.name);
                    })
                }
            })


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



.directive('grSearch', function ($http, $q) {
    return {
        restrict: 'E',
        templateUrl: '/grComponents/grFilterTemplate.html',
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
                        filter.enumValue = queryModel.filterType;
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
                scope.query = scope.queryModel;

                if (scope.baseQuery)
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
                        scope.query.enumValue = scope.queryModel.filterType;
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
                    var item1 = {
                        propertyName: sortOption.propertyName,
                        displayName: sortOption.propertyName,
                        sortDirection: 0
                    }

                    if (sortOption.ascText || sortOption.descText) {
                        if (sortOption.ascText) {
                            item1.displayName = sortOption.ascText;
                            scope.sortList.push(item1);
                        }

                        if (sortOption.descText) {
                            var item2 = angular.copy(item1);
                            item2.displayName = sortOption.descText;
                            item2.sortDirection = 1;
                            scope.sortList.push(item2);
                        }
                    }
                    else {
                        scope.sortList.push(item1);
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
})
.directive('grUpload', function ($http, $q, FileUploader) {
    return {
        restrict: 'E',
        templateUrl: '/grComponents/grUploadTemplate.html',
        scope: {
            fileType: '@grFileType', //'image'
            maxFileSize: '@grMaxFileSize', //in MB
            options: '=?grOptions',
            entity: '@grEntity',
            grChange: '&',
            files: '=?grResultSet',
            directory: '=?grDirectory',
            width: '=?',
            height: '=?',
            updateCanvas: '&?',
            baseEntity: '=?baseEntity',
            gallery: '=?gallery',
            single: '=?single'
        },
        link: function (scope, element, attrs) {
            if (!scope.files && attrs.files)
                scope.files = [];

            if (!scope.gallery && attrs.gallery)
                scope.gallery = [];

            var uploader = scope.uploader = new FileUploader({
                url: '/api/FileUpload',
                removeAfterUpload: true,
                autoUpload: false,
            });

            if (scope.options) {
                //example of options object
                //s3Upload: true,
                //s3Options: {
                //    accessKeyId: 'AKIAJVYWBCEXI74V76OA',
                //    secretAccessKey: 'DchwswEaufeQ6a1T7S+3/6Jh8q+WeVK8GAUqgIZv',
                //    region: 'ap-southeast-1',
                //    bucket: 'websitefront',
                //    folder: moment().format('YYMM') + '/test/',
                //    acl: 'public-read',
                //},
                uploader.s3Upload = scope.options.s3Upload;
                uploader.s3Options = scope.options.s3Options;
            }


            uploader.filters.push({
                name: 'fileFilter',
                fn: function (item /*{File|FileLikeObject}*/, options) {
                    var type = ('|' + item.name.slice((item.name.lastIndexOf(".") - 1 >>> 0) + 2) + '|').toLowerCase();
                    var success = true;

                    if (scope.fileType) {
                        if (scope.fileType.toLowerCase() == 'image') {
                            if ('|jpg|jpeg|png|bmp|img|jpe|jbg|mac|gif|psd|tga|tiff|wmf|'.indexOf(type) == -1) {
                                toastr.error('Please upload image with |jpg|jpeg|png|bmp|img|jpe|jbg|mac|gif|psd|tga|tiff|wmf| format!', 'File format error');
                                success = false;
                            }
                        }
                        else if (scope.fileType.toLowerCase() == 'excel') {
                            if ('|xls|xlt|xlm|xlsx|xlsm|xltx|xltm|xlsb|xla|xlam|xll|xlw|'.indexOf(type) == -1) {
                                toastr.error('Please upload excel with |xls|xlt|xlm|xlsx|xlsm|xltx|xltm|xlsb|xla|xlam|xll|xlw| format!', 'File format error');
                                success = false;
                            }
                        }
                    }

                    //default 4 MB
                    var maxFileSize = 4 * 1024 * 1024;
                    if (scope.maxFileSize > 0)
                        maxFileSize = scope.maxFileSize * 1024 * 1024;

                    if (item.size > maxFileSize) {
                        toastr.error('Please upload file size with maximum ' + (scope.maxFileSize ? scope.maxFileSize : '4') + ' MB!', 'File size error');
                        success = false;
                    }

                    return success;
                }
            });

            uploader.onAfterAddingFile = function (fileItem) {
                if (scope.fileType == 'image') {
                    uploader.resize(fileItem).then(function () {
                        fileItem.upload();
                    })
                }
                else
                    fileItem.upload();
            };

            uploader.resize = function (fileItem) {
                var defer = $q.defer();

                loadImage(
                    fileItem._file,
                    function (canvas) {
                        if (scope.updateCanvas) {
                            var ctx = canvas.getContext("2d");
                            scope.updateCanvas({ data: ctx });
                        }

                        if (canvas.toBlob) {
                            canvas.toBlob(
                                function (blob) {
                                    fileItem._file = blob;
                                    defer.resolve(blob);
                                },
                                'image/jpeg'
                            );
                        }
                    },
                    {
                        maxWidth: scope.width ? scope.width : 1024,
                        maxHeight: scope.height ? scope.height : 768,
                        canvas: true,
                        orientation: true
                    }
                );

                return defer.promise;
            }

            uploader.onBeforeUploadItem = function (item) {
                //example { 'directory': 'project' }
                if (scope.directory)
                    item.formData.push({ 'directory': scope.directory });
            }

            uploader.onSuccessItem = function (item, response, status, headers) {
                var image = {};
                if (scope.baseEntity)
                    image = angular.copy(scope.baseEntity)

                image.attrachmentType = 0;
                image.sortOrder = scope.files ? scope.files.length : 0;
                image.path = response.url;
                image.name = response.filename;


                $http.post('/service/' + scope.entity, image).success(function (data) {
                    if (data) {

                        var item = {
                            id: data.id,
                            path: data.path,
                            name: data.name
                        };

                        if (!scope.files && attrs.files)
                            scope.files = [];

                        if (scope.files)
                            scope.files.push(item);

                        if (scope.grChange)
                            scope.grChange({ data: data });

                        if (scope.gallery) {
                            if (scope.single)
                                scope.gallery = [item];
                            else
                                scope.gallery.push(item);
                        }
                        //toastr.info(response.fileName + ' <br /> ' + 'URL : ' + response.url, 'postAttachment CREATED');
                    }
                }).error(function (data) {
                    //toastr.error(response.fileName + ' <br /> ' + 'URL : ' + response.url, 'Uploaded FAILED');
                });
            };
        },
    };
})
.directive('grUploadGallery', function ($http, $q, FileUploader) {
    return {
        restrict: 'E',
        templateUrl: '/grComponents/grUploadGalleryTemplate.html',
        scope: {
            fileType: '@?',
            manage: '=?grManage', //currently hide delete button only
            options: '=?grOptions',
            entity: '@grEntity',
            grChange: '&',
            files: '=?grResultSet',
            targetType: '@grTargetType',
            targetId: '=?grTargetId',
            refreshQuery: '=?grRefresh',
            saveQuery: '=?grSave',
            grSaveCallback: '&',
        },
        link: function (scope, element, attrs) {
            if (!scope.files)
                scope.files = [];

            //Refresh watcher
            scope.$watch('refreshQuery', function (newValue, oldValue) {
                if (newValue)
                    scope.refresh();
            });

            //save watcher
            scope.$watch('saveQuery', function (newValue, oldValue) {
                if (newValue)
                    scope.save();
            });

            scope.$watch('targetId', function (newValue, oldValue) {
                if (newValue && scope.files.length == 0) {
                    scope.refresh();
                }
            });

            scope.refresh = function () {
                if (!query)
                    var query = {};
                query.payload = {
                    TargetType: scope.targetType,
                    TargetId: scope.targetId,
                    EntityType: scope.entity,
                };

                $http.get('/service/' + (scope.entity ? scope.entity : 'GrGalleryAttachmentDTO') + '/query?QueryModel=' + JSON.stringify(query)).success(function (data) {
                    scope.files = data.list;
                    scope.refreshQuery = false;
                });
            };

            if (scope.targetType && scope.targetId) {
                scope.refresh();
            };

            scope.removeFiles = function () {
                if (scope.files.length > 0) {
                    _.each(scope.files, function (item) {
                        if (item.selected == true && item.attachment) {
                            if (!scope.deletedAttachments)
                                scope.deletedAttachments = [];
                            scope.deletedAttachments.push(item.attachment.id);
                        }
                    });
                    scope.files = _.filter(scope.files, function (item, index) {
                        return !item.selected;
                    });
                }
            };

            scope.copyLink = function (item) {
                scope.copyLinkPath = item.path;
            };

            scope.selectedItems = function () {
                var selectedItems = _.filter(scope.files, function (item, index) {
                    return item.selected;
                });
                if (scope.grChange)
                    scope.grChange({ data: selectedItems });
            };

            scope.getIcon = function (fileName) {
                if (fileName) {
                    var extension = fileName.split('.').pop();

                    switch (extension) {
                        case 'bmp':
                        case 'jpg':
                        case 'jpeg':
                        case 'png':
                        case 'gif':
                            return 'fa-file-image-o';
                        case 'zip':
                        case 'rar':
                            return 'fa-file-archive-o';
                        case 'pdf':
                            return 'fa-file-pdf-o';
                        case 'doc':
                        case 'docx':
                            return 'fa-file-word-o';
                        case 'ppt':
                        case 'pptx':
                            return 'fa-file-powerpoint-o';
                        case 'xlsx':
                        case 'xls':
                        case 'csv':
                            return 'fa-file-excel-o';
                        case 'txt':
                        case 'rtf':
                            return 'fa-file-text-o';
                    }
                }

                return 'fa-file-o';
            }

            scope.save = function () {
                var addedAttachmentsIDs = _.map(_.filter(scope.files, function (item) {
                    return !(item.attachment.targetId > 0)
                }), function (item) {
                    return item.attachment.id;
                });

                var item = {
                    AddedAttachments: addedAttachmentsIDs,
                    DeletedAttachments: scope.deletedAttachments,
                    TargetId: scope.targetId,
                    TargetType: scope.targetType,
                };

                $http.post('/service/' + (scope.entity ? scope.entity : 'GrGalleryAttachmentDTO'), item).success(function (data) {
                    scope.saveQuery = false;
                    if (scope.grSaveCallback)
                        scope.grSaveCallback({ data: data });
                }).error(function (data) {
                    if (scope.grSaveCallback)
                        scope.grSaveCallback({ data: data, error: true });
                });

            };
        },
    };
})
.directive('grSubmit', function () {
    return {
        restrict: 'E',
        template: '<div class="pull-right">' +
                      '<button class="btn btn-primary btn-raised" type="submit" ng-disabled="disabled" style="margin-right: 3px;">' +
                          '<span>' +
                              '<i class="fa fa-check fa-fw" />&nbsp;OK' +
                          '</span>' +
                      '</button>' +
                      '<a class="btn btn-default btn-raised02" onclick="window.history.back();" style="margin-left: 3px;">' +
                          '<i class="fa fa-times" />&nbsp;Cancel' +
                      '</a>' +
                  '</div>',
        scope: {
            disabled: '=?',
        }
    }
})
.directive('grState', function ($state) {
    return {
        link: function (scope, element, attrs) {
            $(element[0]).html($state.current.name);
        }
    }
})
.filter('camelize', function () {
    function camelize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }

    return function (data) {
        return camelize(data);
    }
})
.filter('capitalize', function () {
    function capitalize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
            return letter.toUpperCase();
        }).replace(/\s+/g, '');
    }

    return function (data) {
        return capitalize(data);
    }
})

;