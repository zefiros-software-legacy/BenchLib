/// <reference path="benchmarkStat.ts" />
/// <reference path="util.ts" />

module BenchViewer.Core
{
    export class BenchmarkData
    {
        samples: Array< number > = [];
        inliers: Array< number > = [];
        outliers: Array< number > = [];
        winsorised: Array< number > = [];

        winsorisedStats: BenchmarkStat = new BenchmarkStat();
        sampleStats: BenchmarkStat = new BenchmarkStat();

        inlierHigh: number = 0.0;
        inlierLow: number = 0.0;

        median: number = 0.0;
        q1: number = 0.0;
        q3: number = 0.0;

        winsorise: boolean = false;

        constructor(private isSample: boolean = true, public isCorrected: boolean = false )
        {
        }

        serialise(): any
        {
            var object = {
                sampleStats: this.sampleStats.serialise()
            };

            if ( this.storeSamples() )
            {
                object[ "samples" ] = this.samples;
            }

            if ( this.isValid() )
            {
                object["median"] = this.median;
                object["Q1"] = this.q1;
                object["Q3"] = this.q3;

                if ( this.inliers.length > 1 )
                {
                    object[ "winsorisedStats" ] = this.winsorisedStats.serialise();
                }

                if ( this.storeSamples() )
                {
                    object[ "inliers" ] = this.inliers;
                }

                object[ "outliers" ] = this.outliers;
            }

            return object;
        }

        deserialise(object): void
        {
            var sampleStats = object["sampleStats"];
            var samples = object["samples"];
            if ( sampleStats == undefined && samples != undefined )
            {
                this.samples = samples;
            }

            var validSize: boolean = this.isValid();
            if ( sampleStats == undefined && validSize )
            {
                this.calculateSampleStats();
            }
            else
            {
                if ( sampleStats != undefined )
                {
                    this.sampleStats.deserialise( sampleStats );
                }
            }

            if ( validSize )
            {
                var winsorisedStats = object[ "winsorisedStats" ];
                if ( winsorisedStats == undefined )
                {
                    this.calculatePercentileStats();
                }
                else
                {
                    this.median = object["median"];
                    this.q1 = object["Q1"];
                    this.q3 = object["Q3"];
                    this.outliers = object["outliers"];

                    if ( this.storeSamples() )
                    {
                        this.inliers = object[ "inliers" ];
                    }

                    if ( this.hasSufficientInliers() )
                    {
                        this.winsorisedStats.deserialise( winsorisedStats );
                    }
                }
            }
        }

        setSamplesForCorrection( samples: BenchmarkData, baseline: BenchmarkData ): void
        {
            var baselineAvg: number = baseline.sampleStats.average;
            var sampleAvg: number = samples.sampleStats.average;

            var corrected: Array< number > = new Array;

            samples.samples.forEach( ( value, index ) =>
            {
                corrected[ index ] = value - baselineAvg;
            } );


            this.setSamples( corrected, false );

            var sampleVec: Array< number > = samples.samples;
            var baselineVec: Array< number > = baseline.samples;

            this.sampleStats.average = Statistics.calculateMean( corrected );

            var meanVar: number = samples.sampleStats.variance + baseline.sampleStats.variance -
                Statistics.calculateCovariance( sampleVec, sampleAvg, baselineVec, baselineAvg, this.isSample );
            this.sampleStats.variance = meanVar / sampleVec.length;


            this.sampleStats.standardDeviation = Statistics.calculateStandardDeviation( this.sampleStats.variance );

            if ( this.isValid() )
            {
                var wsampleVec: Array< number > = samples.winsorised;
                var wbaselineVec: Array< number > = baseline.winsorised;

                var wbaselineAvg: number = baseline.winsorisedStats.average;
                var wsampleAvg: number = samples.winsorisedStats.average;

                this.winsorisedStats.average = Statistics.calculateMean( wsampleVec );

                var wmeanVar: number = samples.winsorisedStats.variance + baseline.winsorisedStats.variance -
                    Statistics.calculateCovariance( wsampleVec, wsampleAvg, wbaselineVec, wbaselineAvg, this.isSample );

                this.winsorisedStats.variance = wmeanVar / wsampleVec.length;

                this.winsorisedStats.standardDeviation = Statistics.calculateStandardDeviation( this.winsorisedStats.variance );
            }
        }

        setSamples( samples: Array< number >, calculateStatistics: boolean = true ): void
        {
            this.samples = samples;
            this.calculateSampleStats( calculateStatistics );
            this.calculatePercentileStats( calculateStatistics );
        }

        isValid(): boolean
        {
            return this.samples.length > 1;
        }

        hasSufficientInliers(): boolean
        {
            return this.inliers.length > 1;
        }

        private calculateWinsorisedSamples( low: number, high: number ): void
        {
            var wsamples: Array< number > = this.inliers;

            this.outliers.forEach( outlier =>
            {
                if ( outlier <= low )
                {
                    wsamples.unshift( low );
                }
                else if ( outlier >= high )
                {
                    wsamples.unshift( high );
                }
            } );

            this.winsorised = wsamples;
        }

        private calculatePercentileStats( calculateStatistics: boolean = true ): void
        {
            if ( !this.isValid() )
            {
                return;
            }

            var sortedSamples: Array< number > = this.samples;
            sortedSamples.sort( ( a, b ) => a - b );

            var length: number = sortedSamples.length;
            var half: number = Math.floor( length / 2 );
            var quart: number = Math.floor( half / 2 );

            this.median = this.calculateQ( sortedSamples, half );
            this.q1 = this.calculateQ.call( sortedSamples, half - quart );
            this.q3 = this.calculateQ.call( sortedSamples, half + quart );


            var IQR: number = this.q3 - this.q1;
            var lower: number = this.q1 - 1.5 * IQR;
            var upper: number = this.q3 + 1.5 * IQR;
            sortedSamples.forEach( ( value =>
            {
                if ( lower <= value && value <= upper )
                {
                    this.inliers.unshift( value );
                }
                else
                {
                    this.outliers.unshift( value );
                }
            } ) );

            if ( this.hasSufficientInliers() )
            {
                this.winsorisedStats.low = this.inliers[ 0 ];
                this.winsorisedStats.high = this.inliers[ this.inliers.length - 1 ];

                if ( calculateStatistics )
                {
                    this.calculateWinsorisedSamples( this.winsorisedStats.low, this.winsorisedStats.high );

                    var stats: Statistics = new Statistics( this.winsorised );
                    this.winsorisedStats.average = stats.mean;
                    this.winsorisedStats.standardDeviation = stats.standardDeviation;
                    this.winsorisedStats.variance = stats.variance;
                }
            }
        }

        private calculateSampleStats( calculateStatistics: boolean = true )
        {
            if ( calculateStatistics )
            {
                var sampleStats = new Statistics( this.samples, this.isSample );
                this.sampleStats.average = sampleStats.mean;
                this.sampleStats.standardDeviation = sampleStats.standardDeviation;
                this.sampleStats.variance = sampleStats.variance;
            }

            this.sampleStats.low = this.samples.min();
            this.sampleStats.high = this.samples.max();
        }

        private storeSamples(): boolean
        {
            return this.isCorrected;
        }

        private calculateQ( array, place )
        {
            var length = array.length;
            if ( length % 2 !== 0 )
            {
                return array[ place ];
            }
            else
            {
                return ( array[ place - 1 ] + array[ place ] ) * 0.5;
            }
        }
    }
}