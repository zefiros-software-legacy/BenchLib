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
#ifndef __BENCHLIB__MICROBENCHMARK_H__
#define __BENCHLIB__MICROBENCHMARK_H__

#include "benchmark/abstract/IBenchmarkCase.h"
#include "benchmark/micro/microResult.h"
#include "benchmark/micro/microData.h"
#include "benchmark/regression.h"
#include "benchmark/console.h"
#include "benchmark/config.h"
#include "benchmark/timer.h"
#include "benchmark/util.h"

#include <vector>
#include <cmath>

#define MICRO( group, name, samples, memoryProfile )                                                \
    namespace __Benchmark                                                                           \
    {                                                                                               \
        class CONCAT( ___, group, ___, name )                                                       \
            : public BenchLib::MicroBenchmark                                                       \
        {                                                                                           \
        public:                                                                                     \
            std::size_t GetSampleCount() const                                                      \
            {                                                                                       \
                return samples;                                                                     \
            }                                                                                       \
            std::string GetName() const                                                             \
            {                                                                                       \
                return #name;                                                                       \
            }                                                                                       \
            std::string GetGroup() const                                                            \
            {                                                                                       \
                return #group;                                                                      \
            }                                                                                       \
            virtual bool IsProfileMemoryEnabled() const                                             \
            {                                                                                       \
                return memoryProfile;                                                               \
            }                                                                                       \
            virtual bool IsShadow() const                                                           \
            {                                                                                       \
                return false;                                                                       \
            }                                                                                       \
            inline void Body();                                                                     \
        };                                                                                          \
        volatile bool CONCAT( ___gResult, group, ___, name ) =                                      \
                BenchLib::RegisterMicroBenchmark( #group, new CONCAT( ___, group, ___, name ) );    \
    }                                                                                               \
    inline void __Benchmark::CONCAT( ___, group, ___, name )::Body()

namespace BenchLib
{

    class MicroBenchmark
        : public IBenchmarkCase
    {
    public:

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            writer.String( "name" );
            writer.String( GetName().c_str() );

            writer.String( "current" );
            ::BenchLib::Serialise( mCurrent, writer );

            writer.String( "history" );
            writer.StartArray();

            for ( auto it = mHistory.rbegin(), end = mHistory.rend(); it != end; ++it )
            {
                ::BenchLib::Serialise( *it, writer );
            }

            writer.EndArray();

            writer.EndObject();
        }

        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            mShadowName = reader["name"].GetString();

            const rapidjson::Value &results = reader["history"];

            for ( auto it = results.Begin(), end = results.End(); it != end; ++it )
            {
                MicroResult result;

                ::BenchLib::Deserialise( result, *it );

                mHistory.emplace_back( result );
            }

            const std::size_t size = mHistory.size();
            const std::size_t maxHist = gConfig.microMaxHistory - 1;
            const std::size_t newSize = size > maxHist ? maxHist : size;
            mHistory = std::vector< MicroResult >( mHistory.begin() + size - newSize, mHistory.end() );

            MicroResult current;

            ::BenchLib::Deserialise( current, reader["current"] );

            mHistory.emplace_back( current );

            std::reverse( mHistory.begin(), mHistory.end() );
        }

        void RunSamples()
        {
            if ( IsProfileMemoryEnabled() )
            {
                RunMemorySamples();
            }

            RunTimeSamples();
        }

        void RunBaseline()
        {
            if ( IsProfileMemoryEnabled() )
            {
                RunMemoryBaseline();
            }

            RunTimeBaseline();
        }

        virtual void Analyse()
        {
            Console::Baseline( GetOverhead() );

            Console::PrintResult();
            Console::Result( mCurrent.timeSamples.GetSampleStats() );

            Console::PrintResultCorrected();
            Console::Result( mCurrent.timeCorrected.GetSampleStats() );

            uint32_t regression = ( uint32_t )Regression::None;

            std::vector< MicroResult * > completedResults = GetCompletedResults();

            if ( !completedResults.empty() )
            {
                Statistics<double>::ConfidenceInterval interval;

                if ( !gConfig.winsoriseAnalysis )
                {
                    std::vector< Statistics<double>::StatHistory > history;

                    for ( MicroResult *result : completedResults )
                    {
                        MicroStat<double> sampleStat = result->timeCorrected.GetSampleStats();

                        Statistics<double>::StatHistory stat;
                        stat.average = sampleStat.average;
                        stat.variance = sampleStat.variance;
                        stat.sampleCount = result->sampleCount;
                        history.push_back( stat );
                    }

                    Statistics<double>::GetConfidenceInterval( history, interval );
                }
                else
                {
                    std::vector<double> samples;

                    for ( MicroResult *result : completedResults )
                    {
                        std::vector<double> t = result->timeCorrected.GetWinsorisedSamples();

                        samples.reserve( samples.size() + t.size() );
                        samples.insert( samples.end(), t.begin(), t.end() );
                    }

                    Statistics< double > sampleStats( samples );
                    Statistics<double>::GetConfidenceInterval( sampleStats.GetStandardDeviation(), samples.size() , sampleStats.GetMean(),
                            interval );
                }

                double average;

                if ( !gConfig.winsoriseAnalysis )
                {
                    average = mCurrent.timeCorrected.GetSampleStats().average;
                }
                else
                {
                    MicroData< double > data;
                    data.SetSamples( mCurrent.timeCorrected.GetWinsorisedSamples() );
                    average = data.GetSampleStats().average;
                }

                if ( average < interval.lower )
                {
                    regression |= ( uint32_t )Regression::TimeFaster;
                    Console::RegressTimeFaster( interval.lower, interval.upper, average );
                }
                else if ( average > interval.upper )
                {
                    regression |= ( uint32_t )Regression::TimeSlower;
                    Console::RegressTimeSlower( interval.lower, interval.upper, average );
                }
            }

            if ( IsProfileMemoryEnabled() )
            {
                std::vector< Statistics<double, int64_t>::StatHistory > history;
                std::vector< int64_t > peaks;

                for ( MicroResult *result : completedResults )
                {
                    std::size_t sampleCount = result->memoryCorrected.GetSamples().size();

                    MicroStat<double, int64_t> sampleStat = result->memoryCorrected.GetSampleStats();

                    if ( result->memoryProfile && sampleCount > 0 )
                    {


                        Statistics<double, int64_t>::StatHistory stat;
                        stat.average = sampleStat.average;
                        stat.variance = sampleStat.variance;
                        stat.sampleCount = sampleCount;

                        history.push_back( stat );
                    }

                    peaks.push_back( sampleStat.high );
                }

                if ( !history.empty() )
                {
                    Statistics<double, int64_t>::ConfidenceInterval interval;
                    Statistics<double, int64_t>::GetConfidenceInterval( history, interval );

                    MicroStat< double, int64_t > stats = mCurrent.memoryCorrected.GetSampleStats();
                    double average = stats.average;

                    if ( average < interval.lower )
                    {
                        regression |= ( uint32_t )Regression::MemSmaller;
                        Console::RegressMemSmaller( interval.lower, interval.upper, average );
                    }
                    else if ( average > interval.upper )
                    {
                        regression |= ( uint32_t )Regression::MemLarger;
                        Console::RegressMemLarger( interval.lower, interval.upper, average );
                    }

                    MicroData< double, int64_t > peakData;
                    peakData.SetSamples( peaks );
                    MicroStat< double, int64_t > peakStats = peakData.GetSampleStats();

                    Statistics<double, int64_t>::ConfidenceInterval peakInterval;
                    Statistics<double, int64_t>::GetConfidenceInterval( peakStats.standardDeviation, peaks.size(), peakStats.average,
                            peakInterval );

                    if ( stats.high < peakInterval.lower )
                    {
                        regression |= ( uint32_t )Regression::PeakMemSmaller;
                        Console::RegressPeakMemSmaller( peakInterval.lower, peakInterval.upper, stats.high );
                    }
                    else if ( stats.high > peakInterval.upper )
                    {
                        regression |= ( uint32_t )Regression::PeakMemLarger;
                        Console::RegressPeakMemLarger( peakInterval.lower, peakInterval.upper, stats.high );
                    }
                }
            }

            mCurrent.regression = regression;
        }

        virtual bool IsCompleted() const
        {
            return mCurrent.completed;
        }

        virtual void SetCompleted( bool isCompleted )
        {
            mCurrent.completed = isCompleted;
        }

        virtual double GetSampleDuration() const
        {
            return mSampleDuration;
        }

        virtual double GetBaselineDuration() const
        {
            return mBaselineDuration;
        }

        std::size_t GetOperationCount() const
        {
            return mCurrent.operationCount;
        }

        void CalculateOperationCount()
        {
            mCurrent.memoryProfile = IsProfileMemoryEnabled();
            mCurrent.timestamp = gConfig.timestamp;
            mCurrent.operationCount = 0;
            mCurrent.sampleCount = GetSampleCount();
            const uint64_t minTimeRequiredPerUnit = 10;

            const TimePoint start = Clock::now();

            while ( Timer<std::chrono::milliseconds>::GetDuration( start ).count() < minTimeRequiredPerUnit )
            {
                ++mCurrent.operationCount;
                Body();
            }

            Console::Stats( GetSampleCount(), GetOperationCount() );
        }

        std::size_t GetSampleCount() const
        {
            assert( false );
            return 0;
        }

        std::string GetName() const
        {
            return mShadowName;
        }

        std::string GetGroup() const
        {
            assert( false );
            return "";
        }

        virtual bool IsProfileMemoryEnabled() const
        {
            return false;
        }

        virtual bool IsShadow() const
        {
            return true;
        }

        virtual inline void Body()
        {

        }

    private:

        std::vector< MicroResult > mHistory;

        MicroResult mCurrent;

        std::string mShadowName;

        double mBaselineDuration;
        double mSampleDuration;

        void RunMemorySamples()
        {
            std::vector< int64_t > samples;
            Memory::GetInstance().StartProfile();

            Body();

            Memory::GetInstance().EndProfile( samples, mCurrent.memoryLeaks );

            mCurrent.memorySamples.SetSamples( samples );
            mCurrent.memoryCorrected.SetSamples( samples, mCurrent.memoryBaseline.GetSampleStats().average );
        }

        void RunTimeSamples()
        {
            const std::size_t sampleCount = GetSampleCount();
            const std::size_t operationCount = GetOperationCount();
            std::vector<double> samples( sampleCount );
            TimePoint startTime = Clock::now();

            for ( volatile std::size_t i = 0; i < sampleCount; ++i )
            {
                for ( volatile std::size_t j = 0; j < operationCount; ++j )
                {
                    Body();
                }

                samples[i] = Timer<>::GetDuration( startTime ).count() / operationCount;
            }

            std::adjacent_difference( samples.begin(), samples.end(), samples.begin() );

            mCurrent.timeSamples.SetSamples( samples );
            mCurrent.timeCorrected.SetSamples( samples, mCurrent.timeBaseline.GetSampleStats().average );

            mSampleDuration = Timer<>::GetDuration( startTime ).count();
        }

        void RunMemoryBaseline()
        {
            // std::vector< int64_t > samples;
            // Memory::GetInstance().StartProfile();

            // EmptyBody();

            // Memory::GetInstance().EndProfile( samples );

            // if ( samples.size() > 1 )
            // {
            //     mCurrent.memoryBaseline.SetSamples( samples );
            // }
        }

        void RunTimeBaseline()
        {
            const std::size_t sampleCount = GetSampleCount();
            const std::size_t operationCount = GetOperationCount();
            std::vector<double> samples( sampleCount );
            TimePoint startTime = Clock::now();

            for ( volatile std::size_t i = 0; i < sampleCount; ++i )
            {
                for ( volatile std::size_t j = 0; j < operationCount; ++j )
                {
                }

                samples[i] = Timer<>::GetDuration( startTime ).count() / operationCount;
            }

            std::adjacent_difference( samples.begin(), samples.end(), samples.begin() );

            mBaselineDuration = Timer<>::GetDuration( startTime ).count();

            mCurrent.timeBaseline.SetSamples( samples );
        }

        virtual double GetOverhead() const
        {
            return mCurrent.timeBaseline.GetSampleStats().average;
        }

        std::vector< MicroResult * > GetCompletedResults()
        {
            std::vector< MicroResult * > results;

            for ( MicroResult &result : mHistory )
            {
                if ( result.completed )
                {
                    results.push_back( &result );
                }
            }

            return results;
        }

    };

}

#endif