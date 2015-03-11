var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var BenchmarkGroup = (function () {
            function BenchmarkGroup(name) {
                if (typeof name === "undefined") { name = ""; }
                this.name = name;
                this.all = new collections.Dictionary();
                this.completed = [];
                this.failed = [];
            }
            BenchmarkGroup.prototype.serialise = function () {
                var groups = [];
                this.all.forEach(function (key, value) {
                    groups.push(value.serialise());
                });
                return groups;
            };

            BenchmarkGroup.prototype.deserialise = function (object) {
                var _this = this;
                object.forEach(function (group) {
                    var name = group["name"];

                    if (!_this.all.containsKey(name)) {
                        var benchmark = new Core.Benchmark();
                        benchmark.deserialise(group);
                        _this.addBenchmark(benchmark);
                    } else {
                        _this.all.getValue(name).deserialise(group);
                    }
                });
            };

            BenchmarkGroup.prototype.runBenchmarks = function () {
                var _this = this;
                this.all.forEach(function (name, benchmark) {
                    if (benchmark.isShadow()) {
                        return;
                    }

                    try  {
                        benchmark.onInit();
                        benchmark.calculateOperationCount();
                        benchmark.onRun();
                        benchmark.analyse();
                        benchmark.onFinalise();
                    } catch (error) {
                        // console.log( error.message );
                        _this.setFailed(benchmark, name);
                    }
                });

                return this.failed.length === 0;
            };

            BenchmarkGroup.prototype.addBenchmark = function (benchmark) {
                var name = benchmark.getName();
                if (this.all.getValue(name) == undefined) {
                    this.all.setValue(name, benchmark);
                    return true;
                }
                return false;
            };

            BenchmarkGroup.prototype.getRegressed = function () {
                var regressed = [];
                this.completed.forEach(function (completed) {
                    if (completed.getRegression() != 0 /* None */) {
                        regressed.push(completed);
                    }
                });

                return regressed;
            };

            BenchmarkGroup.prototype.getSize = function () {
                return this.all.size();
            };

            BenchmarkGroup.prototype.setFailed = function (benchmark, name) {
                this.failed.push(benchmark);
                benchmark.setCompleted(false);
                // Console.fail( benchmark.getGroup(), name );
            };

            BenchmarkGroup.prototype.setCompleted = function (benchmark, name) {
                this.completed.push(benchmark);

                benchmark.setCompleted(true);
                // Console.done(this.name, name, benchmark.sampleDuration, benchmark.baselineDuration );
            };
            return BenchmarkGroup;
        })();
        Core.BenchmarkGroup = BenchmarkGroup;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="./benchmarkGroup.ts"/>
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var Group = (function () {
            function Group(name) {
                this.name = name;
                this.micros = new Core.BenchmarkGroup();
            }
            Group.prototype.serialise = function () {
                return {
                    name: this.name,
                    micros: this.micros.serialise()
                };
            };

            Group.prototype.deserialise = function (object) {
                this.name = object["name"];
                this.micros.deserialise(object["micros"]);
            };

            Group.prototype.addMicroBenchmark = function (benchmark) {
                if (!this.micros.addBenchmark(benchmark)) {
                    // Console.log( "There is already a benchmark registered in group '"+ this.name +"' with the name '"+
                    // benchmark.getName() +"'!" );
                    return false;
                }

                return true;
            };

            Group.prototype.runBenchmarks = function () {
                // Console.groupStart( this.name, this.getCount() );
                var start = performance.now();

                var success = this.micros.runBenchmarks();

                this.duration = performance.now() - start;

                // Console.groupEnd( this.name, this.getCount(), this.duration );
                return success;
            };

            Group.prototype.getMicroCount = function () {
                return this.micros.getSize();
            };

            Group.prototype.getFailedNames = function () {
                var failed = [];

                this.micros.failed.forEach(function (benchmark) {
                    failed.push(benchmark.getName());
                });

                return failed;
            };

            Group.prototype.getRegressedNames = function () {
                var regressed = [];

                this.micros.getRegressed().forEach(function (benchmark) {
                    regressed.push(benchmark.getName());
                });

                return regressed;
            };

            Group.prototype.getCount = function () {
                return this.getMicroCount();
            };
            return Group;
        })();
        Core.Group = Group;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var Config = (function () {
            function Config() {
            }
            Config.serialise = function () {
                return {
                    microMaxHistory: Config.microMaxHistory,
                    minMsPerBenchUnit: Config.minMsPerBenchUnit,
                    alpha: Config.alpha,
                    winsoriseAnalysis: Config.winsoriseAnalysis
                };
            };

            Config.deserialise = function (object) {
                Config.microMaxHistory = object["microMaxHistory"];
                Config.minMsPerBenchUnit = object["minMsPerBenchUnit"];
                Config.alpha = object["alpha"];
                Config.winsoriseAnalysis = object["winsoriseAnalysis"];
            };
            Config.alpha = 0.02;
            Config.winsoriseAnalysis = false;

            Config.microMaxHistory = 20;
            Config.minMsPerBenchUnit = 10;

            Config.precision = 6;
            return Config;
        })();
        Core.Config = Config;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="../core/group.ts" />
/// <reference path="../core/config.ts" />
var BenchViewer;
(function (BenchViewer) {
    var TestName = (function () {
        function TestName(groupName, testName) {
            this.groupName = groupName;
            this.testName = testName;
        }
        return TestName;
    })();
    BenchViewer.TestName = TestName;

    var BenchLib = (function () {
        function BenchLib(data) {
            this.data = data;
            this.groups = new collections.Dictionary();
        }
        BenchLib.prototype.runBenchmarks = function () {
            this.deserialise(this.data);

            this.setTimestamp();

            var success = this.runBenchmarkSuites();

            return success;
        };

        BenchLib.prototype.serialise = function () {
            var groups = [];

            this.groups.forEach(function (key, value) {
                groups.push(value.serialise());
            });

            return {
                groups: groups,
                config: BenchViewer.Core.Config.serialise()
            };
        };

        BenchLib.prototype.deserialise = function (object) {
            var _this = this;
            BenchViewer.Core.Config.deserialise(object["config"]);

            var groups = object["groups"];

            groups.forEach(function (group) {
                var name = group.name;

                if (!_this.groups.containsKey(name)) {
                    var nGroup = new BenchViewer.Core.Group(name);
                    nGroup.deserialise(group);
                    _this.groups.setValue(name, nGroup);
                } else {
                    _this.groups.getValue(name).deserialise(group);
                }
            });
        };

        BenchLib.prototype.setTimestamp = function () {
            var time = new Date().toISOString();
            BenchViewer.Core.Config.timestamp = time;
        };

        BenchLib.prototype.checkGroup = function (group) {
            if (!this.groups.containsKey(group)) {
                this.groups.setValue(group, new BenchViewer.Core.Group(group));
            }
        };

        BenchLib.prototype.getFailed = function () {
            var failed = [];

            this.groups.forEach(function (name, group) {
                group.getFailedNames().forEach(function (failedGroup) {
                    var item = new TestName(name, failedGroup);
                    failed.push(item);
                });
            });

            return failed;
        };

        BenchLib.prototype.getRegressed = function () {
            var regressed = [];

            this.groups.forEach(function (name, group) {
                group.getRegressedNames().forEach(function (failedGroup) {
                    var item = new TestName(name, failedGroup);
                    regressed.push(item);
                });
            });

            return regressed;
        };

        BenchLib.prototype.getBenchmarkCount = function () {
            var count = 0;
            this.groups.forEach(function (name, group) {
                count += group.getCount();
            });

            return count;
        };

        BenchLib.prototype.runBenchmarkSuites = function () {
            var benchmarkCount = this.getBenchmarkCount();
            var groupCount = this.groups.size();

            // Console.init( benchmarkCount, groupCount);
            var start = performance.now();
            var failed = false;
            this.groups.forEach(function (name, group) {
                failed = failed || !group.runBenchmarks();
            });

            // Console.end( benchmarkCount, groupCount, performance.now() - start, this.getFailed(), this.getRegressed() );
            return !failed;
        };
        return BenchLib;
    })();
    BenchViewer.BenchLib = BenchLib;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var BenchmarkStat = (function () {
            function BenchmarkStat() {
                this.average = 0.0;
                this.standardDeviation = 0.0;
                this.variance = 0.0;
                this.low = 0.0;
                this.high = 0.0;
            }
            BenchmarkStat.prototype.serialise = function () {
                return {
                    average: this.average,
                    standardDeviation: this.standardDeviation,
                    variance: this.variance,
                    low: this.low,
                    high: this.high
                };
            };

            BenchmarkStat.prototype.deserialise = function (object) {
                this.average = object["average"];
                this.standardDeviation = object["standardDeviation"];
                this.variance = object["variance"];
                this.low = object["low"];
                this.high = object["high"];
            };
            return BenchmarkStat;
        })();
        Core.BenchmarkStat = BenchmarkStat;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
Array.prototype.max = function () {
    return Math.max.apply(Math, this);
};

Array.prototype.min = function () {
    return Math.min.apply(Math, this);
};

var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        /**
        * Generates a GUID string.
        * @returns {String} The generated GUID.
        * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
        * @author Slavik Meltser (slavik@meltser.info).
        * @link http://slavik.meltser.info/?p=142
        */
        function guid() {
            function p8(s) {
                if (typeof s === "undefined") { s = false; }
                var p = (Math.random().toString(16) + "000000000").substr(2, 8);
                return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
            }

            return p8() + p8(true) + p8(true) + p8();
        }
        Core.guid = guid;

        function round(x) {
            if (x.toString().indexOf("e") >= 0) {
                return Math.round(x);
            }
            var decimals = Core.Config.precision;
            return +(round(x + "e+" + decimals) + "e-" + decimals);
        }
        Core.round = round;

        function roundArray(array) {
            return array.map(function (x) {
                return round(x);
            });
        }
        Core.roundArray = roundArray;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="benchmarkStat.ts" />
/// <reference path="util.ts" />
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var BenchmarkData = (function () {
            function BenchmarkData(isSample, isCorrected) {
                if (typeof isSample === "undefined") { isSample = true; }
                if (typeof isCorrected === "undefined") { isCorrected = false; }
                this.isSample = isSample;
                this.isCorrected = isCorrected;
                this.samples = [];
                this.inliers = [];
                this.outliers = [];
                this.winsorised = [];
                this.winsorisedStats = new Core.BenchmarkStat();
                this.sampleStats = new Core.BenchmarkStat();
                this.inlierHigh = 0.0;
                this.inlierLow = 0.0;
                this.median = 0.0;
                this.q1 = 0.0;
                this.q3 = 0.0;
                this.winsorise = false;
            }
            BenchmarkData.prototype.serialise = function () {
                var object = {
                    sampleStats: this.sampleStats.serialise()
                };

                if (this.storeSamples()) {
                    object["samples"] = this.samples;
                }

                if (this.isValid()) {
                    object["median"] = this.median;
                    object["Q1"] = this.q1;
                    object["Q3"] = this.q3;

                    if (this.inliers.length > 1) {
                        object["winsorisedStats"] = this.winsorisedStats.serialise();
                    }

                    if (this.storeSamples()) {
                        object["inliers"] = this.inliers;
                    }

                    object["outliers"] = this.outliers;
                }

                return object;
            };

            BenchmarkData.prototype.deserialise = function (object) {
                var sampleStats = object["sampleStats"];
                var samples = object["samples"];
                if (sampleStats == undefined && samples != undefined) {
                    this.samples = samples;
                }

                var validSize = this.isValid();
                if (sampleStats == undefined && validSize) {
                    this.calculateSampleStats();
                } else {
                    if (sampleStats != undefined) {
                        this.sampleStats.deserialise(sampleStats);
                    }
                }

                if (validSize) {
                    var winsorisedStats = object["winsorisedStats"];
                    if (winsorisedStats == undefined) {
                        this.calculatePercentileStats();
                    } else {
                        this.median = object["median"];
                        this.q1 = object["Q1"];
                        this.q3 = object["Q3"];
                        this.outliers = object["outliers"];

                        if (this.storeSamples()) {
                            this.inliers = object["inliers"];
                        }

                        if (this.hasSufficientInliers()) {
                            this.winsorisedStats.deserialise(winsorisedStats);
                        }
                    }
                }
            };

            BenchmarkData.prototype.setSamplesForCorrection = function (samples, baseline) {
                var baselineAvg = baseline.sampleStats.average;
                var sampleAvg = samples.sampleStats.average;

                var corrected = new Array;

                samples.samples.forEach(function (value, index) {
                    corrected[index] = value - baselineAvg;
                });

                this.setSamples(corrected, false);

                var sampleVec = samples.samples;
                var baselineVec = baseline.samples;

                this.sampleStats.average = Core.Statistics.calculateMean(corrected);

                var meanVar = samples.sampleStats.variance + baseline.sampleStats.variance - Core.Statistics.calculateCovariance(sampleVec, sampleAvg, baselineVec, baselineAvg, this.isSample);
                this.sampleStats.variance = meanVar / sampleVec.length;

                this.sampleStats.standardDeviation = Core.Statistics.calculateStandardDeviation(this.sampleStats.variance);

                if (this.isValid()) {
                    var wsampleVec = samples.winsorised;
                    var wbaselineVec = baseline.winsorised;

                    var wbaselineAvg = baseline.winsorisedStats.average;
                    var wsampleAvg = samples.winsorisedStats.average;

                    this.winsorisedStats.average = Core.Statistics.calculateMean(wsampleVec);

                    var wmeanVar = samples.winsorisedStats.variance + baseline.winsorisedStats.variance - Core.Statistics.calculateCovariance(wsampleVec, wsampleAvg, wbaselineVec, wbaselineAvg, this.isSample);

                    this.winsorisedStats.variance = wmeanVar / wsampleVec.length;

                    this.winsorisedStats.standardDeviation = Core.Statistics.calculateStandardDeviation(this.winsorisedStats.variance);
                }
            };

            BenchmarkData.prototype.setSamples = function (samples, calculateStatistics) {
                if (typeof calculateStatistics === "undefined") { calculateStatistics = true; }
                this.samples = samples;
                this.calculateSampleStats(calculateStatistics);
                this.calculatePercentileStats(calculateStatistics);
            };

            BenchmarkData.prototype.isValid = function () {
                return this.samples.length > 1;
            };

            BenchmarkData.prototype.hasSufficientInliers = function () {
                return this.inliers.length > 1;
            };

            BenchmarkData.prototype.calculateWinsorisedSamples = function (low, high) {
                var wsamples = this.inliers;

                this.outliers.forEach(function (outlier) {
                    if (outlier <= low) {
                        wsamples.unshift(low);
                    } else if (outlier >= high) {
                        wsamples.unshift(high);
                    }
                });

                this.winsorised = wsamples;
            };

            BenchmarkData.prototype.calculatePercentileStats = function (calculateStatistics) {
                if (typeof calculateStatistics === "undefined") { calculateStatistics = true; }
                if (!this.isValid()) {
                    return;
                }

                var sortedSamples = this.samples;
                sortedSamples.sort(function (a, b) {
                    return a - b;
                });

                var length = sortedSamples.length;
                var half = Math.floor(length / 2);
                var quart = Math.floor(half / 2);

                this.median = this.calculateQ(sortedSamples, half);
                this.q1 = this.calculateQ.call(sortedSamples, half - quart);
                this.q3 = this.calculateQ.call(sortedSamples, half + quart);

                var IQR = this.q3 - this.q1;
                var lower = this.q1 - 1.5 * IQR;
                var upper = this.q3 + 1.5 * IQR;

                sortedSamples.forEach((function (value) {
                    if (lower <= value && value <= upper) {
                        this.inliers.unshift(value);
                    } else {
                        this.outliers.unshift(value);
                    }
                }));

                if (this.hasSufficientInliers()) {
                    this.winsorisedStats.low = this.inliers[0];
                    this.winsorisedStats.high = this.inliers[this.inliers.length - 1];

                    if (calculateStatistics) {
                        this.calculateWinsorisedSamples(this.winsorisedStats.low, this.winsorisedStats.high);

                        var stats = new Core.Statistics(this.winsorised);
                        this.winsorisedStats.average = stats.mean;
                        this.winsorisedStats.standardDeviation = stats.standardDeviation;
                        this.winsorisedStats.variance = stats.variance;
                    }
                }
            };

            BenchmarkData.prototype.calculateSampleStats = function (calculateStatistics) {
                if (typeof calculateStatistics === "undefined") { calculateStatistics = true; }
                if (calculateStatistics) {
                    var sampleStats = new Core.Statistics(this.samples, this.isSample);
                    this.sampleStats.average = sampleStats.mean;
                    this.sampleStats.standardDeviation = sampleStats.standardDeviation;
                    this.sampleStats.variance = sampleStats.variance;
                }

                this.sampleStats.low = this.samples.min();
                this.sampleStats.high = this.samples.max();
            };

            BenchmarkData.prototype.storeSamples = function () {
                return this.isCorrected;
            };

            BenchmarkData.prototype.calculateQ = function (array, place) {
                var length = array.length;
                if (length % 2 !== 0) {
                    return array[place];
                } else {
                    return (array[place - 1] + array[place]) * 0.5;
                }
            };
            return BenchmarkData;
        })();
        Core.BenchmarkData = BenchmarkData;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var MemLeak = (function () {
            function MemLeak() {
            }
            MemLeak.prototype.serialise = function () {
                return {
                    file: this.file,
                    size: this.size,
                    line: this.line
                };
            };

            MemLeak.prototype.deserialise = function (object) {
                this.file = object["file"];
                this.size = object["size"];
                this.line = object["line"];
            };
            return MemLeak;
        })();
        Core.MemLeak = MemLeak;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="./benchmarkData.ts" />
/// <reference path="./memory.ts"/>
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var BenchmarkResult = (function () {
            function BenchmarkResult(isCurrent) {
                if (typeof isCurrent === "undefined") { isCurrent = false; }
                this.isCurrent = isCurrent;
                this.timeSamples = new Core.BenchmarkData();
                this.timeBaseline = new Core.BenchmarkData();
                this.timeCorrected = new Core.BenchmarkData(true, true);
                this.memorySamples = new Core.BenchmarkData(false);
                this.memoryBaseline = new Core.BenchmarkData(false);
                this.memoryCorrected = new Core.BenchmarkData(false, true);
                this.memoryLeaks = [];
                this.operationCount = 0;
                this.sampleCount = 0;
                this.regression = 0;
                this.memoryProfile = true;
                this.completed = false;
            }
            BenchmarkResult.prototype.serialise = function () {
                var result = {
                    timestamp: this.timestamp,
                    completed: this.completed
                };

                if (this.completed) {
                    result["operationCount"] = this.operationCount;
                    result["sampleCount"] = this.sampleCount;
                    result["regression"] = this.regression;
                    result["timeCorrected"] = this.timeCorrected.serialise();

                    if (this.isCurrent) {
                        result["timeSamples"] = this.timeSamples.serialise();
                        result["timeBaseline"] = this.timeBaseline.serialise();
                    }

                    if (this.memoryProfile) {
                        var memoryLeaks = [];

                        this.memoryLeaks.forEach(function (memoryLeak) {
                            memoryLeaks.push(memoryLeak.serialise());
                        });

                        result["memoryProfile"] = this.memoryProfile;
                        result["memorySamples"] = this.memorySamples.serialise();
                        result["memoryBaseline"] = this.memoryBaseline.serialise();
                        result["memoryCorrected"] = this.memoryCorrected.serialise();
                        result["memoryLeaks"] = memoryLeaks;
                    }
                }
            };

            BenchmarkResult.prototype.deserialise = function (object) {
                var _this = this;
                this.completed = object["completed"];
                this.timestamp = object["timestamp"];

                if (this.completed) {
                    this.operationCount = object["operationCount"];
                    this.sampleCount = object["sampleCount"];

                    var regression = object["regression"];
                    if (regression !== undefined) {
                        this.regression = regression;
                    } else {
                        this.regression = 0;
                    }

                    if (this.isCurrent) {
                        this.timeSamples.deserialise(object["timeSamples"]);
                        this.timeBaseline.deserialise(object["timeBaseline"]);
                    }

                    var timeCorrected = object["timeCorrected"];
                    if (timeCorrected === undefined) {
                        this.timeCorrected.setSamplesForCorrection(this.timeSamples, this.timeBaseline);
                    } else {
                        this.timeCorrected.deserialise(timeCorrected);
                    }

                    var memoryProfile = object["memoryProfile"];
                    if (memoryProfile !== undefined) {
                        this.memoryProfile = memoryProfile;

                        if (this.memoryProfile) {
                            this.memorySamples.deserialise(object["memorySamples"]);
                            this.memoryBaseline.deserialise(object["memoryBaseline"]);
                            this.memoryCorrected.deserialise(object["memoryCorrected"]);

                            var memoryLeaks = object["memoryLeaks"];
                            if (memoryLeaks !== undefined) {
                                memoryLeaks.forEach(function (leak) {
                                    var nLeak = new Core.MemLeak();
                                    nLeak.deserialise(leak);
                                    _this.memoryLeaks.push(nLeak);
                                });
                            }
                        }
                    }
                }
            };

            BenchmarkResult.prototype.setWingsorise = function (winsorise) {
                this.timeSamples.winsorise = winsorise;
                this.timeBaseline.winsorise = winsorise;
                this.timeCorrected.winsorise = winsorise;
            };
            return BenchmarkResult;
        })();
        Core.BenchmarkResult = BenchmarkResult;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        (function (Regression) {
            Regression[Regression["None"] = 0x00] = "None";
            Regression[Regression["TimeSlower"] = 0x01] = "TimeSlower";
            Regression[Regression["TimeFaster"] = 0x02] = "TimeFaster";
            Regression[Regression["MemSmaller"] = 0x04] = "MemSmaller";
            Regression[Regression["MemLarger"] = 0x08] = "MemLarger";
            Regression[Regression["PeakMemSmaller"] = 0x10] = "PeakMemSmaller";
            Regression[Regression["PeakMemLarger"] = 0x20] = "PeakMemLarger";
        })(Core.Regression || (Core.Regression = {}));
        var Regression = Core.Regression;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="./benchmarkResult.ts"/>
/// <reference path="./regression.ts"/>
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var Benchmark = (function () {
            function Benchmark(benchmarkCase) {
                if (typeof benchmarkCase === "undefined") { benchmarkCase = null; }
                this.benchmarkCase = benchmarkCase;
                this.shadowName = "";
                this.history = new Array();
                this.current = new Core.BenchmarkResult();
            }
            Benchmark.prototype.serialise = function () {
                var history = [];

                this.history.forEach(function (result) {
                    history.push(result.serialise());
                });

                return {
                    name: this.getName(),
                    current: this.current.serialise(),
                    history: history
                };
            };

            Benchmark.prototype.deserialise = function (object) {
                var _this = this;
                this.shadowName = object["name"];

                var results = object["history"];
                results.forEach(function (result) {
                    var benchmarkResult = new Core.BenchmarkResult();
                    benchmarkResult.deserialise(result);

                    _this.history.push(benchmarkResult);
                });

                var size = this.history.length;
                var maxHist = Core.Config.microMaxHistory - 1;
                var newSize = size > maxHist ? maxHist : size;
                this.history = this.history.slice(size - newSize, size);

                var current = new Core.BenchmarkResult(true);
                current.deserialise(object["current"]);

                this.history.push(current);

                this.history = this.history.reverse();
            };

            Benchmark.prototype.onInit = function () {
                this.current.memoryProfile = this.isProfileMemoryEnabled();
                this.current.timestamp = Core.Config.timestamp;
                this.current.setWingsorise(this.getWinsorise());
                this.current.sampleCount = this.getSampleCount();
            };

            Benchmark.prototype.onRun = function () {
                if (this.isProfileMemoryEnabled()) {
                    this.runMemorySamples();
                    this.runMemoryBaseline();
                }

                this.runTime();
            };

            Benchmark.prototype.onFinalise = function () {
            };

            Benchmark.prototype.analyse = function () {
                // Console.baseline(this.getOverhead());
                // Console.printResult();
                // Console.result( this.current.timeSamples.samplestats );
                var _this = this;
                // Console.printResultCorrected();
                // Console.result(this.current.timeCorrected.sampleStats);
                var regression = 0 /* None */;

                var completedResults = this.getCompletedResults();

                if (completedResults.length > 1) {
                    var history = [];

                    completedResults.forEach(function (result) {
                        var timeCorrected = result.timeCorrected;
                        var sampleStat;

                        if (_this.getWinsorise()) {
                            sampleStat = timeCorrected.winsorisedStats;
                        } else {
                            sampleStat = timeCorrected.sampleStats;
                        }

                        var stat = new Core.Statistics.StatHistory();
                        stat.average = sampleStat.average;
                        stat.variance = sampleStat.variance;
                        stat.sampleCount = result.sampleCount;
                        history.push(stat);
                    });

                    var histInterval = Core.Statistics.getConfidenceIntervalFromHistory(history);

                    var stats = this.getWinsorise() ? this.current.timeCorrected.winsorisedStats : this.current.timeCorrected.sampleStats;
                    var currentInterval = Core.Statistics.getConfidenceInterval(stats.standardDeviation, this.current.sampleCount, stats.average);

                    if (currentInterval.upper < histInterval.lower) {
                        regression |= 2 /* TimeFaster */;
                        // Console.RegressTimeFaster( histInterval.lower, histInterval.upper, currentInterval.upper );
                    } else if (currentInterval.lower > histInterval.upper) {
                        regression |= 1 /* TimeSlower */;
                        // Console.RegressTimeSlower( histInterval.lower, histInterval.upper, currentInverval.lower );
                    }

                    if (this.isProfileMemoryEnabled()) {
                        var statHistory = [];
                        var peaks = [];

                        completedResults.forEach(function (result) {
                            var sampleCount = result.memoryCorrected.samples.length;

                            var sampleStat = result.memoryCorrected.sampleStats;

                            if (result.memoryProfile && sampleCount > 0) {
                                var stat;
                                stat.average = sampleStat.average;
                                stat.variance = sampleStat.variance;
                                stat.sampleCount = sampleCount;

                                statHistory.push(stat);
                            }

                            peaks.push(sampleStat.high);
                        });

                        if (statHistory.length > 0) {
                            var interval = Core.Statistics.getConfidenceIntervalFromHistory(statHistory);

                            var sampleStats = this.current.memoryCorrected.sampleStats;

                            var average = sampleStats.average;

                            if (average < interval.lower) {
                                regression |= 4 /* MemSmaller */;
                                // Console.RegressMemSmaller( interval.lower, interval.upper, average );
                            } else if (average > interval.upper) {
                                regression |= 8 /* MemLarger */;
                                // Console.RegressMemLarger( interval.lower, interval.upper, average );
                            }

                            var peakData;
                            peakData.setSamples(peaks);

                            var peakStats = peakData.sampleStats;

                            var peakInterval = Core.Statistics.getConfidenceInterval(peakStats.standardDeviation, peaks.length, peakStats.average);

                            if (sampleStats.high < peakInterval.lower) {
                                regression |= 16 /* PeakMemSmaller */;
                                // Console.RegressPeakMemSmaller( peakInterval.lower, peakInterval.upper, sampleStats.high );
                            } else if (sampleStats.high > peakInterval.upper) {
                                regression |= 32 /* PeakMemLarger */;
                                // Console.RegressPeakMemLarger( peakInterval.lower, peakInterval.upper, sampleStats.high );
                            }
                        }
                    }
                }

                this.current.regression = regression;
            };

            Benchmark.prototype.isCompleted = function () {
                return this.current.completed;
            };

            Benchmark.prototype.setCompleted = function (isCompleted) {
                this.current.completed = isCompleted;
            };

            Benchmark.prototype.getOperationCount = function () {
                return this.current.operationCount;
            };

            Benchmark.prototype.calculateOperationCount = function () {
                var minTimeRequiredPerUnit = Core.Config.minMsPerBenchUnit;
                var operationCount = 0;

                var start = performance.now();
                while ((performance.now() - start) < minTimeRequiredPerUnit) {
                    ++operationCount;

                    this.runSamples();
                }

                this.current.operationCount = operationCount;
                // Console.stats( this.getSampleCount(), this.getOperationCount() );
            };

            Benchmark.prototype.getSampleCount = function () {
                return 0;
            };

            Benchmark.prototype.getWinsorise = function () {
                return Core.Config.winsoriseAnalysis;
            };

            Benchmark.prototype.getRegression = function () {
                return this.current.regression;
            };

            Benchmark.prototype.getName = function () {
                return this.shadowName;
            };

            Benchmark.prototype.getGroup = function () {
                return "";
            };

            Benchmark.prototype.isProfileMemoryEnabled = function () {
                return false;
            };

            Benchmark.prototype.isShadow = function () {
                return true;
            };

            Benchmark.prototype.runMemorySamples = function () {
                var samples = [];

                //Memory.startProfile();
                this.runSamples();

                //Memory.endProfile(samples, this.current.memoryLeaks);
                this.current.memorySamples.setSamples(samples);
                this.current.memoryCorrected.setSamplesForCorrection(this.current.memorySamples, this.current.memoryBaseline);
            };

            Benchmark.prototype.runTime = function () {
                var sampleCount = this.getSampleCount();
                var operationCount = this.getOperationCount();

                var samples = [];
                var baseline = [];

                for (var i = 0; i < sampleCount; ++i) {
                     {
                        var startTime = performance.now();

                        for (var j = 0; j < operationCount; ++j) {
                            this.runBaseline();
                        }

                        baseline[i] = new Date().getTime() - startTime;
                    }
                     {
                        var startTime2 = performance.now();

                        for (var k = 0; k < operationCount; ++k) {
                            this.runSamples();
                        }

                        samples[i] = performance.now() - startTime2;
                    }
                }

                this.baselineDuration = baseline.reduce(function (x, y) {
                    return x + y;
                });
                this.sampleDuration = samples.reduce(function (x, y) {
                    return x + y;
                });

                this.current.timeBaseline.setSamples(baseline);
                this.current.timeSamples.setSamples(samples);

                this.current.timeCorrected.setSamplesForCorrection(this.current.timeSamples, this.current.timeBaseline);
            };

            Benchmark.prototype.runMemoryBaseline = function () {
                var samples = [];

                //Memory.startProfile();
                this.runBaseline();

                //Memory.endProfile(samples);
                if (samples.length > 1) {
                    this.current.memoryBaseline.setSamples(samples);
                }
            };

            Benchmark.prototype.getOverhead = function () {
                return this.current.timeBaseline.sampleStats.average;
            };

            Benchmark.prototype.getCompletedResults = function () {
                var results = [];

                this.history.forEach(function (result) {
                    if (result.completed) {
                        results.push(result);
                    }
                });

                return results;
            };

            Benchmark.prototype.runSamples = function () {
                this.benchmarkCase.init();
                this.benchmarkCase.run();
                this.benchmarkCase.finalise();
            };

            Benchmark.prototype.runBaseline = function () {
                this.benchmarkCase.init();
                this.benchmarkCase.baseline();
                this.benchmarkCase.finalise();
            };
            return Benchmark;
        })();
        Core.Benchmark = Benchmark;

        (function (Benchmark) {
            var BenchmarkCase = (function () {
                function BenchmarkCase() {
                }
                BenchmarkCase.prototype.run = function () {
                };

                BenchmarkCase.prototype.baseline = function () {
                };

                BenchmarkCase.prototype.init = function () {
                };

                BenchmarkCase.prototype.finalise = function () {
                };
                return BenchmarkCase;
            })();
            Benchmark.BenchmarkCase = BenchmarkCase;
        })(Core.Benchmark || (Core.Benchmark = {}));
        var Benchmark = Core.Benchmark;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="config.ts"/>
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var Statistics = (function () {
            function Statistics(data, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                this.standardDeviation = 0.0;
                this.variance = 0.0;
                this.mean = 0.0;
                this.mean = Statistics.calculateMean(data);
                this.variance = Statistics.calculateVariance(data, this.mean, isSample);
                this.standardDeviation = Statistics.calculateStandardDeviation(this.variance);
            }
            Statistics.calculateStandardDeviation = function (variance) {
                return Math.sqrt(variance);
            };

            Statistics.calculateMean = function (data) {
                if (data.length > 0) {
                    return data.reduce((function (a, b) {
                        return a + b;
                    })) / data.length;
                }
                return 0;
            };

            Statistics.calculateVariance = function (data, mean, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                if (data.length > 1) {
                    var temp = 0.0;
                    data.forEach((function (element) {
                        var v = element - mean;
                        temp += v * v;
                    }));
                    return temp / this.getSize(data.length - 1);
                }
                return 0;
            };

            Statistics.calculateCovariance = function (samples, sampleMean, baseline, baselineMean, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                var sampleSize = samples.length;
                if (sampleSize > 1 && sampleSize == baseline.length) {
                    var temp = 0;

                    for (var i = 0; i < sampleSize; ++i) {
                        temp += (samples[i] - sampleMean) * (baseline[i] - baselineMean);
                    }
                    return temp / Statistics.getSize(sampleSize, isSample);
                }

                return 0.0;
            };

            Statistics.getConfidenceIntervalFromHistory = function (history, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                var interval;

                var historySampleSize = 0;
                var scaledHistoryPooledVariance = 0;
                var scaledHistoryMean = 0;

                history.forEach(function (stat) {
                    historySampleSize += stat.sampleCount;
                    scaledHistoryMean += stat.sampleCount * stat.average;

                    scaledHistoryPooledVariance += Statistics.getSize(stat.sampleCount, isSample) * stat.variance;
                });

                var historyPooledStdev = Math.sqrt(scaledHistoryPooledVariance / historySampleSize);
                var historyMean = scaledHistoryMean / historySampleSize;

                return Statistics.getConfidenceInterval(historyPooledStdev, historySampleSize, historyMean);
            };

            Statistics.getConfidenceInterval = function (stdev, size, mean) {
                var interval = new Statistics.ConfidenceInterval;

                if (size > 0) {
                    var zAlphaOver2 = Statistics.normalCDFInverse(1 - Core.Config.alpha * 0.5);
                    var offset = (stdev * zAlphaOver2) / Math.sqrt(size);

                    interval.lower = mean - offset;
                    interval.upper = mean + offset;
                } else {
                    interval.lower = 0;
                    interval.upper = 0;
                }

                return interval;
            };

            // ReSharper disable once InconsistentNaming
            Statistics.normalCDFInverse = function (p) {
                if (p < 0.5) {
                    // F^-1(p) = - G^-1(p)
                    return -Statistics.rationalApproximation(Math.sqrt(-2.0 * Math.log(p)));
                } else {
                    // F^-1(p) = G^-1(1-p)
                    return Statistics.rationalApproximation(Math.sqrt(-2.0 * Math.log(1 - p)));
                }
            };

            Statistics.prototype.calculateVariance = function (data, mean, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                if (data.length > 1) {
                    var temp = 0;

                    data.forEach(function (value) {
                        var valueSqrt = value - mean;
                        temp += valueSqrt * valueSqrt;
                    });

                    return temp / Statistics.getSize(data.length, isSample);
                }

                return 0.0;
            };

            Statistics.rationalApproximation = function (t) {
                // Abramowitz and Stegun formula 26.2.23.
                // The absolute value of the error should be less than 4.5 e-4.
                var c = [2.515517, 0.802853, 0.010328];
                var d = [1.432788, 0.189269, 0.001308];
                return t - ((c[2] * t + c[1]) * t + c[0]) / (((d[2] * t + d[1]) * t + d[0]) * t + 1.0);
            };

            Statistics.getSize = function (size, isSample) {
                if (typeof isSample === "undefined") { isSample = true; }
                return isSample ? size - 1 : size;
            };
            return Statistics;
        })();
        Core.Statistics = Statistics;

        (function (Statistics) {
            var StatHistory = (function () {
                function StatHistory() {
                    this.sampleCount = 0;
                    this.average = 0;
                    this.variance = 0;
                }
                return StatHistory;
            })();
            Statistics.StatHistory = StatHistory;

            var ConfidenceInterval = (function () {
                function ConfidenceInterval() {
                    this.lower = 0;
                    this.upper = 0;
                }
                return ConfidenceInterval;
            })();
            Statistics.ConfidenceInterval = ConfidenceInterval;
        })(Core.Statistics || (Core.Statistics = {}));
        var Statistics = Core.Statistics;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
// Copyright 2013 Basarat Ali Syed. All Rights Reserved.
//
// Licensed under MIT open source license http://opensource.org/licenses/MIT
//
// Orginal javascript code was by Mauricio Santos
/**
* @namespace Top level namespace for collections, a TypeScript data structure library.
*/
var collections;
(function (collections) {
    

    

    

    /**
    * Default function to compare element order.
    * @function
    */
    function defaultCompare(a, b) {
        if (a < b) {
            return -1;
        } else if (a === b) {
            return 0;
        } else {
            return 1;
        }
    }
    collections.defaultCompare = defaultCompare;

    /**
    * Default function to test equality.
    * @function
    */
    function defaultEquals(a, b) {
        return a === b;
    }
    collections.defaultEquals = defaultEquals;

    /**
    * Default function to convert an object to a string.
    * @function
    */
    function defaultToString(item) {
        if (item === null) {
            return 'COLLECTION_NULL';
        } else if (collections.isUndefined(item)) {
            return 'COLLECTION_UNDEFINED';
        } else if (collections.isString(item)) {
            return item;
        } else {
            return item.toString();
        }
    }
    collections.defaultToString = defaultToString;

    /**
    * Joins all the properies of the object using the provided join string
    */
    function toString(item, join) {
        if (typeof join === "undefined") { join = ","; }
        if (item === null) {
            return 'COLLECTION_NULL';
        } else if (collections.isUndefined(item)) {
            return 'COLLECTION_UNDEFINED';
        } else if (collections.isString(item)) {
            return item.toString();
        } else {
            var toret = "{";
            var first = true;
            for (var prop in item) {
                if (item.hasOwnProperty(prop)) {
                    if (first)
                        first = false;
                    else
                        toret = toret + join;
                    toret = toret + prop + ":" + item[prop];
                }
            }
            return toret + "}";
        }
    }
    collections.toString = toString;

    /**
    * Checks if the given argument is a function.
    * @function
    */
    function isFunction(func) {
        return (typeof func) === 'function';
    }
    collections.isFunction = isFunction;

    /**
    * Checks if the given argument is undefined.
    * @function
    */
    function isUndefined(obj) {
        return (typeof obj) === 'undefined';
    }
    collections.isUndefined = isUndefined;

    /**
    * Checks if the given argument is a string.
    * @function
    */
    function isString(obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    }
    collections.isString = isString;

    /**
    * Reverses a compare function.
    * @function
    */
    function reverseCompareFunction(compareFunction) {
        if (!collections.isFunction(compareFunction)) {
            return function (a, b) {
                if (a < b) {
                    return 1;
                } else if (a === b) {
                    return 0;
                } else {
                    return -1;
                }
            };
        } else {
            return function (d, v) {
                return compareFunction(d, v) * -1;
            };
        }
    }
    collections.reverseCompareFunction = reverseCompareFunction;

    /**
    * Returns an equal function given a compare function.
    * @function
    */
    function compareToEquals(compareFunction) {
        return function (a, b) {
            return compareFunction(a, b) === 0;
        };
    }
    collections.compareToEquals = compareToEquals;

    /**
    * @namespace Contains various functions for manipulating arrays.
    */
    (function (arrays) {
        /**
        * Returns the position of the first occurrence of the specified item
        * within the specified array.
        * @param {*} array the array in which to search the element.
        * @param {Object} item the element to search.
        * @param {function(Object,Object):boolean=} equalsFunction optional function used to
        * check equality between 2 elements.
        * @return {number} the position of the first occurrence of the specified element
        * within the specified array, or -1 if not found.
        */
        function indexOf(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            for (var i = 0; i < length; i++) {
                if (equals(array[i], item)) {
                    return i;
                }
            }
            return -1;
        }
        arrays.indexOf = indexOf;

        /**
        * Returns the position of the last occurrence of the specified element
        * within the specified array.
        * @param {*} array the array in which to search the element.
        * @param {Object} item the element to search.
        * @param {function(Object,Object):boolean=} equalsFunction optional function used to
        * check equality between 2 elements.
        * @return {number} the position of the last occurrence of the specified element
        * within the specified array or -1 if not found.
        */
        function lastIndexOf(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            for (var i = length - 1; i >= 0; i--) {
                if (equals(array[i], item)) {
                    return i;
                }
            }
            return -1;
        }
        arrays.lastIndexOf = lastIndexOf;

        /**
        * Returns true if the specified array contains the specified element.
        * @param {*} array the array in which to search the element.
        * @param {Object} item the element to search.
        * @param {function(Object,Object):boolean=} equalsFunction optional function to
        * check equality between 2 elements.
        * @return {boolean} true if the specified array contains the specified element.
        */
        function contains(array, item, equalsFunction) {
            return arrays.indexOf(array, item, equalsFunction) >= 0;
        }
        arrays.contains = contains;

        /**
        * Removes the first ocurrence of the specified element from the specified array.
        * @param {*} array the array in which to search element.
        * @param {Object} item the element to search.
        * @param {function(Object,Object):boolean=} equalsFunction optional function to
        * check equality between 2 elements.
        * @return {boolean} true if the array changed after this call.
        */
        function remove(array, item, equalsFunction) {
            var index = arrays.indexOf(array, item, equalsFunction);
            if (index < 0) {
                return false;
            }
            array.splice(index, 1);
            return true;
        }
        arrays.remove = remove;

        /**
        * Returns the number of elements in the specified array equal
        * to the specified object.
        * @param {Array} array the array in which to determine the frequency of the element.
        * @param {Object} item the element whose frequency is to be determined.
        * @param {function(Object,Object):boolean=} equalsFunction optional function used to
        * check equality between 2 elements.
        * @return {number} the number of elements in the specified array
        * equal to the specified object.
        */
        function frequency(array, item, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;
            var length = array.length;
            var freq = 0;
            for (var i = 0; i < length; i++) {
                if (equals(array[i], item)) {
                    freq++;
                }
            }
            return freq;
        }
        arrays.frequency = frequency;

        /**
        * Returns true if the two specified arrays are equal to one another.
        * Two arrays are considered equal if both arrays contain the same number
        * of elements, and all corresponding pairs of elements in the two
        * arrays are equal and are in the same order.
        * @param {Array} array1 one array to be tested for equality.
        * @param {Array} array2 the other array to be tested for equality.
        * @param {function(Object,Object):boolean=} equalsFunction optional function used to
        * check equality between elemements in the arrays.
        * @return {boolean} true if the two arrays are equal
        */
        function equals(array1, array2, equalsFunction) {
            var equals = equalsFunction || collections.defaultEquals;

            if (array1.length !== array2.length) {
                return false;
            }
            var length = array1.length;
            for (var i = 0; i < length; i++) {
                if (!equals(array1[i], array2[i])) {
                    return false;
                }
            }
            return true;
        }
        arrays.equals = equals;

        /**
        * Returns shallow a copy of the specified array.
        * @param {*} array the array to copy.
        * @return {Array} a copy of the specified array
        */
        function copy(array) {
            return array.concat();
        }
        arrays.copy = copy;

        /**
        * Swaps the elements at the specified positions in the specified array.
        * @param {Array} array The array in which to swap elements.
        * @param {number} i the index of one element to be swapped.
        * @param {number} j the index of the other element to be swapped.
        * @return {boolean} true if the array is defined and the indexes are valid.
        */
        function swap(array, i, j) {
            if (i < 0 || i >= array.length || j < 0 || j >= array.length) {
                return false;
            }
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return true;
        }
        arrays.swap = swap;

        function toString(array) {
            return '[' + array.toString() + ']';
        }
        arrays.toString = toString;

        /**
        * Executes the provided function once for each element present in this array
        * starting from index 0 to length - 1.
        * @param {Array} array The array in which to iterate.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        function forEach(array, callback) {
            var lenght = array.length;
            for (var i = 0; i < lenght; i++) {
                if (callback(array[i]) === false) {
                    return;
                }
            }
        }
        arrays.forEach = forEach;
    })(collections.arrays || (collections.arrays = {}));
    var arrays = collections.arrays;

    

    var LinkedList = (function () {
        /**
        * Creates an empty Linked List.
        * @class A linked list is a data structure consisting of a group of nodes
        * which together represent a sequence.
        * @constructor
        */
        function LinkedList() {
            /**
            * First node in the list
            * @type {Object}
            * @private
            */
            this.firstNode = null;
            /**
            * Last node in the list
            * @type {Object}
            * @private
            */
            this.lastNode = null;
            /**
            * Number of elements in the list
            * @type {number}
            * @private
            */
            this.nElements = 0;
        }
        /**
        * Adds an element to this list.
        * @param {Object} item element to be added.
        * @param {number=} index optional index to add the element. If no index is specified
        * the element is added to the end of this list.
        * @return {boolean} true if the element was added or false if the index is invalid
        * or if the element is undefined.
        */
        LinkedList.prototype.add = function (item, index) {
            if (collections.isUndefined(index)) {
                index = this.nElements;
            }
            if (index < 0 || index > this.nElements || collections.isUndefined(item)) {
                return false;
            }
            var newNode = this.createNode(item);
            if (this.nElements === 0) {
                // First node in the list.
                this.firstNode = newNode;
                this.lastNode = newNode;
            } else if (index === this.nElements) {
                // Insert at the end.
                this.lastNode.next = newNode;
                this.lastNode = newNode;
            } else if (index === 0) {
                // Change first node.
                newNode.next = this.firstNode;
                this.firstNode = newNode;
            } else {
                var prev = this.nodeAtIndex(index - 1);
                newNode.next = prev.next;
                prev.next = newNode;
            }
            this.nElements++;
            return true;
        };

        /**
        * Returns the first element in this list.
        * @return {*} the first element of the list or undefined if the list is
        * empty.
        */
        LinkedList.prototype.first = function () {
            if (this.firstNode !== null) {
                return this.firstNode.element;
            }
            return undefined;
        };

        /**
        * Returns the last element in this list.
        * @return {*} the last element in the list or undefined if the list is
        * empty.
        */
        LinkedList.prototype.last = function () {
            if (this.lastNode !== null) {
                return this.lastNode.element;
            }
            return undefined;
        };

        /**
        * Returns the element at the specified position in this list.
        * @param {number} index desired index.
        * @return {*} the element at the given index or undefined if the index is
        * out of bounds.
        */
        LinkedList.prototype.elementAtIndex = function (index) {
            var node = this.nodeAtIndex(index);
            if (node === null) {
                return undefined;
            }
            return node.element;
        };

        /**
        * Returns the index in this list of the first occurrence of the
        * specified element, or -1 if the List does not contain this element.
        * <p>If the elements inside this list are
        * not comparable with the === operator a custom equals function should be
        * provided to perform searches, the function must receive two arguments and
        * return true if they are equal, false otherwise. Example:</p>
        *
        * <pre>
        * var petsAreEqualByName = function(pet1, pet2) {
        *  return pet1.name === pet2.name;
        * }
        * </pre>
        * @param {Object} item element to search for.
        * @param {function(Object,Object):boolean=} equalsFunction Optional
        * function used to check if two elements are equal.
        * @return {number} the index in this list of the first occurrence
        * of the specified element, or -1 if this list does not contain the
        * element.
        */
        LinkedList.prototype.indexOf = function (item, equalsFunction) {
            var equalsF = equalsFunction || collections.defaultEquals;
            if (collections.isUndefined(item)) {
                return -1;
            }
            var currentNode = this.firstNode;
            var index = 0;
            while (currentNode !== null) {
                if (equalsF(currentNode.element, item)) {
                    return index;
                }
                index++;
                currentNode = currentNode.next;
            }
            return -1;
        };

        /**
        * Returns true if this list contains the specified element.
        * <p>If the elements inside the list are
        * not comparable with the === operator a custom equals function should be
        * provided to perform searches, the function must receive two arguments and
        * return true if they are equal, false otherwise. Example:</p>
        *
        * <pre>
        * var petsAreEqualByName = function(pet1, pet2) {
        *  return pet1.name === pet2.name;
        * }
        * </pre>
        * @param {Object} item element to search for.
        * @param {function(Object,Object):boolean=} equalsFunction Optional
        * function used to check if two elements are equal.
        * @return {boolean} true if this list contains the specified element, false
        * otherwise.
        */
        LinkedList.prototype.contains = function (item, equalsFunction) {
            return (this.indexOf(item, equalsFunction) >= 0);
        };

        /**
        * Removes the first occurrence of the specified element in this list.
        * <p>If the elements inside the list are
        * not comparable with the === operator a custom equals function should be
        * provided to perform searches, the function must receive two arguments and
        * return true if they are equal, false otherwise. Example:</p>
        *
        * <pre>
        * var petsAreEqualByName = function(pet1, pet2) {
        *  return pet1.name === pet2.name;
        * }
        * </pre>
        * @param {Object} item element to be removed from this list, if present.
        * @return {boolean} true if the list contained the specified element.
        */
        LinkedList.prototype.remove = function (item, equalsFunction) {
            var equalsF = equalsFunction || collections.defaultEquals;
            if (this.nElements < 1 || collections.isUndefined(item)) {
                return false;
            }
            var previous = null;
            var currentNode = this.firstNode;

            while (currentNode !== null) {
                if (equalsF(currentNode.element, item)) {
                    if (currentNode === this.firstNode) {
                        this.firstNode = this.firstNode.next;
                        if (currentNode === this.lastNode) {
                            this.lastNode = null;
                        }
                    } else if (currentNode === this.lastNode) {
                        this.lastNode = previous;
                        previous.next = currentNode.next;
                        currentNode.next = null;
                    } else {
                        previous.next = currentNode.next;
                        currentNode.next = null;
                    }
                    this.nElements--;
                    return true;
                }
                previous = currentNode;
                currentNode = currentNode.next;
            }
            return false;
        };

        /**
        * Removes all of the elements from this list.
        */
        LinkedList.prototype.clear = function () {
            this.firstNode = null;
            this.lastNode = null;
            this.nElements = 0;
        };

        /**
        * Returns true if this list is equal to the given list.
        * Two lists are equal if they have the same elements in the same order.
        * @param {LinkedList} other the other list.
        * @param {function(Object,Object):boolean=} equalsFunction optional
        * function used to check if two elements are equal. If the elements in the lists
        * are custom objects you should provide a function, otherwise
        * the === operator is used to check equality between elements.
        * @return {boolean} true if this list is equal to the given list.
        */
        LinkedList.prototype.equals = function (other, equalsFunction) {
            var eqF = equalsFunction || collections.defaultEquals;
            if (!(other instanceof collections.LinkedList)) {
                return false;
            }
            if (this.size() !== other.size()) {
                return false;
            }
            return this.equalsAux(this.firstNode, other.firstNode, eqF);
        };

        /**
        * @private
        */
        LinkedList.prototype.equalsAux = function (n1, n2, eqF) {
            while (n1 !== null) {
                if (!eqF(n1.element, n2.element)) {
                    return false;
                }
                n1 = n1.next;
                n2 = n2.next;
            }
            return true;
        };

        /**
        * Removes the element at the specified position in this list.
        * @param {number} index given index.
        * @return {*} removed element or undefined if the index is out of bounds.
        */
        LinkedList.prototype.removeElementAtIndex = function (index) {
            if (index < 0 || index >= this.nElements) {
                return undefined;
            }
            var element;
            if (this.nElements === 1) {
                //First node in the list.
                element = this.firstNode.element;
                this.firstNode = null;
                this.lastNode = null;
            } else {
                var previous = this.nodeAtIndex(index - 1);
                if (previous === null) {
                    element = this.firstNode.element;
                    this.firstNode = this.firstNode.next;
                } else if (previous.next === this.lastNode) {
                    element = this.lastNode.element;
                    this.lastNode = previous;
                }
                if (previous !== null) {
                    element = previous.next.element;
                    previous.next = previous.next.next;
                }
            }
            this.nElements--;
            return element;
        };

        /**
        * Executes the provided function once for each element present in this list in order.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        LinkedList.prototype.forEach = function (callback) {
            var currentNode = this.firstNode;
            while (currentNode !== null) {
                if (callback(currentNode.element) === false) {
                    break;
                }
                currentNode = currentNode.next;
            }
        };

        /**
        * Reverses the order of the elements in this linked list (makes the last
        * element first, and the first element last).
        */
        LinkedList.prototype.reverse = function () {
            var previous = null;
            var current = this.firstNode;
            var temp = null;
            while (current !== null) {
                temp = current.next;
                current.next = previous;
                previous = current;
                current = temp;
            }
            temp = this.firstNode;
            this.firstNode = this.lastNode;
            this.lastNode = temp;
        };

        /**
        * Returns an array containing all of the elements in this list in proper
        * sequence.
        * @return {Array.<*>} an array containing all of the elements in this list,
        * in proper sequence.
        */
        LinkedList.prototype.toArray = function () {
            var array = [];
            var currentNode = this.firstNode;
            while (currentNode !== null) {
                array.push(currentNode.element);
                currentNode = currentNode.next;
            }
            return array;
        };

        /**
        * Returns the number of elements in this list.
        * @return {number} the number of elements in this list.
        */
        LinkedList.prototype.size = function () {
            return this.nElements;
        };

        /**
        * Returns true if this list contains no elements.
        * @return {boolean} true if this list contains no elements.
        */
        LinkedList.prototype.isEmpty = function () {
            return this.nElements <= 0;
        };

        LinkedList.prototype.toString = function () {
            return collections.arrays.toString(this.toArray());
        };

        /**
        * @private
        */
        LinkedList.prototype.nodeAtIndex = function (index) {
            if (index < 0 || index >= this.nElements) {
                return null;
            }
            if (index === (this.nElements - 1)) {
                return this.lastNode;
            }
            var node = this.firstNode;
            for (var i = 0; i < index; i++) {
                node = node.next;
            }
            return node;
        };

        /**
        * @private
        */
        LinkedList.prototype.createNode = function (item) {
            return {
                element: item,
                next: null
            };
        };
        return LinkedList;
    })();
    collections.LinkedList = LinkedList;

    

    var Dictionary = (function () {
        /**
        * Creates an empty dictionary.
        * @class <p>Dictionaries map keys to values; each key can map to at most one value.
        * This implementation accepts any kind of objects as keys.</p>
        *
        * <p>If the keys are custom objects a function which converts keys to unique
        * strings must be provided. Example:</p>
        * <pre>
        * function petToString(pet) {
        *  return pet.name;
        * }
        * </pre>
        * @constructor
        * @param {function(Object):string=} toStrFunction optional function used
        * to convert keys to strings. If the keys aren't strings or if toString()
        * is not appropriate, a custom function which receives a key and returns a
        * unique string must be provided.
        */
        function Dictionary(toStrFunction) {
            this.table = {};
            this.nElements = 0;
            this.toStr = toStrFunction || collections.defaultToString;
        }
        /**
        * Returns the value to which this dictionary maps the specified key.
        * Returns undefined if this dictionary contains no mapping for this key.
        * @param {Object} key key whose associated value is to be returned.
        * @return {*} the value to which this dictionary maps the specified key or
        * undefined if the map contains no mapping for this key.
        */
        Dictionary.prototype.getValue = function (key) {
            var pair = this.table[this.toStr(key)];
            if (collections.isUndefined(pair)) {
                return undefined;
            }
            return pair.value;
        };

        /**
        * Associates the specified value with the specified key in this dictionary.
        * If the dictionary previously contained a mapping for this key, the old
        * value is replaced by the specified value.
        * @param {Object} key key with which the specified value is to be
        * associated.
        * @param {Object} value value to be associated with the specified key.
        * @return {*} previous value associated with the specified key, or undefined if
        * there was no mapping for the key or if the key/value are undefined.
        */
        Dictionary.prototype.setValue = function (key, value) {
            if (collections.isUndefined(key) || collections.isUndefined(value)) {
                return undefined;
            }

            var ret;
            var k = this.toStr(key);
            var previousElement = this.table[k];
            if (collections.isUndefined(previousElement)) {
                this.nElements++;
                ret = undefined;
            } else {
                ret = previousElement.value;
            }
            this.table[k] = {
                key: key,
                value: value
            };
            return ret;
        };

        /**
        * Removes the mapping for this key from this dictionary if it is present.
        * @param {Object} key key whose mapping is to be removed from the
        * dictionary.
        * @return {*} previous value associated with specified key, or undefined if
        * there was no mapping for key.
        */
        Dictionary.prototype.remove = function (key) {
            var k = this.toStr(key);
            var previousElement = this.table[k];
            if (!collections.isUndefined(previousElement)) {
                delete this.table[k];
                this.nElements--;
                return previousElement.value;
            }
            return undefined;
        };

        /**
        * Returns an array containing all of the keys in this dictionary.
        * @return {Array} an array containing all of the keys in this dictionary.
        */
        Dictionary.prototype.keys = function () {
            var array = [];
            for (var name in this.table) {
                if (this.table.hasOwnProperty(name)) {
                    var pair = this.table[name];
                    array.push(pair.key);
                }
            }
            return array;
        };

        /**
        * Returns an array containing all of the values in this dictionary.
        * @return {Array} an array containing all of the values in this dictionary.
        */
        Dictionary.prototype.values = function () {
            var array = [];
            for (var name in this.table) {
                if (this.table.hasOwnProperty(name)) {
                    var pair = this.table[name];
                    array.push(pair.value);
                }
            }
            return array;
        };

        /**
        * Executes the provided function once for each key-value pair
        * present in this dictionary.
        * @param {function(Object,Object):*} callback function to execute, it is
        * invoked with two arguments: key and value. To break the iteration you can
        * optionally return false.
        */
        Dictionary.prototype.forEach = function (callback) {
            for (var name in this.table) {
                if (this.table.hasOwnProperty(name)) {
                    var pair = this.table[name];
                    var ret = callback(pair.key, pair.value);
                    if (ret === false) {
                        return;
                    }
                }
            }
        };

        /**
        * Returns true if this dictionary contains a mapping for the specified key.
        * @param {Object} key key whose presence in this dictionary is to be
        * tested.
        * @return {boolean} true if this dictionary contains a mapping for the
        * specified key.
        */
        Dictionary.prototype.containsKey = function (key) {
            return !collections.isUndefined(this.getValue(key));
        };

        /**
        * Removes all mappings from this dictionary.
        * @this {collections.Dictionary}
        */
        Dictionary.prototype.clear = function () {
            this.table = {};
            this.nElements = 0;
        };

        /**
        * Returns the number of keys in this dictionary.
        * @return {number} the number of key-value mappings in this dictionary.
        */
        Dictionary.prototype.size = function () {
            return this.nElements;
        };

        /**
        * Returns true if this dictionary contains no mappings.
        * @return {boolean} true if this dictionary contains no mappings.
        */
        Dictionary.prototype.isEmpty = function () {
            return this.nElements <= 0;
        };

        Dictionary.prototype.toString = function () {
            var toret = "{";
            this.forEach(function (k, v) {
                toret = toret + "\n\t" + k.toString() + " : " + v.toString();
            });
            return toret + "\n}";
        };
        return Dictionary;
    })();
    collections.Dictionary = Dictionary;

    // /**
    //  * Returns true if this dictionary is equal to the given dictionary.
    //  * Two dictionaries are equal if they contain the same mappings.
    //  * @param {collections.Dictionary} other the other dictionary.
    //  * @param {function(Object,Object):boolean=} valuesEqualFunction optional
    //  * function used to check if two values are equal.
    //  * @return {boolean} true if this dictionary is equal to the given dictionary.
    //  */
    // collections.Dictionary.prototype.equals = function(other,valuesEqualFunction) {
    // 	var eqF = valuesEqualFunction || collections.defaultEquals;
    // 	if(!(other instanceof collections.Dictionary)){
    // 		return false;
    // 	}
    // 	if(this.size() !== other.size()){
    // 		return false;
    // 	}
    // 	return this.equalsAux(this.firstNode,other.firstNode,eqF);
    // }
    var MultiDictionary = (function () {
        /**
        * Creates an empty multi dictionary.
        * @class <p>A multi dictionary is a special kind of dictionary that holds
        * multiple values against each key. Setting a value into the dictionary will
        * add the value to an array at that key. Getting a key will return an array,
        * holding all the values set to that key.
        * You can configure to allow duplicates in the values.
        * This implementation accepts any kind of objects as keys.</p>
        *
        * <p>If the keys are custom objects a function which converts keys to strings must be
        * provided. Example:</p>
        *
        * <pre>
        * function petToString(pet) {
        *  return pet.name;
        * }
        * </pre>
        * <p>If the values are custom objects a function to check equality between values
        * must be provided. Example:</p>
        *
        * <pre>
        * function petsAreEqualByAge(pet1,pet2) {
        *  return pet1.age===pet2.age;
        * }
        * </pre>
        * @constructor
        * @param {function(Object):string=} toStrFunction optional function
        * to convert keys to strings. If the keys aren't strings or if toString()
        * is not appropriate, a custom function which receives a key and returns a
        * unique string must be provided.
        * @param {function(Object,Object):boolean=} valuesEqualsFunction optional
        * function to check if two values are equal.
        *
        */
        function MultiDictionary(toStrFunction, valuesEqualsFunction, allowDuplicateValues) {
            if (typeof allowDuplicateValues === "undefined") { allowDuplicateValues = false; }
            this.dict = new Dictionary(toStrFunction);
            this.equalsF = valuesEqualsFunction || collections.defaultEquals;
            this.allowDuplicate = allowDuplicateValues;
        }
        /**
        * Returns an array holding the values to which this dictionary maps
        * the specified key.
        * Returns an empty array if this dictionary contains no mappings for this key.
        * @param {Object} key key whose associated values are to be returned.
        * @return {Array} an array holding the values to which this dictionary maps
        * the specified key.
        */
        MultiDictionary.prototype.getValue = function (key) {
            var values = this.dict.getValue(key);
            if (collections.isUndefined(values)) {
                return [];
            }
            return collections.arrays.copy(values);
        };

        /**
        * Adds the value to the array associated with the specified key, if
        * it is not already present.
        * @param {Object} key key with which the specified value is to be
        * associated.
        * @param {Object} value the value to add to the array at the key
        * @return {boolean} true if the value was not already associated with that key.
        */
        MultiDictionary.prototype.setValue = function (key, value) {
            if (collections.isUndefined(key) || collections.isUndefined(value)) {
                return false;
            }
            if (!this.containsKey(key)) {
                this.dict.setValue(key, [value]);
                return true;
            }
            var array = this.dict.getValue(key);
            if (!this.allowDuplicate) {
                if (collections.arrays.contains(array, value, this.equalsF)) {
                    return false;
                }
            }
            array.push(value);
            return true;
        };

        /**
        * Removes the specified values from the array of values associated with the
        * specified key. If a value isn't given, all values associated with the specified
        * key are removed.
        * @param {Object} key key whose mapping is to be removed from the
        * dictionary.
        * @param {Object=} value optional argument to specify the value to remove
        * from the array associated with the specified key.
        * @return {*} true if the dictionary changed, false if the key doesn't exist or
        * if the specified value isn't associated with the specified key.
        */
        MultiDictionary.prototype.remove = function (key, value) {
            if (collections.isUndefined(value)) {
                var v = this.dict.remove(key);
                if (collections.isUndefined(v)) {
                    return false;
                }
                return true;
            }
            var array = this.dict.getValue(key);
            if (collections.arrays.remove(array, value, this.equalsF)) {
                if (array.length === 0) {
                    this.dict.remove(key);
                }
                return true;
            }
            return false;
        };

        /**
        * Returns an array containing all of the keys in this dictionary.
        * @return {Array} an array containing all of the keys in this dictionary.
        */
        MultiDictionary.prototype.keys = function () {
            return this.dict.keys();
        };

        /**
        * Returns an array containing all of the values in this dictionary.
        * @return {Array} an array containing all of the values in this dictionary.
        */
        MultiDictionary.prototype.values = function () {
            var values = this.dict.values();
            var array = [];
            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                for (var j = 0; j < v.length; j++) {
                    array.push(v[j]);
                }
            }
            return array;
        };

        /**
        * Returns true if this dictionary at least one value associatted the specified key.
        * @param {Object} key key whose presence in this dictionary is to be
        * tested.
        * @return {boolean} true if this dictionary at least one value associatted
        * the specified key.
        */
        MultiDictionary.prototype.containsKey = function (key) {
            return this.dict.containsKey(key);
        };

        /**
        * Removes all mappings from this dictionary.
        */
        MultiDictionary.prototype.clear = function () {
            return this.dict.clear();
        };

        /**
        * Returns the number of keys in this dictionary.
        * @return {number} the number of key-value mappings in this dictionary.
        */
        MultiDictionary.prototype.size = function () {
            return this.dict.size();
        };

        /**
        * Returns true if this dictionary contains no mappings.
        * @return {boolean} true if this dictionary contains no mappings.
        */
        MultiDictionary.prototype.isEmpty = function () {
            return this.dict.isEmpty();
        };
        return MultiDictionary;
    })();
    collections.MultiDictionary = MultiDictionary;

    var Heap = (function () {
        /**
        * Creates an empty Heap.
        * @class
        * <p>A heap is a binary tree, where the nodes maintain the heap property:
        * each node is smaller than each of its children and therefore a MinHeap
        * This implementation uses an array to store elements.</p>
        * <p>If the inserted elements are custom objects a compare function must be provided,
        *  at construction time, otherwise the <=, === and >= operators are
        * used to compare elements. Example:</p>
        *
        * <pre>
        * function compare(a, b) {
        *  if (a is less than b by some ordering criterion) {
        *     return -1;
        *  } if (a is greater than b by the ordering criterion) {
        *     return 1;
        *  }
        *  // a must be equal to b
        *  return 0;
        * }
        * </pre>
        *
        * <p>If a Max-Heap is wanted (greater elements on top) you can a provide a
        * reverse compare function to accomplish that behavior. Example:</p>
        *
        * <pre>
        * function reverseCompare(a, b) {
        *  if (a is less than b by some ordering criterion) {
        *     return 1;
        *  } if (a is greater than b by the ordering criterion) {
        *     return -1;
        *  }
        *  // a must be equal to b
        *  return 0;
        * }
        * </pre>
        *
        * @constructor
        * @param {function(Object,Object):number=} compareFunction optional
        * function used to compare two elements. Must return a negative integer,
        * zero, or a positive integer as the first argument is less than, equal to,
        * or greater than the second.
        */
        function Heap(compareFunction) {
            /**
            * Array used to store the elements od the heap.
            * @type {Array.<Object>}
            * @private
            */
            this.data = [];
            this.compare = compareFunction || collections.defaultCompare;
        }
        /**
        * Returns the index of the left child of the node at the given index.
        * @param {number} nodeIndex The index of the node to get the left child
        * for.
        * @return {number} The index of the left child.
        * @private
        */
        Heap.prototype.leftChildIndex = function (nodeIndex) {
            return (2 * nodeIndex) + 1;
        };

        /**
        * Returns the index of the right child of the node at the given index.
        * @param {number} nodeIndex The index of the node to get the right child
        * for.
        * @return {number} The index of the right child.
        * @private
        */
        Heap.prototype.rightChildIndex = function (nodeIndex) {
            return (2 * nodeIndex) + 2;
        };

        /**
        * Returns the index of the parent of the node at the given index.
        * @param {number} nodeIndex The index of the node to get the parent for.
        * @return {number} The index of the parent.
        * @private
        */
        Heap.prototype.parentIndex = function (nodeIndex) {
            return Math.floor((nodeIndex - 1) / 2);
        };

        /**
        * Returns the index of the smaller child node (if it exists).
        * @param {number} leftChild left child index.
        * @param {number} rightChild right child index.
        * @return {number} the index with the minimum value or -1 if it doesn't
        * exists.
        * @private
        */
        Heap.prototype.minIndex = function (leftChild, rightChild) {
            if (rightChild >= this.data.length) {
                if (leftChild >= this.data.length) {
                    return -1;
                } else {
                    return leftChild;
                }
            } else {
                if (this.compare(this.data[leftChild], this.data[rightChild]) <= 0) {
                    return leftChild;
                } else {
                    return rightChild;
                }
            }
        };

        /**
        * Moves the node at the given index up to its proper place in the heap.
        * @param {number} index The index of the node to move up.
        * @private
        */
        Heap.prototype.siftUp = function (index) {
            var parent = this.parentIndex(index);
            while (index > 0 && this.compare(this.data[parent], this.data[index]) > 0) {
                collections.arrays.swap(this.data, parent, index);
                index = parent;
                parent = this.parentIndex(index);
            }
        };

        /**
        * Moves the node at the given index down to its proper place in the heap.
        * @param {number} nodeIndex The index of the node to move down.
        * @private
        */
        Heap.prototype.siftDown = function (nodeIndex) {
            //smaller child index
            var min = this.minIndex(this.leftChildIndex(nodeIndex), this.rightChildIndex(nodeIndex));

            while (min >= 0 && this.compare(this.data[nodeIndex], this.data[min]) > 0) {
                collections.arrays.swap(this.data, min, nodeIndex);
                nodeIndex = min;
                min = this.minIndex(this.leftChildIndex(nodeIndex), this.rightChildIndex(nodeIndex));
            }
        };

        /**
        * Retrieves but does not remove the root element of this heap.
        * @return {*} The value at the root of the heap. Returns undefined if the
        * heap is empty.
        */
        Heap.prototype.peek = function () {
            if (this.data.length > 0) {
                return this.data[0];
            } else {
                return undefined;
            }
        };

        /**
        * Adds the given element into the heap.
        * @param {*} element the element.
        * @return true if the element was added or fals if it is undefined.
        */
        Heap.prototype.add = function (element) {
            if (collections.isUndefined(element)) {
                return undefined;
            }
            this.data.push(element);
            this.siftUp(this.data.length - 1);
            return true;
        };

        /**
        * Retrieves and removes the root element of this heap.
        * @return {*} The value removed from the root of the heap. Returns
        * undefined if the heap is empty.
        */
        Heap.prototype.removeRoot = function () {
            if (this.data.length > 0) {
                var obj = this.data[0];
                this.data[0] = this.data[this.data.length - 1];
                this.data.splice(this.data.length - 1, 1);
                if (this.data.length > 0) {
                    this.siftDown(0);
                }
                return obj;
            }
            return undefined;
        };

        /**
        * Returns true if this heap contains the specified element.
        * @param {Object} element element to search for.
        * @return {boolean} true if this Heap contains the specified element, false
        * otherwise.
        */
        Heap.prototype.contains = function (element) {
            var equF = collections.compareToEquals(this.compare);
            return collections.arrays.contains(this.data, element, equF);
        };

        /**
        * Returns the number of elements in this heap.
        * @return {number} the number of elements in this heap.
        */
        Heap.prototype.size = function () {
            return this.data.length;
        };

        /**
        * Checks if this heap is empty.
        * @return {boolean} true if and only if this heap contains no items; false
        * otherwise.
        */
        Heap.prototype.isEmpty = function () {
            return this.data.length <= 0;
        };

        /**
        * Removes all of the elements from this heap.
        */
        Heap.prototype.clear = function () {
            this.data.length = 0;
        };

        /**
        * Executes the provided function once for each element present in this heap in
        * no particular order.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        Heap.prototype.forEach = function (callback) {
            collections.arrays.forEach(this.data, callback);
        };
        return Heap;
    })();
    collections.Heap = Heap;

    var Stack = (function () {
        /**
        * Creates an empty Stack.
        * @class A Stack is a Last-In-First-Out (LIFO) data structure, the last
        * element added to the stack will be the first one to be removed. This
        * implementation uses a linked list as a container.
        * @constructor
        */
        function Stack() {
            this.list = new LinkedList();
        }
        /**
        * Pushes an item onto the top of this stack.
        * @param {Object} elem the element to be pushed onto this stack.
        * @return {boolean} true if the element was pushed or false if it is undefined.
        */
        Stack.prototype.push = function (elem) {
            return this.list.add(elem, 0);
        };

        /**
        * Pushes an item onto the top of this stack.
        * @param {Object} elem the element to be pushed onto this stack.
        * @return {boolean} true if the element was pushed or false if it is undefined.
        */
        Stack.prototype.add = function (elem) {
            return this.list.add(elem, 0);
        };

        /**
        * Removes the object at the top of this stack and returns that object.
        * @return {*} the object at the top of this stack or undefined if the
        * stack is empty.
        */
        Stack.prototype.pop = function () {
            return this.list.removeElementAtIndex(0);
        };

        /**
        * Looks at the object at the top of this stack without removing it from the
        * stack.
        * @return {*} the object at the top of this stack or undefined if the
        * stack is empty.
        */
        Stack.prototype.peek = function () {
            return this.list.first();
        };

        /**
        * Returns the number of elements in this stack.
        * @return {number} the number of elements in this stack.
        */
        Stack.prototype.size = function () {
            return this.list.size();
        };

        /**
        * Returns true if this stack contains the specified element.
        * <p>If the elements inside this stack are
        * not comparable with the === operator, a custom equals function should be
        * provided to perform searches, the function must receive two arguments and
        * return true if they are equal, false otherwise. Example:</p>
        *
        * <pre>
        * var petsAreEqualByName (pet1, pet2) {
        *  return pet1.name === pet2.name;
        * }
        * </pre>
        * @param {Object} elem element to search for.
        * @param {function(Object,Object):boolean=} equalsFunction optional
        * function to check if two elements are equal.
        * @return {boolean} true if this stack contains the specified element,
        * false otherwise.
        */
        Stack.prototype.contains = function (elem, equalsFunction) {
            return this.list.contains(elem, equalsFunction);
        };

        /**
        * Checks if this stack is empty.
        * @return {boolean} true if and only if this stack contains no items; false
        * otherwise.
        */
        Stack.prototype.isEmpty = function () {
            return this.list.isEmpty();
        };

        /**
        * Removes all of the elements from this stack.
        */
        Stack.prototype.clear = function () {
            this.list.clear();
        };

        /**
        * Executes the provided function once for each element present in this stack in
        * LIFO order.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        Stack.prototype.forEach = function (callback) {
            this.list.forEach(callback);
        };
        return Stack;
    })();
    collections.Stack = Stack;

    var Queue = (function () {
        /**
        * Creates an empty queue.
        * @class A queue is a First-In-First-Out (FIFO) data structure, the first
        * element added to the queue will be the first one to be removed. This
        * implementation uses a linked list as a container.
        * @constructor
        */
        function Queue() {
            this.list = new LinkedList();
        }
        /**
        * Inserts the specified element into the end of this queue.
        * @param {Object} elem the element to insert.
        * @return {boolean} true if the element was inserted, or false if it is undefined.
        */
        Queue.prototype.enqueue = function (elem) {
            return this.list.add(elem);
        };

        /**
        * Inserts the specified element into the end of this queue.
        * @param {Object} elem the element to insert.
        * @return {boolean} true if the element was inserted, or false if it is undefined.
        */
        Queue.prototype.add = function (elem) {
            return this.list.add(elem);
        };

        /**
        * Retrieves and removes the head of this queue.
        * @return {*} the head of this queue, or undefined if this queue is empty.
        */
        Queue.prototype.dequeue = function () {
            if (this.list.size() !== 0) {
                var el = this.list.first();
                this.list.removeElementAtIndex(0);
                return el;
            }
            return undefined;
        };

        /**
        * Retrieves, but does not remove, the head of this queue.
        * @return {*} the head of this queue, or undefined if this queue is empty.
        */
        Queue.prototype.peek = function () {
            if (this.list.size() !== 0) {
                return this.list.first();
            }
            return undefined;
        };

        /**
        * Returns the number of elements in this queue.
        * @return {number} the number of elements in this queue.
        */
        Queue.prototype.size = function () {
            return this.list.size();
        };

        /**
        * Returns true if this queue contains the specified element.
        * <p>If the elements inside this stack are
        * not comparable with the === operator, a custom equals function should be
        * provided to perform searches, the function must receive two arguments and
        * return true if they are equal, false otherwise. Example:</p>
        *
        * <pre>
        * var petsAreEqualByName (pet1, pet2) {
        *  return pet1.name === pet2.name;
        * }
        * </pre>
        * @param {Object} elem element to search for.
        * @param {function(Object,Object):boolean=} equalsFunction optional
        * function to check if two elements are equal.
        * @return {boolean} true if this queue contains the specified element,
        * false otherwise.
        */
        Queue.prototype.contains = function (elem, equalsFunction) {
            return this.list.contains(elem, equalsFunction);
        };

        /**
        * Checks if this queue is empty.
        * @return {boolean} true if and only if this queue contains no items; false
        * otherwise.
        */
        Queue.prototype.isEmpty = function () {
            return this.list.size() <= 0;
        };

        /**
        * Removes all of the elements from this queue.
        */
        Queue.prototype.clear = function () {
            this.list.clear();
        };

        /**
        * Executes the provided function once for each element present in this queue in
        * FIFO order.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        Queue.prototype.forEach = function (callback) {
            this.list.forEach(callback);
        };
        return Queue;
    })();
    collections.Queue = Queue;

    var PriorityQueue = (function () {
        /**
        * Creates an empty priority queue.
        * @class <p>In a priority queue each element is associated with a "priority",
        * elements are dequeued in highest-priority-first order (the elements with the
        * highest priority are dequeued first). Priority Queues are implemented as heaps.
        * If the inserted elements are custom objects a compare function must be provided,
        * otherwise the <=, === and >= operators are used to compare object priority.</p>
        * <pre>
        * function compare(a, b) {
        *  if (a is less than b by some ordering criterion) {
        *     return -1;
        *  } if (a is greater than b by the ordering criterion) {
        *     return 1;
        *  }
        *  // a must be equal to b
        *  return 0;
        * }
        * </pre>
        * @constructor
        * @param {function(Object,Object):number=} compareFunction optional
        * function used to compare two element priorities. Must return a negative integer,
        * zero, or a positive integer as the first argument is less than, equal to,
        * or greater than the second.
        */
        function PriorityQueue(compareFunction) {
            this.heap = new Heap(collections.reverseCompareFunction(compareFunction));
        }
        /**
        * Inserts the specified element into this priority queue.
        * @param {Object} element the element to insert.
        * @return {boolean} true if the element was inserted, or false if it is undefined.
        */
        PriorityQueue.prototype.enqueue = function (element) {
            return this.heap.add(element);
        };

        /**
        * Inserts the specified element into this priority queue.
        * @param {Object} element the element to insert.
        * @return {boolean} true if the element was inserted, or false if it is undefined.
        */
        PriorityQueue.prototype.add = function (element) {
            return this.heap.add(element);
        };

        /**
        * Retrieves and removes the highest priority element of this queue.
        * @return {*} the the highest priority element of this queue,
        *  or undefined if this queue is empty.
        */
        PriorityQueue.prototype.dequeue = function () {
            if (this.heap.size() !== 0) {
                var el = this.heap.peek();
                this.heap.removeRoot();
                return el;
            }
            return undefined;
        };

        /**
        * Retrieves, but does not remove, the highest priority element of this queue.
        * @return {*} the highest priority element of this queue, or undefined if this queue is empty.
        */
        PriorityQueue.prototype.peek = function () {
            return this.heap.peek();
        };

        /**
        * Returns true if this priority queue contains the specified element.
        * @param {Object} element element to search for.
        * @return {boolean} true if this priority queue contains the specified element,
        * false otherwise.
        */
        PriorityQueue.prototype.contains = function (element) {
            return this.heap.contains(element);
        };

        /**
        * Checks if this priority queue is empty.
        * @return {boolean} true if and only if this priority queue contains no items; false
        * otherwise.
        */
        PriorityQueue.prototype.isEmpty = function () {
            return this.heap.isEmpty();
        };

        /**
        * Returns the number of elements in this priority queue.
        * @return {number} the number of elements in this priority queue.
        */
        PriorityQueue.prototype.size = function () {
            return this.heap.size();
        };

        /**
        * Removes all of the elements from this priority queue.
        */
        PriorityQueue.prototype.clear = function () {
            this.heap.clear();
        };

        /**
        * Executes the provided function once for each element present in this queue in
        * no particular order.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        PriorityQueue.prototype.forEach = function (callback) {
            this.heap.forEach(callback);
        };
        return PriorityQueue;
    })();
    collections.PriorityQueue = PriorityQueue;

    var Set = (function () {
        /**
        * Creates an empty set.
        * @class <p>A set is a data structure that contains no duplicate items.</p>
        * <p>If the inserted elements are custom objects a function
        * which converts elements to strings must be provided. Example:</p>
        *
        * <pre>
        * function petToString(pet) {
        *  return pet.name;
        * }
        * </pre>
        *
        * @constructor
        * @param {function(Object):string=} toStringFunction optional function used
        * to convert elements to strings. If the elements aren't strings or if toString()
        * is not appropriate, a custom function which receives a onject and returns a
        * unique string must be provided.
        */
        function Set(toStringFunction) {
            this.dictionary = new Dictionary(toStringFunction);
        }
        /**
        * Returns true if this set contains the specified element.
        * @param {Object} element element to search for.
        * @return {boolean} true if this set contains the specified element,
        * false otherwise.
        */
        Set.prototype.contains = function (element) {
            return this.dictionary.containsKey(element);
        };

        /**
        * Adds the specified element to this set if it is not already present.
        * @param {Object} element the element to insert.
        * @return {boolean} true if this set did not already contain the specified element.
        */
        Set.prototype.add = function (element) {
            if (this.contains(element) || collections.isUndefined(element)) {
                return false;
            } else {
                this.dictionary.setValue(element, element);
                return true;
            }
        };

        /**
        * Performs an intersecion between this an another set.
        * Removes all values that are not present this set and the given set.
        * @param {collections.Set} otherSet other set.
        */
        Set.prototype.intersection = function (otherSet) {
            var set = this;
            this.forEach(function (element) {
                if (!otherSet.contains(element)) {
                    set.remove(element);
                }
                return;
            });
        };

        /**
        * Performs a union between this an another set.
        * Adds all values from the given set to this set.
        * @param {collections.Set} otherSet other set.
        */
        Set.prototype.union = function (otherSet) {
            var set = this;
            otherSet.forEach(function (element) {
                set.add(element);
                return;
            });
        };

        /**
        * Performs a difference between this an another set.
        * Removes from this set all the values that are present in the given set.
        * @param {collections.Set} otherSet other set.
        */
        Set.prototype.difference = function (otherSet) {
            var set = this;
            otherSet.forEach(function (element) {
                set.remove(element);
                return;
            });
        };

        /**
        * Checks whether the given set contains all the elements in this set.
        * @param {collections.Set} otherSet other set.
        * @return {boolean} true if this set is a subset of the given set.
        */
        Set.prototype.isSubsetOf = function (otherSet) {
            if (this.size() > otherSet.size()) {
                return false;
            }

            var isSub = true;
            this.forEach(function (element) {
                if (!otherSet.contains(element)) {
                    isSub = false;
                    return false;
                }
            });
            return isSub;
        };

        /**
        * Removes the specified element from this set if it is present.
        * @return {boolean} true if this set contained the specified element.
        */
        Set.prototype.remove = function (element) {
            if (!this.contains(element)) {
                return false;
            } else {
                this.dictionary.remove(element);
                return true;
            }
        };

        /**
        * Executes the provided function once for each element
        * present in this set.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one arguments: the element. To break the iteration you can
        * optionally return false.
        */
        Set.prototype.forEach = function (callback) {
            this.dictionary.forEach(function (k, v) {
                return callback(v);
            });
        };

        /**
        * Returns an array containing all of the elements in this set in arbitrary order.
        * @return {Array} an array containing all of the elements in this set.
        */
        Set.prototype.toArray = function () {
            return this.dictionary.values();
        };

        /**
        * Returns true if this set contains no elements.
        * @return {boolean} true if this set contains no elements.
        */
        Set.prototype.isEmpty = function () {
            return this.dictionary.isEmpty();
        };

        /**
        * Returns the number of elements in this set.
        * @return {number} the number of elements in this set.
        */
        Set.prototype.size = function () {
            return this.dictionary.size();
        };

        /**
        * Removes all of the elements from this set.
        */
        Set.prototype.clear = function () {
            this.dictionary.clear();
        };

        /*
        * Provides a string representation for display
        */
        Set.prototype.toString = function () {
            return collections.arrays.toString(this.toArray());
        };
        return Set;
    })();
    collections.Set = Set;

    var Bag = (function () {
        /**
        * Creates an empty bag.
        * @class <p>A bag is a special kind of set in which members are
        * allowed to appear more than once.</p>
        * <p>If the inserted elements are custom objects a function
        * which converts elements to unique strings must be provided. Example:</p>
        *
        * <pre>
        * function petToString(pet) {
        *  return pet.name;
        * }
        * </pre>
        *
        * @constructor
        * @param {function(Object):string=} toStrFunction optional function used
        * to convert elements to strings. If the elements aren't strings or if toString()
        * is not appropriate, a custom function which receives an object and returns a
        * unique string must be provided.
        */
        function Bag(toStrFunction) {
            this.toStrF = toStrFunction || collections.defaultToString;
            this.dictionary = new Dictionary(this.toStrF);
            this.nElements = 0;
        }
        /**
        * Adds nCopies of the specified object to this bag.
        * @param {Object} element element to add.
        * @param {number=} nCopies the number of copies to add, if this argument is
        * undefined 1 copy is added.
        * @return {boolean} true unless element is undefined.
        */
        Bag.prototype.add = function (element, nCopies) {
            if (typeof nCopies === "undefined") { nCopies = 1; }
            if (collections.isUndefined(element) || nCopies <= 0) {
                return false;
            }

            if (!this.contains(element)) {
                var node = {
                    value: element,
                    copies: nCopies
                };
                this.dictionary.setValue(element, node);
            } else {
                this.dictionary.getValue(element).copies += nCopies;
            }
            this.nElements += nCopies;
            return true;
        };

        /**
        * Counts the number of copies of the specified object in this bag.
        * @param {Object} element the object to search for..
        * @return {number} the number of copies of the object, 0 if not found
        */
        Bag.prototype.count = function (element) {
            if (!this.contains(element)) {
                return 0;
            } else {
                return this.dictionary.getValue(element).copies;
            }
        };

        /**
        * Returns true if this bag contains the specified element.
        * @param {Object} element element to search for.
        * @return {boolean} true if this bag contains the specified element,
        * false otherwise.
        */
        Bag.prototype.contains = function (element) {
            return this.dictionary.containsKey(element);
        };

        /**
        * Removes nCopies of the specified object to this bag.
        * If the number of copies to remove is greater than the actual number
        * of copies in the Bag, all copies are removed.
        * @param {Object} element element to remove.
        * @param {number=} nCopies the number of copies to remove, if this argument is
        * undefined 1 copy is removed.
        * @return {boolean} true if at least 1 element was removed.
        */
        Bag.prototype.remove = function (element, nCopies) {
            if (typeof nCopies === "undefined") { nCopies = 1; }
            if (collections.isUndefined(element) || nCopies <= 0) {
                return false;
            }

            if (!this.contains(element)) {
                return false;
            } else {
                var node = this.dictionary.getValue(element);
                if (nCopies > node.copies) {
                    this.nElements -= node.copies;
                } else {
                    this.nElements -= nCopies;
                }
                node.copies -= nCopies;
                if (node.copies <= 0) {
                    this.dictionary.remove(element);
                }
                return true;
            }
        };

        /**
        * Returns an array containing all of the elements in this big in arbitrary order,
        * including multiple copies.
        * @return {Array} an array containing all of the elements in this bag.
        */
        Bag.prototype.toArray = function () {
            var a = [];
            var values = this.dictionary.values();
            var vl = values.length;
            for (var i = 0; i < vl; i++) {
                var node = values[i];
                var element = node.value;
                var copies = node.copies;
                for (var j = 0; j < copies; j++) {
                    a.push(element);
                }
            }
            return a;
        };

        /**
        * Returns a set of unique elements in this bag.
        * @return {collections.Set<T>} a set of unique elements in this bag.
        */
        Bag.prototype.toSet = function () {
            var toret = new Set(this.toStrF);
            var elements = this.dictionary.values();
            var l = elements.length;
            for (var i = 0; i < l; i++) {
                var value = elements[i].value;
                toret.add(value);
            }
            return toret;
        };

        /**
        * Executes the provided function once for each element
        * present in this bag, including multiple copies.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element. To break the iteration you can
        * optionally return false.
        */
        Bag.prototype.forEach = function (callback) {
            this.dictionary.forEach(function (k, v) {
                var value = v.value;
                var copies = v.copies;
                for (var i = 0; i < copies; i++) {
                    if (callback(value) === false) {
                        return false;
                    }
                }
                return true;
            });
        };

        /**
        * Returns the number of elements in this bag.
        * @return {number} the number of elements in this bag.
        */
        Bag.prototype.size = function () {
            return this.nElements;
        };

        /**
        * Returns true if this bag contains no elements.
        * @return {boolean} true if this bag contains no elements.
        */
        Bag.prototype.isEmpty = function () {
            return this.nElements === 0;
        };

        /**
        * Removes all of the elements from this bag.
        */
        Bag.prototype.clear = function () {
            this.nElements = 0;
            this.dictionary.clear();
        };
        return Bag;
    })();
    collections.Bag = Bag;

    
    var BSTree = (function () {
        /**
        * Creates an empty binary search tree.
        * @class <p>A binary search tree is a binary tree in which each
        * internal node stores an element such that the elements stored in the
        * left subtree are less than it and the elements
        * stored in the right subtree are greater.</p>
        * <p>Formally, a binary search tree is a node-based binary tree data structure which
        * has the following properties:</p>
        * <ul>
        * <li>The left subtree of a node contains only nodes with elements less
        * than the node's element</li>
        * <li>The right subtree of a node contains only nodes with elements greater
        * than the node's element</li>
        * <li>Both the left and right subtrees must also be binary search trees.</li>
        * </ul>
        * <p>If the inserted elements are custom objects a compare function must
        * be provided at construction time, otherwise the <=, === and >= operators are
        * used to compare elements. Example:</p>
        * <pre>
        * function compare(a, b) {
        *  if (a is less than b by some ordering criterion) {
        *     return -1;
        *  } if (a is greater than b by the ordering criterion) {
        *     return 1;
        *  }
        *  // a must be equal to b
        *  return 0;
        * }
        * </pre>
        * @constructor
        * @param {function(Object,Object):number=} compareFunction optional
        * function used to compare two elements. Must return a negative integer,
        * zero, or a positive integer as the first argument is less than, equal to,
        * or greater than the second.
        */
        function BSTree(compareFunction) {
            this.root = null;
            this.compare = compareFunction || collections.defaultCompare;
            this.nElements = 0;
        }
        /**
        * Adds the specified element to this tree if it is not already present.
        * @param {Object} element the element to insert.
        * @return {boolean} true if this tree did not already contain the specified element.
        */
        BSTree.prototype.add = function (element) {
            if (collections.isUndefined(element)) {
                return false;
            }

            if (this.insertNode(this.createNode(element)) !== null) {
                this.nElements++;
                return true;
            }
            return false;
        };

        /**
        * Removes all of the elements from this tree.
        */
        BSTree.prototype.clear = function () {
            this.root = null;
            this.nElements = 0;
        };

        /**
        * Returns true if this tree contains no elements.
        * @return {boolean} true if this tree contains no elements.
        */
        BSTree.prototype.isEmpty = function () {
            return this.nElements === 0;
        };

        /**
        * Returns the number of elements in this tree.
        * @return {number} the number of elements in this tree.
        */
        BSTree.prototype.size = function () {
            return this.nElements;
        };

        /**
        * Returns true if this tree contains the specified element.
        * @param {Object} element element to search for.
        * @return {boolean} true if this tree contains the specified element,
        * false otherwise.
        */
        BSTree.prototype.contains = function (element) {
            if (collections.isUndefined(element)) {
                return false;
            }
            return this.searchNode(this.root, element) !== null;
        };

        /**
        * Removes the specified element from this tree if it is present.
        * @return {boolean} true if this tree contained the specified element.
        */
        BSTree.prototype.remove = function (element) {
            var node = this.searchNode(this.root, element);
            if (node === null) {
                return false;
            }
            this.removeNode(node);
            this.nElements--;
            return true;
        };

        /**
        * Executes the provided function once for each element present in this tree in
        * in-order.
        * @param {function(Object):*} callback function to execute, it is invoked with one
        * argument: the element value, to break the iteration you can optionally return false.
        */
        BSTree.prototype.inorderTraversal = function (callback) {
            this.inorderTraversalAux(this.root, callback, {
                stop: false
            });
        };

        /**
        * Executes the provided function once for each element present in this tree in pre-order.
        * @param {function(Object):*} callback function to execute, it is invoked with one
        * argument: the element value, to break the iteration you can optionally return false.
        */
        BSTree.prototype.preorderTraversal = function (callback) {
            this.preorderTraversalAux(this.root, callback, {
                stop: false
            });
        };

        /**
        * Executes the provided function once for each element present in this tree in post-order.
        * @param {function(Object):*} callback function to execute, it is invoked with one
        * argument: the element value, to break the iteration you can optionally return false.
        */
        BSTree.prototype.postorderTraversal = function (callback) {
            this.postorderTraversalAux(this.root, callback, {
                stop: false
            });
        };

        /**
        * Executes the provided function once for each element present in this tree in
        * level-order.
        * @param {function(Object):*} callback function to execute, it is invoked with one
        * argument: the element value, to break the iteration you can optionally return false.
        */
        BSTree.prototype.levelTraversal = function (callback) {
            this.levelTraversalAux(this.root, callback);
        };

        /**
        * Returns the minimum element of this tree.
        * @return {*} the minimum element of this tree or undefined if this tree is
        * is empty.
        */
        BSTree.prototype.minimum = function () {
            if (this.isEmpty()) {
                return undefined;
            }
            return this.minimumAux(this.root).element;
        };

        /**
        * Returns the maximum element of this tree.
        * @return {*} the maximum element of this tree or undefined if this tree is
        * is empty.
        */
        BSTree.prototype.maximum = function () {
            if (this.isEmpty()) {
                return undefined;
            }
            return this.maximumAux(this.root).element;
        };

        /**
        * Executes the provided function once for each element present in this tree in inorder.
        * Equivalent to inorderTraversal.
        * @param {function(Object):*} callback function to execute, it is
        * invoked with one argument: the element value, to break the iteration you can
        * optionally return false.
        */
        BSTree.prototype.forEach = function (callback) {
            this.inorderTraversal(callback);
        };

        /**
        * Returns an array containing all of the elements in this tree in in-order.
        * @return {Array} an array containing all of the elements in this tree in in-order.
        */
        BSTree.prototype.toArray = function () {
            var array = [];
            this.inorderTraversal(function (element) {
                array.push(element);
                return;
            });
            return array;
        };

        /**
        * Returns the height of this tree.
        * @return {number} the height of this tree or -1 if is empty.
        */
        BSTree.prototype.height = function () {
            return this.heightAux(this.root);
        };

        /**
        * @private
        */
        BSTree.prototype.searchNode = function (node, element) {
            var cmp = null;
            while (node !== null && cmp !== 0) {
                cmp = this.compare(element, node.element);
                if (cmp < 0) {
                    node = node.leftCh;
                } else if (cmp > 0) {
                    node = node.rightCh;
                }
            }
            return node;
        };

        /**
        * @private
        */
        BSTree.prototype.transplant = function (n1, n2) {
            if (n1.parent === null) {
                this.root = n2;
            } else if (n1 === n1.parent.leftCh) {
                n1.parent.leftCh = n2;
            } else {
                n1.parent.rightCh = n2;
            }
            if (n2 !== null) {
                n2.parent = n1.parent;
            }
        };

        /**
        * @private
        */
        BSTree.prototype.removeNode = function (node) {
            if (node.leftCh === null) {
                this.transplant(node, node.rightCh);
            } else if (node.rightCh === null) {
                this.transplant(node, node.leftCh);
            } else {
                var y = this.minimumAux(node.rightCh);
                if (y.parent !== node) {
                    this.transplant(y, y.rightCh);
                    y.rightCh = node.rightCh;
                    y.rightCh.parent = y;
                }
                this.transplant(node, y);
                y.leftCh = node.leftCh;
                y.leftCh.parent = y;
            }
        };

        /**
        * @private
        */
        BSTree.prototype.inorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            this.inorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
            if (signal.stop) {
                return;
            }
            this.inorderTraversalAux(node.rightCh, callback, signal);
        };

        /**
        * @private
        */
        BSTree.prototype.levelTraversalAux = function (node, callback) {
            var queue = new Queue();
            if (node !== null) {
                queue.enqueue(node);
            }
            while (!queue.isEmpty()) {
                node = queue.dequeue();
                if (callback(node.element) === false) {
                    return;
                }
                if (node.leftCh !== null) {
                    queue.enqueue(node.leftCh);
                }
                if (node.rightCh !== null) {
                    queue.enqueue(node.rightCh);
                }
            }
        };

        /**
        * @private
        */
        BSTree.prototype.preorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
            if (signal.stop) {
                return;
            }
            this.preorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            this.preorderTraversalAux(node.rightCh, callback, signal);
        };

        /**
        * @private
        */
        BSTree.prototype.postorderTraversalAux = function (node, callback, signal) {
            if (node === null || signal.stop) {
                return;
            }
            this.postorderTraversalAux(node.leftCh, callback, signal);
            if (signal.stop) {
                return;
            }
            this.postorderTraversalAux(node.rightCh, callback, signal);
            if (signal.stop) {
                return;
            }
            signal.stop = callback(node.element) === false;
        };

        /**
        * @private
        */
        BSTree.prototype.minimumAux = function (node) {
            while (node.leftCh !== null) {
                node = node.leftCh;
            }
            return node;
        };

        /**
        * @private
        */
        BSTree.prototype.maximumAux = function (node) {
            while (node.rightCh !== null) {
                node = node.rightCh;
            }
            return node;
        };

        /**
        * @private
        */
        BSTree.prototype.successorNode = function (node) {
            if (node.rightCh !== null) {
                return this.minimumAux(node.rightCh);
            }
            var successor = node.parent;
            while (successor !== null && node === successor.rightCh) {
                node = successor;
                successor = node.parent;
            }
            return successor;
        };

        /**
        * @private
        */
        BSTree.prototype.heightAux = function (node) {
            if (node === null) {
                return -1;
            }
            return Math.max(this.heightAux(node.leftCh), this.heightAux(node.rightCh)) + 1;
        };

        /*
        * @private
        */
        BSTree.prototype.insertNode = function (node) {
            var parent = null;
            var position = this.root;
            var cmp = null;
            while (position !== null) {
                cmp = this.compare(node.element, position.element);
                if (cmp === 0) {
                    return null;
                } else if (cmp < 0) {
                    parent = position;
                    position = position.leftCh;
                } else {
                    parent = position;
                    position = position.rightCh;
                }
            }
            node.parent = parent;
            if (parent === null) {
                // tree is empty
                this.root = node;
            } else if (this.compare(node.element, parent.element) < 0) {
                parent.leftCh = node;
            } else {
                parent.rightCh = node;
            }
            return node;
        };

        /**
        * @private
        */
        BSTree.prototype.createNode = function (element) {
            return {
                element: element,
                leftCh: null,
                rightCh: null,
                parent: null
            };
        };
        return BSTree;
    })();
    collections.BSTree = BSTree;
})(collections || (collections = {})); // End of module
var BenchViewer;
(function (BenchViewer) {
    var Label = (function () {
        function Label(type, content) {
            if (typeof content === "undefined") { content = ""; }
            this.container = $("<span>");
            this.container.addClass(type);
            this.content = content;
        }
        Label.prototype.renderTo = function (element) {
            this.container.html(this.content);
            element.append(this.container);
        };

        Label.success = function () {
            return new Label(this.type.green, "C");
        };

        Label.failure = function () {
            return new Label(this.type.red, "F");
        };

        Label.status = function (completed) {
            return completed ? this.success() : this.failure();
        };
        Label.type = {
            grey: "label label-default",
            blue: "label label-primary",
            green: "label label-success",
            aqua: "label label-info",
            orange: "label label-warning",
            red: "label label-danger"
        };
        return Label;
    })();
    BenchViewer.Label = Label;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="../core/benchmarkGroup.ts" />
var BenchViewer;
(function (BenchViewer) {
    var MenuGroup = (function () {
        function MenuGroup() {
        }
        return MenuGroup;
    })();
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var MicroBoxplot = (function () {
            function MicroBoxplot(dataFunction, completedHistory, series) {
                var _this = this;
                this.dataFunction = dataFunction;
                this.completedHistory = completedHistory;
                this.series = series;
                this.averages = [];
                this.standardDeviations = [];
                this.outliers = [];
                this.values = [];
                this.completedHistory.forEach(function (result, index) {
                    var data = _this.dataFunction(result);

                    _this.values.push(Core.roundArray([data.sampleStats.low, data.q1, data.median, data.q3, data.sampleStats.high]));
                    _this.standardDeviations.push([index, Core.round(data.sampleStats.standardDeviation)]);
                    _this.averages.push([index, Core.round(data.sampleStats.average)]);

                    for (var j = 0, outlierEnd = data.outliers.length; j < outlierEnd; ++j) {
                        var outlier = data.outliers[j];
                        _this.outliers.push([index, Core.round(outlier)]);
                    }
                });
            }
            MicroBoxplot.prototype.getCategories = function () {
                var categories = [];
                this.series.forEach(function (serie) {
                    return categories.push(serie);
                });
                return categories;
            };

            MicroBoxplot.prototype.renderTo = function (element) {
                element.highcharts({
                    chart: {
                        type: "boxplot",
                        reflow: true
                    },
                    title: {
                        text: ""
                    },
                    xAxis: {
                        categories: this.getCategories(),
                        title: {
                            text: "Series"
                        }
                    },
                    yAxis: {
                        title: {
                            text: "Time (ms)"
                        }
                    },
                    series: [
                        {
                            name: "Measurements",
                            data: this.values,
                            tooltip: {
                                headerFormat: "<em>Series {point.key}</em><br/>"
                            }
                        },
                        {
                            name: "Outliers",
                            type: "scatter",
                            data: this.outliers,
                            marker: {
                                fillColor: "white",
                                lineWidth: 1,
                                lineColor: Highcharts.getOptions().colors[0]
                            },
                            tooltip: {
                                pointFormat: "Outlier: {point.y}"
                            }
                        },
                        {
                            name: "Standard Deviation",
                            type: "line",
                            data: this.standardDeviations,
                            tooltip: {
                                pointFormat: "Standard Deviation: {point.y}"
                            }
                        },
                        {
                            name: "Average",
                            type: "line",
                            data: this.averages,
                            tooltip: {
                                pointFormat: "Average: {point.y}"
                            }
                        }
                    ]
                });
            };
            return MicroBoxplot;
        })();
        Core.MicroBoxplot = MicroBoxplot;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    (function (Core) {
        var MicroHistogram = (function () {
            function MicroHistogram(samples) {
                this.samples = samples;
            }
            MicroHistogram.prototype.renderTo = function (element) {
                element.highcharts({
                    chart: {
                        type: "histogram",
                        reflow: true
                    },
                    title: {
                        text: "Recent Histogram"
                    },
                    plotOptions: {
                        column: {
                            pointPadding: 0,
                            borderWidth: 0,
                            groupPadding: 0,
                            shadow: false
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    yAxis: {
                        title: {
                            text: "Frequency"
                        }
                    },
                    xAxis: {
                        title: {
                            text: "Time (ms)"
                        }
                    },
                    series: [{
                            name: "Frequency",
                            data: this.samples
                        }]
                });
            };
            return MicroHistogram;
        })();
        Core.MicroHistogram = MicroHistogram;
    })(BenchViewer.Core || (BenchViewer.Core = {}));
    var Core = BenchViewer.Core;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    var MicroSamplePlot = (function () {
        function MicroSamplePlot(series) {
            this.series = series;
        }
        MicroSamplePlot.prototype.renderTo = function (element) {
            element.highcharts({
                chart: {
                    type: "line"
                },
                title: {
                    text: ""
                },
                xAxis: {
                    title: {
                        text: "Sample No."
                    }
                },
                yAxis: {
                    title: {
                        text: "Time (ms)"
                    }
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: this.series
            });
        };
        return MicroSamplePlot;
    })();
    BenchViewer.MicroSamplePlot = MicroSamplePlot;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    var SubPage = (function () {
        function SubPage(name) {
            this.name = name;
            this.container = $("<div>");
            this.container.addClass("sub-page");

            this.header = $("<h2>");
            this.header.addClass("sub-header");
        }
        SubPage.prototype.addLabels = function () {
        };

        SubPage.prototype.renderTo = function (element) {
            this.addLabels();

            var benchLabel = this.getBenchmarkLabel();
            benchLabel.container.addClass("pull-right");
            benchLabel.renderTo(this.header);

            this.header.append("\t" + this.name);

            this.container.append(this.header);

            this.container.append(this.addContent());

            element.append(this.container);
        };

        SubPage.prototype.getBenchmarkLabel = function () {
            return new BenchViewer.Label(BenchViewer.Label.type.grey);
        };

        SubPage.prototype.addContent = function () {
            return null;
        };
        return SubPage;
    })();
    BenchViewer.SubPage = SubPage;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="./subPage.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BenchViewer;
(function (BenchViewer) {
    var Regression = BenchViewer.Core.Regression;
    var Config = BenchViewer.Core.Config;
    var MicroBoxplot = BenchViewer.Core.MicroBoxplot;
    var MicroHistogram = BenchViewer.Core.MicroHistogram;

    var MicroSubPage = (function (_super) {
        __extends(MicroSubPage, _super);
        function MicroSubPage(benchmark, name) {
            _super.call(this, name);
            this.analysis = $("<div>");
            this.overview = $("<div>");
            this.corrected = $("<div>");
            this.raw = $("<div>");
            this.baseline = $("<div>");
            this.memory = $("<div>");

            this.benchmark = benchmark;

            this.addAnalysis();

            this.addSeries();
            this.addData();

            this.addCorrected();
            this.addRaw();
            this.addBaseline();

            this.addMemory();
        }
        MicroSubPage.prototype.renderTo = function (element) {
            _super.prototype.renderTo.call(this, element);
        };

        MicroSubPage.prototype.addLabels = function () {
            var statusLabel = BenchViewer.Label.status(this.getMostRecentBenchmark().completed);
            statusLabel.container.addClass("pull-right");
            statusLabel.renderTo(this.header);
        };

        MicroSubPage.prototype.getBenchmarkLabel = function () {
            return new BenchViewer.Label(BenchViewer.Label.type.grey, "&mu;");
        };

        MicroSubPage.prototype.addContent = function () {
            var tab = new BenchViewer.Tab();
            tab.addTab("Analysis", this.analysis);
            tab.addTab("Overview", this.overview);
            tab.addTab("Corrected", this.corrected);
            tab.addTab("Raw", this.raw);
            tab.addTab("Baseline", this.baseline);
            tab.addTab("Memory", this.memory);
            tab.renderTo(this.container);

            return null;
        };

        MicroSubPage.prototype.getMostRecentBenchmark = function () {
            return this.benchmark.benchmarkCase == null ? this.benchmark.history[0] : this.benchmark.current;
        };

        MicroSubPage.prototype.getHistory = function () {
            return this.benchmark.benchmarkCase == null ? this.benchmark.history : this.benchmark.history.concat(this.benchmark.current);
        };

        MicroSubPage.prototype.getCompleted = function () {
            return this.getHistory().filter(function (benchmark) {
                return benchmark.completed;
            });
        };

        MicroSubPage.prototype.getCompletedSeries = function () {
            var _this = this;
            var completed = this.getCompleted();
            var series = [];
            if (completed.length > 0) {
                this.getHistory().forEach(function (element, index) {
                    if (!element.completed) {
                        return;
                    }

                    series.push(_this.getSerie(index));
                });
            }
            return series;
        };

        MicroSubPage.prototype.addAnalysis = function () {
            var current = this.getMostRecentBenchmark();
            var leaks = current.memoryLeaks;
            var hasLeaks = leaks.length > 0;

            this.analysis.append("<h3>Analysis</h3>");

            if (!hasLeaks && current.regression === 0 /* None */) {
                if (current.completed) {
                    this.analysis.append("<p>Everything looks OK!</p>");
                } else {
                    this.analysis.append("<p>Oh dear, it looks like this case needs fixing!</p>");
                }
            } else {
                if (current.regression !== 0 /* None */) {
                    this.analysis.append("<h4>Regressions Detected</h4>");

                    var p = $("<ul>");
                    if (current.regression & 1 /* TimeSlower */) {
                        p.append("<li>The case ran <b>slower</b> than expected.</li>");
                    } else if (current.regression & 2 /* TimeFaster */) {
                        p.append("<li>The case ran <i>faster</i> than expected.</li>");
                    }

                    if (current.regression & 4 /* MemSmaller */) {
                        p.append("<li>The case used <b>less</b> memory than expected.</li>");
                    } else if (current.regression & 8 /* MemLarger */) {
                        p.append("<li>The case used <b>more</b> memory than expected.</li>");
                    }

                    if (current.regression & 32 /* PeakMemLarger */) {
                        p.append("<li>The peak memory was <b>higher</b> than expected.</li>");
                    }

                    this.analysis.append(p);
                }
            }

            if (hasLeaks) {
                this.analysis.append("<h3>Memory leaks found</h3>");
                var leakTable = new BenchViewer.Table();
                leakTable.setTitle("Memory Leaks");
                leakTable.setHeader(["File", "Line", "Size"]);

                current.memoryLeaks.forEach(function (element) {
                    leakTable.addRow([
                        element.file,
                        element.line,
                        element.size
                    ]);
                });

                leakTable.renderTo(this.analysis);
            }
        };

        MicroSubPage.prototype.addSeries = function () {
            var _this = this;
            this.overview.append("<p><h3>Series</h3>To make the results more readable, we categorise each benchmark with a letter.</p>");

            var table = new BenchViewer.Table();

            table.setTitle("Series");
            table.setHeader(["Series", "Date", "Status"]);

            this.getHistory().forEach(function (result, index) {
                table.addRow([
                    _this.getSerie(index),
                    result.timestamp,
                    BenchViewer.Label.status(result.completed)
                ]);
            });

            table.renderTo(this.overview);
        };

        MicroSubPage.prototype.addData = function () {
            var _this = this;
            this.overview.append("<p><h3>Data</h3></p>");

            var table = new BenchViewer.Table();

            table.setTitle("Data");
            table.setHeader(["Series", "All", "Inliers", "Outliers"]);

            var completed = this.getCompleted();
            if (completed.length > 0) {
                this.getHistory().forEach(function (element, index) {
                    if (!element.completed) {
                        return;
                    }

                    var allHtml = element.timeCorrected.samples.join(", ");
                    var wellAll = $("<div>");
                    wellAll.addClass("well well-sm");
                    wellAll.html(allHtml === "" ? "-" : allHtml);

                    var inlierHtml = element.timeCorrected.inliers.join(", ");
                    var wellInlier = $("<div>");
                    wellInlier.addClass("well well-sm");
                    wellInlier.html(inlierHtml === "" ? "-" : inlierHtml);

                    var outlierHtml = element.timeCorrected.outliers.join(", ");
                    var wellOutlier = $("<div>");
                    wellOutlier.addClass("well well-sm");
                    wellOutlier.html(outlierHtml === "" ? "-" : outlierHtml);

                    table.addRow([_this.getSerie(index), wellAll, wellInlier, wellOutlier]);
                });
            } else {
                table.addRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
            }

            table.renderTo(this.overview);
        };

        MicroSubPage.prototype.getSerie = function (index) {
            var s = "";
            while (index >= 0) {
                s = String.fromCharCode(index % 26 + "A".charCodeAt(0)) + s;
                index = Math.floor(index / 26) - 1;
            }
            return s;
        };

        MicroSubPage.prototype.addCorrected = function () {
            var current = this.getMostRecentBenchmark();
            if (current.completed) {
                this.renderCorrectedGraphs(this.corrected);
            }

            var table = new BenchViewer.Table();

            table.setTitle("Corrected Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, function (data) {
                return data.timeCorrected;
            });

            table.renderTo(this.corrected);
        };

        MicroSubPage.prototype.addRaw = function () {
            var current = this.getMostRecentBenchmark();
            if (current.completed) {
                this.renderSampleGraphs(this.raw);
            }

            var table = new BenchViewer.Table();

            table.setTitle("Raw Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, function (result) {
                return result.timeSamples;
            });

            table.renderTo(this.raw);
        };

        MicroSubPage.prototype.addBaseline = function () {
            var current = this.getMostRecentBenchmark();
            if (current.completed) {
                this.renderBaselineGraphs(this.baseline);
            }

            var table = new BenchViewer.Table();

            table.setTitle("Baseline Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, (function (result) {
                return result.timeBaseline;
            }));

            table.renderTo(this.baseline);
        };

        MicroSubPage.prototype.addMemory = function () {
            var current = this.getMostRecentBenchmark();
            if (current.completed) {
                this.renderMemoryGraphs(this.memory);
            }

            var table = new BenchViewer.Table();

            table.setTitle("Memory Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, function (result) {
                return result.memorySamples;
            });

            table.renderTo(this.memory);
        };

        MicroSubPage.prototype.renderCorrectedGraphs = function (element) {
            var tabs = new BenchViewer.Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = function (result) {
                return result.timeCorrected;
            };

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));
            tabs.addTab("Samples", this.renderSamplePlot(tabs, function (result) {
                return [
                    {
                        name: "Raw",
                        data: result.timeSamples.samples
                    },
                    {
                        name: "Baseline",
                        data: result.timeBaseline.samples
                    }];
            }));

            tabs.renderTo(element);
        };

        MicroSubPage.prototype.renderSampleGraphs = function (element) {
            var tabs = new BenchViewer.Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = function (result) {
                return result.timeSamples;
            };

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));

            tabs.renderTo(element);
        };

        MicroSubPage.prototype.renderBaselineGraphs = function (element) {
            var tabs = new BenchViewer.Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = function (result) {
                return result.timeBaseline;
            };

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));

            tabs.renderTo(element);
        };

        MicroSubPage.prototype.renderMemoryGraphs = function (element) {
            var tabs = new BenchViewer.Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = function (result) {
                return result.timeCorrected;
            };

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));
            tabs.addTab("Samples", this.renderSamplePlot(tabs, function (result) {
                return [{
                        name: "Memory Usage",
                        data: dataFunction(result).samples
                    }];
            }));

            tabs.renderTo(element);
        };

        MicroSubPage.prototype.composeRows = function (table, completed, dataFunc) {
            var _this = this;
            if (completed) {
                this.getHistory().forEach(function (element, index) {
                    if (!element.completed) {
                        return;
                    }

                    var data = dataFunc(element);

                    var med = data.median.toFixed(Config.precision);
                    var avg = data.sampleStats.average.toFixed(Config.precision);
                    var sd = data.sampleStats.standardDeviation.toFixed(Config.precision);
                    var low = data.sampleStats.low.toFixed(Config.precision);
                    var high = data.sampleStats.high.toFixed(Config.precision);
                    table.addRow([_this.getSerie(index), avg, med, sd, low, high]);
                });
            } else {
                table.addRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
            }
        };

        MicroSubPage.prototype.renderBoxplot = function (tabs, dataFunction) {
            var div = $("<div>");
            div.addClass("graph");

            var graph = new MicroBoxplot(dataFunction, this.getCompleted(), this.getCompletedSeries());
            graph.renderTo(div);

            return div;
        };

        MicroSubPage.prototype.renderHistogram = function (tabs, dataFunction) {
            var div = $("<div>");
            div.addClass("graph");

            var current = this.getMostRecentBenchmark();
            if (current.completed) {
                var samples = dataFunction(current).samples;
                if (samples.length > 1) {
                    var graph = new MicroHistogram(samples);
                    graph.renderTo(div);
                } else {
                    div.append("<h4>Not enough data to show!</h4>");
                }
            } else {
                div.append("<h4>The most recent benchmark failed!</h4>");
            }

            return div;
        };

        MicroSubPage.prototype.renderSamplePlot = function (tabs, dataFunction) {
            var div = $("<div>");
            div.addClass("graph");

            var current = this.benchmark.current;
            if (current.completed) {
                var samples = dataFunction(current);
                if (samples.length > 1) {
                    var graph = new BenchViewer.MicroSamplePlot({
                        "series": samples
                    });
                    graph.renderTo(div);
                } else {
                    div.append("<h4>Not enough data to show!</h4>");
                }
            } else {
                div.append("<h4>The most recent benchmark failed!</h4>");
            }

            return div;
        };
        return MicroSubPage;
    })(BenchViewer.SubPage);
    BenchViewer.MicroSubPage = MicroSubPage;
})(BenchViewer || (BenchViewer = {}));
/// <reference path="../core/benchmarkGroup.ts"/>
/// <reference path="./microSubPage.ts"/>
var BenchViewer;
(function (BenchViewer) {
    var Page = (function () {
        function Page(name, group) {
            this.name = name;
            this.group = group;
            this.container = $("<div>");

            //this.container.addClass("tab-pane panel panel-default page");
            this.container.addClass("panel panel-default page");
            this.container.attr("id", this.getId());

            var header = $("<h1>");
            header.addClass("page-header");
            header.html(this.name);

            this.container.append(header);
        }
        Page.prototype.renderTo = function (element) {
            var _this = this;
            this.group.micros.all.forEach(function (name, benchmark) {
                var page = new BenchViewer.MicroSubPage((benchmark), name);
                page.renderTo(_this.container);
            });

            element.append(this.container);
        };

        Page.prototype.getId = function () {
            return this.name;
        };
        return Page;
    })();
    BenchViewer.Page = Page;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    var Guid = BenchViewer.Core.guid;

    var Tab = (function () {
        function Tab(vertical) {
            if (typeof vertical === "undefined") { vertical = false; }
            this.vertical = vertical;
            this.htmlClass = "tab-me";
            this.size = 0;
            this.container = $("<div>");
            this.ul = $("<ul>");
            this.ul.addClass("nav nav-tabs");
            this.ul.attr("role", "tablist");

            this.content = $("<div>");
            this.content.addClass("tab-content");

            if (this.vertical) {
                this.ul.addClass("tabs-left");

                var tabDiv = $("<div>");
                tabDiv.addClass("col-xs-3 col-md-2");
                tabDiv.append(this.ul);

                var contentDiv = $("<div>");
                contentDiv.addClass("col-xs-7 col-md10");
                contentDiv.append(this.content);

                this.container.addClass("container-fluid");

                this.container.append(tabDiv);
                this.container.append(contentDiv);
            } else {
                this.container.append(this.ul);
                this.container.append(this.content);
            }
        }
        Tab.prototype.addTab = function (name, contents) {
            var first = this.size++ === 0;
            var li = $("<li>");
            var link = $("<a>");

            var id = Guid();

            link.attr("href", "#" + id);
            link.addClass(this.htmlClass);

            link.html(name);

            li.append(link);

            this.ul.append(li);

            var pane = $("<div>");
            pane.addClass("tab-pane inner-tab-pane");

            pane.attr("id", id);
            pane.append(contents);

            if (first) {
                li.addClass("active");
                pane.addClass("active");
            }

            this.content.append(pane);

            return id;
        };

        Tab.prototype.renderTo = function (element) {
            element.append(this.container);
        };
        return Tab;
    })();
    BenchViewer.Tab = Tab;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (BenchViewer) {
    var Table = (function () {
        function Table() {
            this.columns = 0;
            this.rows = 0;
            this.container = $("<div>");
            this.title = $("<div>");
            this.table = $("<table>");
            this.tableHeader = $("<tr>");
            this.tableBody = $("<tbody>");
            this.container.addClass("panel panel-default");
            this.title.addClass("panel-heading");
            this.table.addClass("table table-striped");
            this.table.attr("data-sortable", " ");

            var thead = $("<thead>");
            thead.append(this.tableHeader);

            this.table.append(thead);
            this.table.append(this.tableBody);

            this.container.append(this.title);
            this.container.append(this.table);
        }
        Table.prototype.setTitle = function (name) {
            this.title.html(name);
        };

        Table.prototype.setHeader = function (titles) {
            for (var i = 0, end = titles.length; i < end; ++i) {
                var th = $("<th>");
                th.html(titles[i]);
                this.tableHeader.append(th);
            }
            this.columns = titles.length;
        };

        Table.prototype.addRow = function (data) {
            var tr = $("<tr>");
            for (var i = 0, end = data.length; i < end; ++i) {
                var td = $("<td>");
                td.html(data[i]);

                tr.append(td);
            }
            this.tableBody.append(tr);

            ++this.rows;
        };

        Table.prototype.addRowspan = function (html) {
            var tr = $("<tr>");
            var td = $("<td>");
            td.attr("colspan", this.columns);
            td.append(html);
            tr.append(td);

            this.tableBody.append(tr);

            ++this.rows;
        };

        Table.prototype.renderTo = function (element) {
            element.append(this.container);
        };
        return Table;
    })();
    BenchViewer.Table = Table;
})(BenchViewer || (BenchViewer = {}));
var BenchViewer;
(function (_BenchViewer) {
    var BenchViewer = (function () {
        function BenchViewer(benchmarkData) {
            this.pages = [];
            this.benchLib = new _BenchViewer.BenchLib(benchmarkData);
            this.benchLib.runBenchmarks();
            this.render();
        }
        BenchViewer.prototype.render = function () {
            this.addDefaultPages();

            this.renderPages();
            this.renderMenu();
        };

        BenchViewer.prototype.addPage = function () {
        };

        BenchViewer.prototype.addDefaultPages = function () {
        };

        BenchViewer.prototype.renderPages = function () {
            var _this = this;
            var main = $("<div>");
            main.addClass("tab-content");

            this.benchLib.groups.forEach(function (name, group) {
                var page = new _BenchViewer.Page(name, group);
                page.renderTo(main);

                _this.pages.push(page);
            });

            $("#main").append(main);
        };

        BenchViewer.prototype.renderMenu = function () {
            var title = "BenchViewer";
            var pageUl = $("<ul>");
            pageUl.addClass("nav nav-sidebar");

            this.pages.forEach(function (page) {
            });

            $("#page-navigation").append(pageUl);
        };
        return BenchViewer;
    })();
    _BenchViewer.BenchViewer = BenchViewer;

    window.onload = function () {
        var viewer = new BenchViewer(benchmarkData);

        $("body").scrollspy({ target: ".nav-sub-container" });

        $(".tab-me").click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    };
})(BenchViewer || (BenchViewer = {}));
//# sourceMappingURL=benchViewer.js.map
