var runState = function ($stateProvider, autoState, parentState, standardTemplates, baseRule) {
    if (!autoState.displayName)
        autoState.displayName = autoState.name;

    if (parentState && parentState.fullStateName)
        autoState.fullStateName = parentState.fullStateName + '.' + autoState.name;
    else
        autoState.fullStateName = autoState.name;


    //console.log('parent state: ' + parentState);
    var template = '/app/' + autoState.fullStateName.replace(/\./g, '/') + '.html';
    if (autoState.type && standardTemplates && standardTemplates[autoState.type])
        template = standardTemplates[autoState.type];

    var controllerName = autoState.fullStateName.replace(/\./g, '_') + '_controller';
    var controllerPath = '';
    var params = '';

    if (autoState.referParent)
    {
        controllerPath = '/app/' + parentState.parentFullStateName.replace(/\./g, '/') + '/controller.js';
        template = '/app/' + parentState.parentFullStateName.replace(/\./g, '/') + '/' + autoState.name + '.html';
    }
    else if (parentState && parentState.fullStateName) {
        autoState.parentFullStateName = parentState.fullStateName;
        controllerPath = '/app/' + autoState.parentFullStateName.replace(/\./g, '/') + '/controller.js';
    }

    if (autoState.states && autoState.states.length > 0 && !autoState.type) {
        template = '<div ui-view></div>';
        controllerName = '';
        controllerPath = '';
        params = '';
    }

    if (autoState.controller)
        controllerName = autoState.controller;

    if (autoState.templateUrl)
        template = autoState.templateUrl;

    if (autoState.params)
        params = autoState.params;

    autoState.ruleControllerName = controllerName;

    //console.log('state: ' + autoState.fullStateName);
    var stateConfig = {
        url: '/' + (!angular.isUndefined(autoState.url) ? autoState.url : autoState.name),
        templateUrl: template,
        controller: controllerName,
        params: params,
    };

    if (stateConfig.templateUrl == '<div ui-view></div>') {
        stateConfig.templateUrl = null;
        stateConfig.template = '<div ui-view></div>';
    }

    if (autoState.controllerPath)
        controllerPath = autoState.controllerPath;

    if (controllerPath != '') {
        autoState.ruleControllerPath = controllerPath;

        if(this['buildDate'])
            controllerPath = controllerPath + '?' + buildDate;
        stateConfig.resolve = {
            deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        controllerPath
                    ]
                });
            }]
        };
    }

    autoState.url = stateConfig.url;
    if (parentState && parentState.url) {
        autoState.url = parentState.url + autoState.url;
    }

    if (!autoState.link)
        autoState.link = autoState.fullStateName;

    if (autoState.rule == null) {
        if (!baseRule)
            baseRule = '';

        if (parentState && parentState.ruleRoot) {
            baseRule = baseRule + parentState.ruleRoot;
        }

        autoState.ruleRoot = baseRule + '.' + capitalize(autoState.displayName);
        autoState.rule = autoState.ruleRoot + '.Access';
        stateConfig.ruleRoot = autoState.ruleRoot;
        stateConfig.rule = autoState.ruleRoot + '.Access';
    }
    else {
        stateConfig.rule = autoState.rule;
    }

    //console.log('controller path: ' + controllerPath);
    //console.log(stateConfig);
    if (this['buildDate'])
        stateConfig.templateUrl = stateConfig.templateUrl + '?' + buildDate;
    $stateProvider.state(autoState.fullStateName, stateConfig);

    if (autoState.states) {
        _.each(autoState.states, function (state) {
            runState($stateProvider, state, autoState, standardTemplates);
        });
    }

    function capitalize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
            return letter.toUpperCase();
        }).replace(/\s+/g, '');
    }
}
