/// <reference path="./benchmarkData.ts" />
/// <reference path="./memory.ts"/>

module BenchViewer.Core
 {
    export class BenchmarkResult
    {  
        timeSamples: BenchmarkData = new BenchmarkData();
        timeBaseline: BenchmarkData = new BenchmarkData();
        timeCorrected: BenchmarkData = new BenchmarkData( true, true );

        memorySamples: BenchmarkData = new BenchmarkData(false);
        memoryBaseline: BenchmarkData = new BenchmarkData(false);
        memoryCorrected: BenchmarkData = new BenchmarkData(false, true);

        memoryLeaks: MemLeak[] = [];
        timestamp: string;

        operationCount: number = 0;
        sampleCount: number = 0;
        regression: number = 0;

        memoryProfile: boolean = true;
        completed: boolean = false;

        constructor( private isCurrent: boolean = false)
        {
            
        }

        serialise(): any
        {
            var result = {
                timestamp: this.timestamp,
                completed: this.completed
            };

            if ( this.completed )
            {
                result["operationCount"] = this.operationCount;
                result["sampleCount"] = this.sampleCount;
                result["regression"] = this.regression;
                result["timeCorrected"] = this.timeCorrected.serialise();

                if ( this.isCurrent )
                {
                    result["timeSamples"] = this.timeSamples.serialise();
                    result[ "timeBaseline" ] = this.timeBaseline.serialise();
                }

                if ( this.memoryProfile )
                {
                    var memoryLeaks = [];

                    this.memoryLeaks.forEach( memoryLeak =>
                    {
                        memoryLeaks.push( memoryLeak.serialise() );
                    });

                    result["memoryProfile"] = this.memoryProfile;
                    result["memorySamples"] = this.memorySamples.serialise();
                    result["memoryBaseline"] = this.memoryBaseline.serialise();
                    result["memoryCorrected"] = this.memoryCorrected.serialise();
                    result[ "memoryLeaks" ] = memoryLeaks;
                }
            }
        }

        deserialise( object ): void
        {
            this.completed = object["completed"];
            this.timestamp = object["timestamp"];

            if ( this.completed )
            {
                this.operationCount = object["operationCount"];
                this.sampleCount = object["sampleCount"];

                var regression = object[ "regression" ];
                if (regression !== undefined )
                {
                    this.regression = regression;
                }
                else
                {
                    this.regression = 0;
                }

                if (this.isCurrent)
                {
                    this.timeSamples.deserialise(object["timeSamples"]);
                    this.timeBaseline.deserialise(object["timeBaseline"]);
                }

                var timeCorrected = object[ "timeCorrected" ];
                if ( timeCorrected === undefined )
                {
                    this.timeCorrected.setSamplesForCorrection( this.timeSamples, this.timeBaseline );
                }
                else
                {
                    this.timeCorrected.deserialise( timeCorrected );
                }

                var memoryProfile = object[ "memoryProfile" ];
                if (memoryProfile !== undefined)
                {
                    this.memoryProfile = memoryProfile;

                    if ( this.memoryProfile )
                    {
                        this.memorySamples.deserialise(object["memorySamples"]);
                        this.memoryBaseline.deserialise(object["memoryBaseline"]);
                        this.memoryCorrected.deserialise(object["memoryCorrected"]);

                        var memoryLeaks = object[ "memoryLeaks" ];
                        if ( memoryLeaks !== undefined && memoryLeaks !== null )
                        {
                            memoryLeaks.forEach(leak =>
                            {
                                var nLeak: MemLeak = new MemLeak();
                                nLeak.deserialise(leak);
                                this.memoryLeaks.push( nLeak );
                            });
                        }
                    }
                }
            }
        }

        setWingsorise( winsorise: boolean ): void
        {
            this.timeSamples.winsorise = winsorise;
            this.timeBaseline.winsorise = winsorise;
            this.timeCorrected.winsorise = winsorise;
        }
    }
 }