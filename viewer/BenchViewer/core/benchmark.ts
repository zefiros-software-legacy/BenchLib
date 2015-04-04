/// <reference path="./benchmarkResult.ts"/>
/// <reference path="./regression.ts"/>

module BenchViewer.Core
{
    export class Benchmark implements IBenchmarkCase
    {
        shadowName: string = "";
        history: Array<BenchmarkResult> = new Array<BenchmarkResult>();
        current: BenchmarkResult = new BenchmarkResult();

        baselineDuration: number;
        sampleDuration: number;

        constructor( public benchmarkCase: Benchmark.BenchmarkCase = null )
        {
            
        }

        serialise(): any
        {
            var history = [];

            this.history.forEach( result =>
            {
                history.push( result.serialise() );
            } );

            return {
                name: this.getName(),
                current: this.current.serialise(),
                history: history
            };
        }

        deserialise(object): void
        {
            this.shadowName = object["name"];

            var results = object["history"];
            results.forEach( result =>
            {
                var benchmarkResult: Core.BenchmarkResult = new Core.BenchmarkResult();
                benchmarkResult.deserialise(result);

                this.history.push(benchmarkResult);
            });

            var size: number = this.history.length;
            var maxHist: number = Config.microMaxHistory - 1;
            var newSize = size > maxHist ? maxHist : size;
            this.history = this.history.slice(size - newSize, size);

            var current: Core.BenchmarkResult = new Core.BenchmarkResult(true);
            current.deserialise(object["current"]);

            this.history.push(current);

            this.history = this.history.reverse();
        }

        onInit(): void
        {
            this.current.memoryProfile = this.isProfileMemoryEnabled();
            this.current.timestamp = Config.timestamp;
            this.current.setWingsorise(this.getWinsorise());
            this.current.sampleCount = this.getSampleCount();
        }

        onRun(): void
        {
            if ( this.isProfileMemoryEnabled() )
            {
                this.runMemorySamples();
                this.runMemoryBaseline();
            }

            this.runTime();
        }

        onFinalise(): void
        {
            
        }

        analyse(): void
        {
            // Console.baseline(this.getOverhead());
            // Console.printResult();
            // Console.result( this.current.timeSamples.samplestats );

            // Console.printResultCorrected();
            // Console.result(this.current.timeCorrected.sampleStats);

            var regression: number = Regression.None;

            var completedResults: BenchmarkResult[] = this.getCompletedResults();

            if ( completedResults.length > 1 )
            {
                var history: Statistics.StatHistory[] = [];

                completedResults.forEach( result =>
                {
                    var timeCorrected: BenchmarkData = result.timeCorrected;
                    var sampleStat: BenchmarkStat;

                    if ( this.getWinsorise() )
                    {
                        sampleStat = timeCorrected.winsorisedStats;
                    }
                    else
                    {
                        sampleStat = timeCorrected.sampleStats;
                    }

                    var stat: Statistics.StatHistory = new Statistics.StatHistory();
                    stat.average = sampleStat.average;
                    stat.variance = sampleStat.variance;
                    stat.sampleCount = result.sampleCount;
                    history.push( stat );
                });

                var histInterval = Statistics.getConfidenceIntervalFromHistory(history);

                var stats: BenchmarkStat = this.getWinsorise() ? this.current.timeCorrected.winsorisedStats : this.current.timeCorrected.sampleStats;
                var currentInterval: Statistics.ConfidenceInterval = Statistics.getConfidenceInterval(stats.standardDeviation, this.current.sampleCount, stats.average);
                
                if ( currentInterval.upper < histInterval.lower )
                {
                    regression |= Regression.TimeFaster;
                    // Console.RegressTimeFaster( histInterval.lower, histInterval.upper, currentInterval.upper );
                }
                else if ( currentInterval.lower > histInterval.upper )
                {
                    regression |= Regression.TimeSlower;
                    // Console.RegressTimeSlower( histInterval.lower, histInterval.upper, currentInverval.lower );
                }

                if ( this.isProfileMemoryEnabled() )
                {
                    var statHistory: Statistics.StatHistory[] = [];
                    var peaks: number[] = [];

                    completedResults.forEach( result =>
                    {
                        var sampleCount: number = result.memoryCorrected.samples.length;

                        var sampleStat: BenchmarkStat = result.memoryCorrected.sampleStats;

                        if ( result.memoryProfile && sampleCount > 0 )
                        {
                            var stat: Statistics.StatHistory = new Statistics.StatHistory();
                            stat.average = sampleStat.average;
                            stat.variance = sampleStat.variance;
                            stat.sampleCount = sampleCount;

                            statHistory.push( stat );
                        }

                        peaks.push( sampleStat.high );
                    });

                    if ( statHistory.length > 0 )
                    {
                        var interval: Statistics.ConfidenceInterval = Statistics.getConfidenceIntervalFromHistory(statHistory);

                        var sampleStats: BenchmarkStat = this.current.memoryCorrected.sampleStats;

                        var average: number = sampleStats.average;

                        if ( average < interval.lower )
                        {
                            regression |= Regression.MemSmaller;
                            // Console.RegressMemSmaller( interval.lower, interval.upper, average );
                        }
                        else if ( average > interval.upper )
                        {
                            regression |= Regression.MemLarger;
                            // Console.RegressMemLarger( interval.lower, interval.upper, average );
                        }

                        var peakData: BenchmarkData;
                        peakData.setSamples(peaks);

                        var peakStats: BenchmarkStat = peakData.sampleStats;

                        var peakInterval: Statistics.ConfidenceInterval = Statistics.getConfidenceInterval(peakStats.standardDeviation, peaks.length, peakStats.average);

                        if ( sampleStats.high < peakInterval.lower )
                        {
                            regression |= Regression.PeakMemSmaller;
                            // Console.RegressPeakMemSmaller( peakInterval.lower, peakInterval.upper, sampleStats.high );
                        }
                        else if ( sampleStats.high > peakInterval.upper )
                        {
                            regression |= Regression.PeakMemLarger;
                            // Console.RegressPeakMemLarger( peakInterval.lower, peakInterval.upper, sampleStats.high );
                        }
                    }
                }
            }

            this.current.regression = regression;
        }

        isCompleted(): boolean
        {
            return this.current.completed;
        }

        setCompleted(isCompleted: boolean): void
        {
            this.current.completed = isCompleted;
        }

        getOperationCount(): number
        {
            return this.current.operationCount;
        }

        calculateOperationCount(): void
        {
            var minTimeRequiredPerUnit: number = Config.minMsPerBenchUnit;
            var operationCount: number = 0;

            var start: number = performance.now();
            while ( (performance.now() - start) < minTimeRequiredPerUnit )
            {
                ++operationCount;

                this.runSamples();
            }

            this.current.operationCount = operationCount;

            // Console.stats( this.getSampleCount(), this.getOperationCount() );
        }

        getSampleCount(): number
        {
            return 0;
        }

        getWinsorise(): boolean
        {
            return Config.winsoriseAnalysis;
        }

        getRegression(): number
        {
            return this.current.regression;
        }

        getName(): string
        {
            return this.shadowName;
        }

        getGroup(): string
        {
            return "";
        }

        isProfileMemoryEnabled()
        {
            return false;
        }

        isShadow(): boolean
        {
            return true;
        }

        private runMemorySamples(): void
        {
            var samples: number[] = [];
            //Memory.startProfile();

            this.runSamples();

            //Memory.endProfile(samples, this.current.memoryLeaks);

            this.current.memorySamples.setSamples(samples);
            this.current.memoryCorrected.setSamplesForCorrection( this.current.memorySamples, this.current.memoryBaseline );
        }

        private runTime()
        {
            var sampleCount: number = this.getSampleCount();
            var operationCount: number = this.getOperationCount();

            var samples: number[] = [];
            var baseline: number[] = [];

            for (var i: number = 0; i < sampleCount; ++i )
            {
                {
                    var startTime: number = performance.now();

                    for (var j: number = 0; j < operationCount; ++j )
                    {
                        this.runBaseline();
                    }
                    
                    baseline[i] = new Date().getTime() - startTime;
                }
                {
                    var startTime2: number = performance.now();

                    for (var k: number = 0; k < operationCount; ++k)
                    {
                        this.runSamples();
                    }

                    samples[i] = performance.now() - startTime2;
                }
            }

            this.baselineDuration = baseline.reduce( ( x, y ) => x + y );
            this.sampleDuration = samples.reduce( ( x, y ) => x + y );

            this.current.timeBaseline.setSamples( baseline );
            this.current.timeSamples.setSamples(samples);

            this.current.timeCorrected.setSamplesForCorrection(this.current.timeSamples, this.current.timeBaseline);
        }

        private runMemoryBaseline()
        {
            var samples: number[] = [];

            //Memory.startProfile();

            this.runBaseline();

            //Memory.endProfile(samples);

            if ( samples.length > 1 )
            {
                this.current.memoryBaseline.setSamples( samples );
            }
        }

        private getOverhead(): number
        {
            return this.current.timeBaseline.sampleStats.average;
        }

        private getCompletedResults(): BenchmarkResult[]
        {
            var results: BenchmarkResult[] = [];

            this.history.forEach( result =>
            {
                if ( result.completed )
                {
                    results.push( result );
                }
            });

            return results;
        }

        private runSamples(): void
        {
            this.benchmarkCase.init();
            this.benchmarkCase.run();
            this.benchmarkCase.finalise();
        }

        private runBaseline(): void
        {
            this.benchmarkCase.init();
            this.benchmarkCase.baseline();
            this.benchmarkCase.finalise();
        }
    }

    export module Benchmark
    {
        export class BenchmarkCase
        {
            run(): void
            {
            }

            baseline(): void
            {
            }

            init(): void
            {
            }

            finalise(): void
            {
            }
        }
    }
}