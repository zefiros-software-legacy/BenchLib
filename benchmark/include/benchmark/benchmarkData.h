/**
* Copyright (c) 2014  Koen Visscher, Mick van Duijn and Paul Visscher
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
#ifndef __BENCHLIB__MICRODATA_H__
#define __BENCHLIB__MICRODATA_H__

#include "benchmark/statistics/statistics.h"
#include "benchmark/benchmarkStat.h"

#include <algorithm>

namespace BenchLib
{

    template< typename tDataType, typename tSampleType = tDataType, bool isSample = true >
    class BenchmarkData
    {
    public:

        BenchmarkData( bool isCorrected = false )
            : mMedian( 0 ),
              mQ1( 0 ),
              mQ3( 0 ),
              mWinsorise( false ),
              mIsCorrected( isCorrected )
        {
        }

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            writer.String( "sampleStats" );
            ::BenchLib::Serialise< tDataType, tSampleType, tWriter >( mSampleStats, writer );

            if ( StoreSamples() )
            {
                writer.String( "samples" );
                writer.StartArray();

                for ( tSampleType &value : mSamples )
                {
                    writer.Double( static_cast< double >( value ) );
                }

                writer.EndArray();
            }

            if ( IsValid() )
            {
                writer.String( "median" );
                writer.Double( static_cast< double >( mMedian ) );

                writer.String( "Q1" );
                writer.Double( static_cast< double >( mQ1 ) );

                writer.String( "Q3" );
                writer.Double( static_cast< double >( mQ3 ) );

                if ( !mInliers.empty() )
                {
                    writer.String( "winsorisedStats" );
                    ::BenchLib::Serialise< tDataType, tSampleType, tWriter >( mWinsorisedStats, writer );
                }

                if ( StoreSamples() )
                {
                    writer.String( "inliers" );
                    writer.StartArray();

                    for ( tSampleType &value : mInliers )
                    {
                        writer.Double( static_cast< double >( value ) );
                    }

                    writer.EndArray();

                    writer.String( "outliers" );
                    writer.StartArray();

                    for ( tSampleType &value : mOutliers )
                    {
                        writer.Double( static_cast< double >( value ) );
                    }

                    writer.EndArray();
                }
            }

            writer.EndObject();
        }

        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            if ( !reader.HasMember( "sampleStats" ) && reader.HasMember( "samples" ) )
            {
                const rapidjson::Value &samples = reader["samples"];

                for ( auto it = samples.Begin(), end = samples.End(); it != end; ++it )
                {
                    mSamples.push_back( static_cast< tSampleType>( it->GetDouble() ) );
                }
            }

            const bool validSize = IsValid();

            if ( !reader.HasMember( "sampleStats" ) && validSize )
            {
                CalculateSampleStats();
            }
            else
            {
                if ( reader.HasMember( "sampleStats" ) )
                {
                    ::BenchLib::Deserialise< tDataType, tSampleType >( mSampleStats, reader["sampleStats"] );
                }
            }

            if ( validSize )
            {
                if ( !reader.HasMember( "winsorisedStats" ) )
                {
                    CalculatePercentileStats();
                }
                else
                {
                    mMedian = static_cast< tSampleType>( reader["median"].GetDouble() );
                    mQ1 = static_cast< tSampleType>( reader["Q1"].GetDouble() );
                    mQ3 = static_cast< tSampleType>( reader["Q3"].GetDouble() );

                    const rapidjson::Value &outliers = reader["outliers"];

                    for ( auto it = outliers.Begin(), end = outliers.End(); it != end; ++it )
                    {
                        mOutliers.push_back( static_cast< tSampleType>( it->GetDouble() ) );
                    }

                    if ( StoreSamples() )
                    {
                        const rapidjson::Value &inliers = reader["inliers"];

                        for ( auto it = inliers.Begin(), end = inliers.End(); it != end; ++it )
                        {
                            mInliers.push_back( static_cast< tSampleType>( it->GetDouble() ) );
                        }
                    }

                    if ( HasSufficientInliers() )
                    {
                        ::BenchLib::Deserialise< tDataType, tSampleType >( mWinsorisedStats, reader["wingsorisedStats"] );
                    }
                }
            }
        }

        void SetSamplesForCorrection( const BenchmarkData< tDataType, tSampleType, isSample > &samples,
                                      const BenchmarkData< tDataType, tSampleType, isSample > &baseline, size_t operationCount )
        {
            const tDataType baselineAvg = baseline.GetSampleStats().average;
            const tDataType sampleAvg = samples.GetSampleStats().average;

            std::vector< tSampleType > corrected( samples.GetSamples() );

            for ( tSampleType &value : corrected )
            {
                value -= baselineAvg;
            }

            SetSamples( corrected, false );

            const std::vector< tSampleType > &sampleVec = samples.GetSamples();
            const std::vector< tSampleType > &baselineVec = baseline.GetSamples();

            mSampleStats.average = Statistics< tDataType, tSampleType, isSample>::CalculateMean( corrected );

            mSampleStats.variance = Statistics< tDataType, tSampleType, isSample>::CalculateVariance( sampleVec, sampleAvg,
                                                                                                      baselineVec, baselineAvg, operationCount );

            mSampleStats.standardDeviation = Statistics< tDataType, tSampleType, isSample>::CalculateStandardDeviation(
                                                 mSampleStats.variance );

            if ( IsValid() )
            {
                const std::vector< tSampleType > &wsampleVec = samples.GetWinsorised();
                const std::vector< tSampleType > &wbaselineVec = baseline.GetWinsorised();

                const tDataType wbaselineAvg = baseline.GetWingsorisedStats().average;
                const tDataType wsampleAvg = samples.GetWingsorisedStats().average;

                mWinsorisedStats.average = Statistics< tDataType, tSampleType, isSample>::CalculateMean( wsampleVec );

                tDataType wmeanVar = samples.GetWingsorisedStats().variance + baseline.GetWingsorisedStats().variance -
                                     2 * Statistics< tDataType, tSampleType, isSample>::CalculateCovariance( wsampleVec, wsampleAvg,
                                                                                                             wbaselineVec, wbaselineAvg );

                mWinsorisedStats.variance = wmeanVar / wsampleVec.size();

                mWinsorisedStats.standardDeviation = Statistics< tDataType, tSampleType, isSample>::CalculateStandardDeviation(
                                                         mWinsorisedStats.variance );
            }
        }

        void SetSamples( const std::vector< tSampleType > &samples, bool calculateStatistics = true )
        {
            mSamples = samples;
            CalculateSampleStats( calculateStatistics );
            CalculatePercentileStats( calculateStatistics );
        }

        BenchmarkStat< tDataType, tSampleType > GetWingsorisedStats() const
        {
            return mWinsorisedStats;
        }

        BenchmarkStat< tDataType, tSampleType > GetSampleStats() const
        {
            return mSampleStats;
        }

        tSampleType GetMedian() const
        {
            return mMedian;
        }

        tSampleType GetQ1() const
        {
            return mQ1;
        }

        tSampleType GetQ3() const
        {
            return mQ3;
        }

        bool IsValid() const
        {
            return mSamples.size() > 1;
        }

        const std::vector< tSampleType > &GetSamples() const
        {
            return mSamples;
        }

        const std::vector< tSampleType > &GetInliers() const
        {
            return mInliers;
        }

        const std::vector< tSampleType > &GetOutliers() const
        {
            return mOutliers;
        }

        const std::vector< tSampleType > &GetWinsorised() const
        {
            return mWinsorised;
        }

        void SetWinsorise( bool val )
        {
            mWinsorise = val;
        }

        bool HasSufficientInliers()
        {
            return mInliers.size() > 1;
        }

    private:

        std::vector< tSampleType > mSamples;
        std::vector< tSampleType > mInliers;
        std::vector< tSampleType > mOutliers;
        std::vector< tSampleType > mWinsorised;

        BenchmarkStat< tDataType, tSampleType > mSampleStats;
        BenchmarkStat< tDataType, tSampleType > mWinsorisedStats;

        tSampleType mInlierHigh;
        tSampleType mInlierLow;

        tSampleType mMedian;
        tSampleType mQ1;
        tSampleType mQ3;

        bool mWinsorise;
        bool mIsCorrected;

        void CalculateWinsorisedSamples( tSampleType low, tSampleType high )
        {
            std::vector< tSampleType > wsamples( mInliers );
            wsamples.reserve( wsamples.size() + mOutliers.size() );

            for ( tSampleType outlier : mOutliers )
            {
                if ( outlier <= low )
                {
                    wsamples.push_back( low );
                }
                else if ( outlier >= high )
                {
                    wsamples.push_back( high );
                }
                else
                {
                    // We could call this situation quite awkward
                    assert( false );
                }

                mWinsorised = wsamples;
            }
        }

        void CalculatePercentileStats( bool calculateStatistics = true )
        {
            if ( !IsValid() )
            {
                return;
            }

            std::vector< tSampleType > sortedSamples( mSamples );
            std::sort( sortedSamples.begin(), sortedSamples.end() );

            std::size_t size = mSamples.size();
            std::size_t half = size / 2;
            std::size_t quart = half / 2;

            mMedian = CalculateQ( sortedSamples, half );
            mQ1 = CalculateQ( sortedSamples, half - quart );
            mQ3 = CalculateQ( sortedSamples, half + quart );

            tDataType IQR = mQ3 - mQ1 + std::numeric_limits<tDataType>::epsilon();
            tDataType lower = mQ1 - 3.5f * IQR;
            tDataType upper = mQ3 + 3.5f * IQR;

            for ( tSampleType value : sortedSamples )
            {
                if ( lower <= value && value <= upper )
                {
                    mInliers.push_back( value );
                }
                else
                {
                    mOutliers.push_back( value );
                }
            }

            if ( HasSufficientInliers() )
            {
                mWinsorisedStats.low = *mInliers.begin();
                mWinsorisedStats.high = *--mInliers.end();

                if ( calculateStatistics )
                {
                    CalculateWinsorisedSamples( mWinsorisedStats.low, mWinsorisedStats.high );

                    Statistics< tDataType, tSampleType, isSample > stats( mWinsorised );
                    mWinsorisedStats.average = stats.GetMean();
                    mWinsorisedStats.standardDeviation = stats.GetStandardDeviation();
                    mWinsorisedStats.variance = stats.GetVariance();
                }
            }
        }

        void CalculateSampleStats( bool calculateStatistics = true )
        {
            if ( calculateStatistics )
            {
                Statistics< tDataType, tSampleType, isSample > sampleStats( mSamples );
                mSampleStats.average = sampleStats.GetMean();
                mSampleStats.standardDeviation = sampleStats.GetStandardDeviation();
                mSampleStats.variance = sampleStats.GetVariance();
            }

            mSampleStats.low = *std::min_element( mSamples.begin(), mSamples.end() );
            mSampleStats.high = *std::max_element( mSamples.begin(), mSamples.end() );
        }

        bool StoreSamples() const
        {
            return mIsCorrected;
        }

        static tDataType CalculateQ( const std::vector< tSampleType > &data, std::size_t place )
        {
            if ( ( data.size() % 2 ) != 0 )
            {
                return data[place];
            }
            else
            {
                return ( data[place - 1] + data[place] ) * 0.5f;
            }
        }

    };

}

#endif