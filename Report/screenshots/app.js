var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "Apple I|Delete Computer",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "82497a575094da99732ce9bd94d4e8c5",
        "instanceId": 15036,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555541503125,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555541519248,
                "type": ""
            }
        ],
        "screenShotFile": "008f004e-0082-00b0-006e-00df00cd00c5.png",
        "timestamp": 1555541516246,
        "duration": 17330
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "803f0f6ed78914fbc415789471f8c32f",
        "instanceId": 2144,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555543789476,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555543798413,
                "type": ""
            }
        ],
        "screenShotFile": "00790008-006d-0016-003e-00b500720061.png",
        "timestamp": 1555543796206,
        "duration": 2256
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d4a88b5d05cc5a43d4460015c7558bb4",
        "instanceId": 8324,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555543846166,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555543850852,
                "type": ""
            }
        ],
        "screenShotFile": "00bc0098-009d-00fd-0064-00ce00fc0012.png",
        "timestamp": 1555543846376,
        "duration": 4574
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "d4a88b5d05cc5a43d4460015c7558bb4",
        "instanceId": 8324,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00c10082-008a-0027-00cd-004100ea00cc.png",
        "timestamp": 1555543851671,
        "duration": 7750
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9e345e0f25878f6182c4b15d79bc6ff9",
        "instanceId": 14996,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555543907295,
                "type": ""
            }
        ],
        "screenShotFile": "00910032-0068-00ac-00a7-008000a4006c.png",
        "timestamp": 1555543907573,
        "duration": 2905
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9e345e0f25878f6182c4b15d79bc6ff9",
        "instanceId": 14996,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555543910591,
                "type": ""
            }
        ],
        "screenShotFile": "004400e9-000a-00aa-00ce-00ae00020030.png",
        "timestamp": 1555543911166,
        "duration": 7188
    },
    {
        "description": "Amiga500 is 1987-01-1|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "9e345e0f25878f6182c4b15d79bc6ff9",
        "instanceId": 14996,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007300ca-0048-00db-0025-004e00520033.png",
        "timestamp": 1555543918810,
        "duration": 1524
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "833fbebfc7fb54d351098d7940e006f5",
        "instanceId": 2852,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555543973110,
                "type": ""
            }
        ],
        "screenShotFile": "00ac00b1-00b3-00e5-00f9-007600100021.png",
        "timestamp": 1555543974788,
        "duration": 3269
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "833fbebfc7fb54d351098d7940e006f5",
        "instanceId": 2852,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555543978193,
                "type": ""
            }
        ],
        "screenShotFile": "00e7008a-00d5-0017-0031-007200ba007e.png",
        "timestamp": 1555543978672,
        "duration": 7155
    },
    {
        "description": "Amiga500 is 1987-01-1|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "833fbebfc7fb54d351098d7940e006f5",
        "instanceId": 2852,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0060002d-0036-0053-006f-007000c300de.png",
        "timestamp": 1555543986224,
        "duration": 979
    },
    {
        "description": "Delete Computer Apple I|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "833fbebfc7fb54d351098d7940e006f5",
        "instanceId": 2852,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00390074-0070-007f-0030-00ea00880028.png",
        "timestamp": 1555543987573,
        "duration": 13140
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "30c11b2e380228975c10986106a210bb",
        "instanceId": 8708,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555544419124,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555544421585,
                "type": ""
            }
        ],
        "screenShotFile": "00d8009a-004f-0046-0024-0068003b00a0.png",
        "timestamp": 1555544419522,
        "duration": 2112
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "30c11b2e380228975c10986106a210bb",
        "instanceId": 8708,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000600fb-00bb-00c7-002c-00e5002d004e.png",
        "timestamp": 1555544422258,
        "duration": 7651
    },
    {
        "description": "Amiga500 is 1987-01-1|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "30c11b2e380228975c10986106a210bb",
        "instanceId": 8708,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003c00e7-002f-00b7-0000-00e4004400fd.png",
        "timestamp": 1555544430308,
        "duration": 983
    },
    {
        "description": "Delete Computer Apple I|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "30c11b2e380228975c10986106a210bb",
        "instanceId": 8708,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "001e00db-0008-00f5-009d-00d2000000e8.png",
        "timestamp": 1555544431613,
        "duration": 12612
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2878501fa613b5a07ae8b54e82b71a9c",
        "instanceId": 8456,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555544509475,
                "type": ""
            }
        ],
        "screenShotFile": "005f0040-00a0-0025-00e9-007200b6000d.png",
        "timestamp": 1555544509664,
        "duration": 1675
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2878501fa613b5a07ae8b54e82b71a9c",
        "instanceId": 8456,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555544511468,
                "type": ""
            }
        ],
        "screenShotFile": "00db0075-0030-00a3-0048-003300680032.png",
        "timestamp": 1555544511934,
        "duration": 7043
    },
    {
        "description": "Amiga500 is 1987-01-1|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2878501fa613b5a07ae8b54e82b71a9c",
        "instanceId": 8456,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007100de-0019-00f5-009b-002b008a0078.png",
        "timestamp": 1555544519357,
        "duration": 1318
    },
    {
        "description": "Delete Computer Apple I|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "2878501fa613b5a07ae8b54e82b71a9c",
        "instanceId": 8456,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00db009a-00ac-008b-0010-000d001c00b6.png",
        "timestamp": 1555544521036,
        "duration": 12730
    },
    {
        "description": "Check the title has the expected should have a title|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4e3c0f7ffd728989c128f33026145b90",
        "instanceId": 12512,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "deprecation - HTML Imports is deprecated and will be removed in M73, around March 2019. Please use ES modules instead. See https://www.chromestatus.com/features/5144752345317376 for more details.",
                "timestamp": 1555596103337,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "http://computer-database.herokuapp.com/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1555596115584,
                "type": ""
            }
        ],
        "screenShotFile": "006e006d-00e7-008c-008d-007100dd004a.png",
        "timestamp": 1555596111999,
        "duration": 3656
    },
    {
        "description": "Dell Windows10, Year 2019 and check the feature|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4e3c0f7ffd728989c128f33026145b90",
        "instanceId": 12512,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002200e1-004a-00e5-0038-00c200a600c3.png",
        "timestamp": 1555596117584,
        "duration": 10455
    },
    {
        "description": "Amiga500 is 1987-01-1|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4e3c0f7ffd728989c128f33026145b90",
        "instanceId": 12512,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e20083-0083-007b-0087-004500ca0051.png",
        "timestamp": 1555596128358,
        "duration": 987
    },
    {
        "description": "Delete Computer Apple I|Play sample application — Computer database",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "sessionId": "4e3c0f7ffd728989c128f33026145b90",
        "instanceId": 12512,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "003b00ee-0060-004a-00ab-00a300d700b8.png",
        "timestamp": 1555596129721,
        "duration": 12549
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

