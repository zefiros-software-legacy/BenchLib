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
#ifndef __BENCHLIB__MICRORESULT_H__
#define __BENCHLIB__MICRORESULT_H__

#include "benchmark/benchmarkData.h"

namespace BenchLib
{
    template< bool isCurrent = false>
    class BenchmarkResult
    {
    public:

        BenchmarkResult()
            : mTimeCorrected( true ),
              mMemoryCorrected( true ),
              mOperationCount( 0 ),
              mSampleCount( 0 ),
              mRegression( 0 ),
              mMemoryProfile( true ),
              mCompleted( false )
        {
        }

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            if ( mCompleted )
            {
                writer.String( "operationCount" );
                writer.Uint( mOperationCount );

                writer.String( "sampleCount" );
                writer.Uint( mSampleCount );

                writer.String( "regression" );
                writer.Uint( mRegression );

#ifdef _WIN32
#   pragma warning(push)
#   pragma warning(disable: 4127)
#endif

                if ( isCurrent )
                {
                    writer.String( "timeSamples" );
                    mTimeSamples.Serialise( writer );

                    writer.String( "timeBaseline" );
                    mTimeBaseline.Serialise( writer );
                }

#ifdef _WIN32
#   pragma warning(disable: 4127)
#endif

                writer.String( "timeCorrected" );
                mTimeCorrected.Serialise( writer );

                if ( mMemoryProfile )
                {
                    writer.String( "memoryProfile" );
                    writer.Bool( mMemoryProfile );

                    writer.String( "memorySamples" );
                    mMemorySamples.Serialise( writer );

                    writer.String( "memoryBaseline" );
                    mMemoryBaseline.Serialise( writer );

                    writer.String( "memoryCorrected" );
                    mMemoryCorrected.Serialise( writer );

                    writer.String( "memoryLeaks" );
                    writer.StartArray();

                    for ( MemLeak &leak : mMemoryLeaks )
                    {
                        ::BenchLib::Serialise( leak, writer );
                    }

                    writer.EndArray();
                }
            }

            writer.String( "timestamp" );
            writer.String( mTimestamp.c_str() );

            writer.String( "completed" );
            writer.Bool( mCompleted );

            writer.EndObject();
        }


        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            mCompleted = reader["completed"].GetBool();
            mTimestamp = reader["timestamp"].GetString();

            if ( mCompleted )
            {
                mOperationCount = reader["operationCount"].GetUint();
                mSampleCount = reader["sampleCount"].GetUint();

                if ( reader.HasMember( "regression" ) )
                {
                    mRegression = reader["regression"].GetUint();
                }
                else
                {
                    mRegression = 0;
                }

#ifdef _WIN32
#   pragma warning(push)
#   pragma warning(disable: 4127)
#endif

                if ( isCurrent )
                {
                    mTimeSamples.Deserialise( reader["timeSamples"] );
                    mTimeBaseline.Deserialise( reader["timeBaseline"] );
                }

#ifdef _WIN32
#   pragma warning(disable: 4127)
#endif

                if ( !reader.HasMember( "timeCorrected" ) )
                {
                    mTimeCorrected.SetSamplesForCorrection( mTimeSamples, mTimeBaseline );
                }
                else
                {
                    mTimeCorrected.Deserialise( reader["timeCorrected"] );
                }

                if ( reader.HasMember( "memoryProfile" ) )
                {
                    mMemoryProfile = reader["memoryProfile"].GetBool();

                    if ( mMemoryProfile )
                    {
                        mMemorySamples.Deserialise( reader["memorySamples"] );
                        mMemoryBaseline.Deserialise( reader["memoryBaseline"] );
                        mMemoryCorrected.Deserialise( reader["memoryCorrected"] );

                        if ( reader.HasMember( "memoryLeaks" ) )
                        {
                            const rapidjson::Value &leaks = reader["memoryLeaks"];

                            for ( auto it = leaks.Begin(), end = leaks.End(); it != end; ++it )
                            {
                                MemLeak leak;
                                ::BenchLib::Deserialise( leak, *it );
                                mMemoryLeaks.emplace_back( leak );
                            }
                        }
                    }
                }
            }
        }

        const BenchmarkData< double, double > &GetTimeSamples() const
        {
            return mTimeSamples;
        }

        BenchmarkData< double, double > &GetTimeSamples()
        {
            return mTimeSamples;
        }

        void SetTimeSamples( BenchmarkData< double, double > val )
        {
            mTimeSamples = val;
        }

        const BenchmarkData< double, double > &GetTimeBaseline() const
        {
            return mTimeBaseline;
        }

        BenchmarkData< double, double > &GetTimeBaseline()
        {
            return mTimeBaseline;
        }

        void SetTimeBaseline( const BenchmarkData< double, double > &val )
        {
            mTimeBaseline = val;
        }

        const BenchmarkData< double, double > &GetTimeCorrected() const
        {
            return mTimeCorrected;
        }

        BenchmarkData< double, double > &GetTimeCorrected()
        {
            return mTimeCorrected;
        }

        void SetTimeCorrected( const BenchmarkData< double, double > &val )
        {
            mTimeCorrected = val;
        }

        const BenchmarkData< double, int64_t, false > &GetMemorySamples() const
        {
            return mMemorySamples;
        }

        BenchmarkData< double, int64_t, false > &GetMemorySamples()
        {
            return mMemorySamples;
        }

        void SetMemorySamples( const BenchmarkData< double, int64_t, false > &val )
        {
            mMemorySamples = val;
        }

        const BenchmarkData< double, int64_t, false > &GetMemoryBaseline() const
        {
            return mMemoryBaseline;
        }

        BenchmarkData< double, int64_t, false> &GetMemoryBaseline()
        {
            return mMemoryBaseline;
        }

        void SetMemoryBaseline( const BenchmarkData< double, int64_t, false > &val )
        {
            mMemoryBaseline = val;
        }

        const BenchmarkData< double, int64_t, false > &GetMemoryCorrected() const
        {
            return mMemoryCorrected;
        }

        BenchmarkData< double, int64_t, false > &GetMemoryCorrected()
        {
            return mMemoryCorrected;
        }

        void SetMemoryCorrected( const BenchmarkData< double, int64_t, false > &val )
        {
            mMemoryCorrected = val;
        }

        std::size_t GetOperationCount() const
        {
            return mOperationCount;
        }

        void SetOperationCount( std::size_t val )
        {
            mOperationCount = val;
        }

        std::size_t GetSampleCount() const
        {
            return mSampleCount;
        }

        void SetSampleCount( std::size_t val )
        {
            mSampleCount = val;
        }

        const std::vector< MemLeak > &GetMemoryLeaks() const
        {
            return mMemoryLeaks;
        }

        std::vector< MemLeak > &GetMemoryLeaks()
        {
            return mMemoryLeaks;
        }

        void SetMemoryLeaks( const std::vector< MemLeak > &val )
        {
            mMemoryLeaks = val;
        }

        std::string GetTimestamp() const
        {
            return mTimestamp;
        }

        void SetTimestamp( std::string val )
        {
            mTimestamp = val;
        }

        uint32_t GetRegression() const
        {
            return mRegression;
        }

        void SetRegression( uint32_t val )
        {
            mRegression = val;
        }

        bool GetMemoryProfile() const
        {
            return mMemoryProfile;
        }

        void SetMemoryProfile( bool val )
        {
            mMemoryProfile = val;
        }

        bool IsCompleted() const
        {
            return mCompleted;
        }

        void SetCompleted( bool val )
        {
            mCompleted = val;
        }

        void SetWingsorise( bool val )
        {
            mTimeSamples.SetWinsorise( val );
            mTimeBaseline.SetWinsorise( val );
            mTimeCorrected.SetWinsorise( val );
        }

    private:

        BenchmarkData< double, double > mTimeSamples;
        BenchmarkData< double, double > mTimeBaseline;
        BenchmarkData< double, double > mTimeCorrected;

        BenchmarkData< double, int64_t, false > mMemorySamples;
        BenchmarkData< double, int64_t, false > mMemoryBaseline;
        BenchmarkData< double, int64_t, false > mMemoryCorrected;

        std::vector< MemLeak > mMemoryLeaks;
        std::string mTimestamp;

        std::size_t mOperationCount;
        std::size_t mSampleCount;
        uint32_t mRegression;

        bool mMemoryProfile;
        bool mCompleted;
    };

}

#endif