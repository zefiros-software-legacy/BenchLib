/// <reference path="config.ts"/> 

module BenchViewer.Core
{
    export class Statistics
    {
        standardDeviation: number = 0.0;
        variance: number = 0.0;
        mean: number = 0.0;

        constructor( data: Array< number >, isSample: boolean = true )
        {
            this.mean = Statistics.calculateMean( data );
            this.variance = Statistics.calculateVariance( data, this.mean, isSample );
            this.standardDeviation = Statistics.calculateStandardDeviation( this.variance );
        }

        static calculateStandardDeviation( variance: number ): number
        {
            return Math.sqrt( variance );
        }

        static calculateMean( data ): number
        {
            if ( data.length > 0 )
            {
                return data.reduce( ( ( a, b ) => a + b ) ) / data.length;
            }
            return 0;
        }

        static calculateVariance( data: Array< number >, mean: number, isSample: boolean = true ): number
        {
            if ( data.length > 1 )
            {
                var temp = 0.0;
                data.forEach( ( element =>
                {
                    var v = element - mean;
                    temp += v * v;
                } ) );
                return temp / this.getSize( data.length - 1 );
            }
            return 0;
        }

        static calculateCovariance( samples: Array< number >, sampleMean: number,
                                    baseline: Array< number >, baselineMean: number, isSample: boolean = true ): number
        {
            var sampleSize: number = samples.length;
            if ( sampleSize > 1 && sampleSize == baseline.length )
            {
                var temp: number = 0;

                for ( var i: number = 0; i < sampleSize; ++i )
                {
                    temp += ( samples[ i ] - sampleMean ) * ( baseline[ i ] - baselineMean );
                }
                return temp / Statistics.getSize( sampleSize, isSample );
            }

            return 0.0;
        }

        static getConfidenceIntervalFromHistory(history: Array<Statistics.StatHistory>, isSample: boolean = true): Statistics.ConfidenceInterval
        {
            var interval: Statistics.ConfidenceInterval;

            var historySampleSize: number = 0;
            var scaledHistoryPooledVariance: number = 0;
            var scaledHistoryMean: number = 0;

            history.forEach( stat =>
            {
                historySampleSize += stat.sampleCount;
                scaledHistoryMean += stat.sampleCount * stat.average;

                scaledHistoryPooledVariance += Statistics.getSize( stat.sampleCount, isSample ) * stat.variance;
            } );

            var historyPooledStdev: number = Math.sqrt( scaledHistoryPooledVariance / historySampleSize );
            var historyMean: number = scaledHistoryMean / historySampleSize;

            return Statistics.getConfidenceInterval( historyPooledStdev, historySampleSize, historyMean );
        }

        static getConfidenceInterval( stdev: number, size: number, mean: number ): Statistics.ConfidenceInterval
        {
            var interval: Statistics.ConfidenceInterval = new Statistics.ConfidenceInterval;

            if ( size > 0 )
            {
                var zAlphaOver2: number = Statistics.normalCDFInverse( 1 - Config.alpha * 0.5 );
                var offset: number = ( stdev * zAlphaOver2 ) / Math.sqrt( size );

                interval.lower = mean - offset;
                interval.upper = mean + offset;
            }
            else
            {
                interval.lower = 0;
                interval.upper = 0;
            }

            return interval;
        }

        // ReSharper disable once InconsistentNaming
        static normalCDFInverse( p: number ): number
        {
            if ( p < 0.5 )
            {
                // F^-1(p) = - G^-1(p)
                return -Statistics.rationalApproximation( Math.sqrt( -2.0 * Math.log( p ) ) );
            }
            else
            {
                // F^-1(p) = G^-1(1-p)
                return Statistics.rationalApproximation( Math.sqrt( -2.0 * Math.log( 1 - p ) ) );
            }
        }

        private calculateVariance( data: Array< number >, mean: number, isSample: boolean = true ): number
        {
            if ( data.length > 1 )
            {
                var temp: number = 0;

                data.forEach( value =>
                {
                    var valueSqrt: number = value - mean;
                    temp += valueSqrt * valueSqrt;
                } );

                return temp / Statistics.getSize( data.length, isSample );
            }

            return 0.0;
        }

        private static rationalApproximation( t: number ): number
        {
            // Abramowitz and Stegun formula 26.2.23.
            // The absolute value of the error should be less than 4.5 e-4.
            var c: number[] = [ 2.515517, 0.802853, 0.010328 ];
            var d: number[] = [ 1.432788, 0.189269, 0.001308 ];
            return t - ( ( c[ 2 ] * t + c[ 1 ] ) * t + c[ 0 ] ) /
                ( ( ( d[ 2 ] * t + d[ 1 ] ) * t + d[ 0 ] ) * t + 1.0 );
        }

        private static getSize( size: number, isSample: boolean = true ): number
        {
            return isSample ? size - 1 : size;
        }
    }

    export module Statistics
    {
        export class StatHistory
        {
            sampleCount: number = 0;
            average: number = 0;
            variance: number = 0;
        }

        export class ConfidenceInterval
        {
            lower: number = 0;
            upper: number = 0;
        }
    }
}