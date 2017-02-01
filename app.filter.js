'use strict';


app.filter('iif', function () {
    return function (input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
    };
});


app.filter('dateFromNow', function () {
    return function (date) {
        return moment(date).fromNow();
    }
});

app.filter('getEnumName', function () {
    return function (data, list) {
        return _.find(list, function (v, k) { if (k == data) return v; });
    }
});

app.filter('grGetEnumName', function () {
    return function (data, filterOptions, enumDisplayName) {
        var enumType = _.find(filterOptions, { displayName: enumDisplayName });
        var enumTypeList = enumType ? enumType.enumTypeList : [];
        return _.find(enumTypeList, function (enumTypeItem) { if (enumTypeItem.key == data) return enumTypeItem.name; }).name;
    }
});

app.filter('grGetEnumObject', function () {
    return function (data, filterOptions, enumDisplayName) {
        var enumType = _.find(filterOptions, { displayName: enumDisplayName });
        var enumTypeList = enumType ? enumType.enumTypeList : [];
        return _.find(enumTypeList, function (enumTypeItem) { if (enumTypeItem.key == data) return enumTypeItem.name; });
    }
});

app.filter('grGetEnumList', function () {
    return function (filterOptions, name) {
        var enumType = _.find(filterOptions, { name: name });
        return enumType ? enumType.enumTypeList : [];
    }

})
.filter('displayName', function () {
    return function (text) {
        text = text.charAt(0).toUpperCase() + text.slice(1);
        return text.replace(/([A-Z])/g, ' $1').trim();
    }
})

;

