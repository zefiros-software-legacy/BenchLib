/**
 * Copyright (c) 2016  Koen Visscher, Mick van Duijn and Paul Visscher
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
#pragma once
#ifndef __BENCHLIB__STATISTICS_H__
#define __BENCHLIB__STATISTICS_H__

#include "benchmark/config.h"

#include <assert.h>
#include <numeric>
#include <limits>
#include <vector>
#include <cmath>

namespace BenchLib
{
    template< typename tDataType, typename tSampleType = tDataType, bool isSample = true >
    class Statistics
    {
    public:

        struct StatHistory
        {
            std::size_t sampleCount;
            tDataType average;
            tDataType variance;
        };

        struct ConfidenceInterval
        {
            tDataType lower;
            tDataType upper;
        };

        Statistics( const std::vector< tSampleType > &data )
        {
            mMean = CalculateMean( data );
            mVariance = CalculateVariance( data, mMean );
            mStandardDeviation = CalculateStandardDeviation( mVariance );
        }

        tDataType GetMean() const
        {
            return mMean;
        }

        tDataType GetVariance() const
        {
            return mVariance;
        }

        tDataType GetStandardDeviation() const
        {
            return mStandardDeviation;
        }

        static tDataType CalculateStandardDeviation( tDataType variance )
        {
            return std::sqrt( variance );
        }

        static tDataType CalculateMean( const std::vector< tSampleType > &data )
        {
            if ( !data.empty() )
            {
                return std::accumulate( data.begin(), data.end(), 0.0f ) / data.size();
            }

            return 0;
        }

        static tDataType CalculateVariance( const std::vector< tSampleType > &samples, tDataType sampleMean,
                                            const std::vector< tSampleType > &baseline, tDataType baselineMean, size_t operationCount )
        {
            const std::size_t sampleSize = samples.size();

            if ( sampleSize > 1 && sampleSize == baseline.size() )
            {
                tDataType temp = 0;
                tDataType tempE = 0;
                tDataType tempC = 0;

                for ( std::size_t i = 0; i < sampleSize; ++i )
                {
                    temp += ( samples[i] - sampleMean ) * ( samples[i] - sampleMean );
                    tempE += ( baseline[i] - baselineMean ) * ( baseline[i] - baselineMean );
                    tempC += ( baseline[i] - baselineMean ) * ( samples[i] - sampleMean );
                }

                return operationCount * ( temp - tempE + tempC ) / sampleSize;
            }

            return 0.0f;
        }

        static tDataType CalculateCovariance( const std::vector< tSampleType > &samples, tDataType sampleMean,
                                              const std::vector< tSampleType > &baseline, tDataType baselineMean )
        {
            const std::size_t sampleSize = samples.size();

            if ( sampleSize > 1 && sampleSize == baseline.size() )
            {
                tDataType temp = 0;

                for ( std::size_t i = 0; i < sampleSize; ++i )
                {
                    temp += ( samples[i] - sampleMean ) * ( baseline[i] - baselineMean );
                }

                return temp / GetSize( sampleSize );
            }

            return 0.0f;
        }

        static void GetConfidenceIntervalFromHistory( std::vector< StatHistory > &history, ConfidenceInterval &interval )
        {
            std::size_t historySampleSize = 0;
            tDataType scaledHistoryPooledVariance = 0;
            tDataType scaledHistoryMean = 0;

            for ( StatHistory &stat : history )
            {
                historySampleSize += stat.sampleCount;
                scaledHistoryMean += stat.sampleCount * stat.average;

                scaledHistoryPooledVariance += GetSize( stat.sampleCount ) * stat.variance;
            }

            tDataType historyPooledStdev = std::sqrt( scaledHistoryPooledVariance / historySampleSize );
            tDataType historyMean = scaledHistoryMean / historySampleSize;

            GetConfidenceInterval( historyPooledStdev, historySampleSize, historyMean, interval );
        }

        static void GetConfidenceInterval( tDataType stdev, std::size_t size, tDataType mean, ConfidenceInterval &interval )
        {
            if ( size > 0 )
            {
                tDataType zAlphaOver2 = NormalCDFInverse( 1 - gConfig.alpha * 0.5f );
                tDataType offset = ( stdev * zAlphaOver2 ) / std::sqrt( size );

                interval.lower = mean - offset - std::numeric_limits<float>::epsilon();
                interval.upper = mean + offset + std::numeric_limits<float>::epsilon();
            }
            else
            {
                interval.lower = 0;
                interval.upper = 0;
            }
        }

        // http://www.johndcook.com/cpp_phi_inverse.html
        static tDataType NormalCDFInverse( tDataType p )
        {
            assert( p >= 0.0f && p <= 1.0f );

            if ( p < 0.5 )
            {
                // F^-1(p) = - G^-1(p)
                return -RationalApproximation( sqrt( -2.0 * log( p ) ) );
            }
            else
            {
                // F^-1(p) = G^-1(1-p)
                return RationalApproximation( sqrt( -2.0 * log( 1 - p ) ) );
            }

        }

    private:

        tDataType mStandardDeviation;
        tDataType mVariance;
        tDataType mMean;

        tDataType CalculateVariance( const std::vector< tSampleType > &data, tDataType mean ) const
        {
            if ( data.size() > 1 )
            {
                tDataType temp = 0;

                for ( tDataType value : data )
                {
                    tDataType valueSqrt = value - mean;
                    temp += valueSqrt * valueSqrt;
                }



                return temp / GetSize( data.size() );
            }

            return 0.0f;
        }

        // http://www.johndcook.com/cpp_phi_inverse.html
        static tDataType RationalApproximation( tDataType t )
        {
            // Abramowitz and Stegun formula 26.2.23.
            // The absolute value of the error should be less than 4.5 e-4.
            tDataType c[] = {2.515517, 0.802853, 0.010328};
            tDataType d[] = {1.432788, 0.189269, 0.001308};
            return t - ( ( c[2] * t + c[1] ) * t + c[0] ) /
                   ( ( ( d[2] * t + d[1] ) * t + d[0] ) * t + 1.0 );
        }

        static std::size_t GetSize( std::size_t size )
        {
            return isSample ? size - 1 : size;
        }
    };

}

#endif