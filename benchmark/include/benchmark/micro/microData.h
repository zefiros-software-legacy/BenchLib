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
#include "benchmark/micro/microStat.h"

#include <algorithm>

namespace BenchLib
{

#pragma warning(push)
#pragma warning(disable: 4127)

    template< typename tDataType >
    class MicroData
    {
    public:

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            if ( IsValid() )
            {
                writer.String( "sampleStats" );
                ::BenchLib::Serialise( mSampleStats, writer );
            }

            writer.String( "samples" );
            writer.StartArray();

            for ( tDataType &value : mSamples )
            {
                writer.Double( static_cast< double >( value ) );
            }

            writer.EndArray();

            if ( IsValid() )
            {
                writer.String( "median" );
                writer.Double( static_cast< double >( mMedian ) );

                writer.String( "Q1" );
                writer.Double( static_cast< double >( mQ1 ) );

                writer.String( "Q3" );
                writer.Double( static_cast< double >( mQ3 ) );

                if ( mInliers.size() > 1 )
                {
                    writer.String( "inlierStats" );
                    ::BenchLib::Serialise( mInlierStats, writer );
                }

                writer.String( "inliers" );
                writer.StartArray();

                for ( tDataType &value : mInliers )
                {
                    writer.Double( static_cast< double >( value ) );
                }

                writer.EndArray();

                writer.String( "outliers" );
                writer.StartArray();

                for ( tDataType &value : mOutliers )
                {
                    writer.Double( static_cast< double >( value ) );
                }

                writer.EndArray();
            }

            writer.EndObject();
        }

        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            const rapidjson::Value &samples = reader["samples"];

            for ( auto it = samples.Begin(), end = samples.End(); it != end; ++it )
            {
                mSamples.push_back( static_cast< tDataType>( it->GetDouble() ) );
            }

            const bool validSize = IsValid();

            if ( !reader.HasMember( "sampleStats" ) && validSize )
            {
                CalculateSampleStats();
            }
            else
            {
                if ( validSize )
                {
                    ::BenchLib::Deserialise( mSampleStats, reader["sampleStats"] );
                }
            }

            if ( validSize )
            {
                if ( !reader.HasMember( "inliers" ) || !reader.HasMember( "outliers" ) )
                {
                    CalculatePercentileStats();
                }
                else
                {
                    mMedian = static_cast< tDataType>( reader["median"].GetDouble() );
                    mQ1 = static_cast< tDataType>( reader["Q1"].GetDouble() );
                    mQ3 = static_cast< tDataType>( reader["Q3"].GetDouble() );

                    const rapidjson::Value &outliers = reader["outliers"];

                    for ( auto it = outliers.Begin(), end = outliers.End(); it != end; ++it )
                    {
                        mOutliers.push_back( static_cast< tDataType>( it->GetDouble() ) );
                    }

                    const rapidjson::Value &inliers = reader["inliers"];

                    for ( auto it = inliers.Begin(), end = inliers.End(); it != end; ++it )
                    {
                        mInliers.push_back( static_cast< tDataType>( it->GetDouble() ) );
                    }

                    if ( mInliers.size() > 1 )
                    {
                        ::BenchLib::Deserialise( mInlierStats, reader["inlierStats"] );
                    }
                }
            }
        }

        void SetSamples( std::vector< tDataType > samples, tDataType correction )
        {
            for ( double &value : samples )
            {
                value -= correction;
            }

            SetSamples( samples );
        }

        void SetSamples( const std::vector< tDataType > &samples )
        {
            mSamples = samples;
            CalculateSampleStats();
            CalculatePercentileStats();
        }

        MicroStat< tDataType > GetInlierStats() const
        {
            return mInlierStats;
        }

        MicroStat< tDataType > GetSampleStats() const
        {
            return mSampleStats;
        }

        tDataType GetMedian() const
        {
            return mMedian;
        }

        tDataType GetQ1() const
        {
            return mQ1;
        }

        tDataType GetQ3() const
        {
            return mQ3;
        }

        bool IsValid() const
        {
            return mSamples.size() > 1;
        }

        const std::vector< tDataType > &GetSamples() const
        {
            return mSamples;
        }

        const std::vector< tDataType > &GetInliers() const
        {
            return mInliers;
        }

        const std::vector< tDataType > &GetOutliers() const
        {
            return mOutliers;
        }

    private:

        std::vector< tDataType > mSamples;
        std::vector< tDataType > mInliers;
        std::vector< tDataType > mOutliers;

        MicroStat< tDataType > mInlierStats;
        MicroStat< tDataType > mSampleStats;

        tDataType mMedian;
        tDataType mQ1;
        tDataType mQ3;

        void CalculatePercentileStats()
        {
            if (!IsValid())
            {
                return;
            }

            std::vector< tDataType > sortedSamples( mSamples );
            std::sort( sortedSamples.begin(), sortedSamples.end() );

            std::size_t size = mSamples.size();
            std::size_t half = size / 2;
            std::size_t quart = half / 2;

            mMedian = CalculateQ( sortedSamples, half );
            mQ1 = CalculateQ( sortedSamples, half - quart );
            mQ3 = CalculateQ( sortedSamples, half + quart );


            tDataType IQR = mQ3 - mQ1 + std::numeric_limits<tDataType>::epsilon();
            tDataType lower = mQ1 - 1.5 * IQR;
            tDataType upper = mQ3 + 1.5 * IQR;

            for ( tDataType value : sortedSamples )
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

            if ( mInliers.size() > 1 )
            {
                Statistics< tDataType > stats( mInliers );
                mInlierStats.average = stats.GetMean();
                mInlierStats.standardDeviation = stats.GetStandardDeviation();
                mInlierStats.low = *mInliers.begin();
                mInlierStats.high = *--mInliers.end();
            }
        }

        void CalculateSampleStats()
        {
            Statistics< tDataType > sampleStats( mSamples );
            mSampleStats.average = sampleStats.GetMean();
            mSampleStats.standardDeviation = sampleStats.GetStandardDeviation();
            mSampleStats.low = *std::min_element( mSamples.begin(), mSamples.end() );
            mSampleStats.high = *std::max_element( mSamples.begin(), mSamples.end() );
        }

        static tDataType CalculateQ( const std::vector< tDataType > &data, std::size_t place )
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

#pragma warning(pop)

}

#endif