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

#include "benchmark/benchmarkResult.h"
#include "benchmark/IBenchmarkCase.h"
#include "benchmark/benchmarkData.h"
#include "benchmark/regression.h"
#include "benchmark/console.h"
#include "benchmark/config.h"
#include "benchmark/memory.h"
#include "benchmark/timer.h"
#include "benchmark/util.h"

#include <vector>
#include <mutex>
#include <cmath>

namespace BenchLib
{

    class Benchmark
        : public IBenchmarkCase
    {
    public:

        struct Case
        {
            virtual ~Case()
            {
            }

            virtual void Run()
            {

            }

            virtual void Baseline()
            {

            }

            virtual void Init()
            {

            }

            virtual void Finalise()
            {

            }

            std::mutex mRunMutex;
            std::mutex mBaselineMutex;
            std::mutex mInitMutex;
            std::mutex mFinaliseMutex;
        };

        Benchmark()
            : mBenchmarkCase( nullptr )
        {

        }

        Benchmark( Case *benchCase )
            : mBenchmarkCase( benchCase )
        {

        }

        ~Benchmark()
        {
            delete mBenchmarkCase;
        }

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            writer.String( "name" );
            writer.String( GetName().c_str() );

            writer.String( "current" );
            mCurrent.Serialise<tWriter >( writer );

            writer.String( "history" );
            writer.StartArray();

            for ( auto it = mHistory.rbegin(), end = mHistory.rend(); it != end; ++it )
            {
                it->Serialise<tWriter >( writer );
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
                BenchmarkResult<> result;

                result.Deserialise< tReader >( *it );

                mHistory.emplace_back( result );
            }

            const std::size_t size = mHistory.size();
            const std::size_t maxHist = gConfig.microMaxHistory - 1;
            const std::size_t newSize = size > maxHist ? maxHist : size;
            mHistory = std::vector< BenchmarkResult<> >( mHistory.begin() + size - newSize, mHistory.end() );

            BenchmarkResult<> current;

            current.Deserialise<tReader >( reader["current"] );

            mHistory.emplace_back( current );

            std::reverse( mHistory.begin(), mHistory.end() );
        }

        virtual void OnInit()
        {
            mCurrent.SetMemoryProfile( IsProfileMemoryEnabled() );
            mCurrent.SetTimestamp( gConfig.timestamp );
            mCurrent.SetWingsorise( GetWinsorise() );
            mCurrent.SetSampleCount( GetSampleCount() );
        }

        virtual void OnRun()
        {
            if ( IsProfileMemoryEnabled() )
            {
                RunMemorySamples();
                RunMemoryBaseline();
            }

            RunTime();
        }

        virtual void OnFinalise()
        {

        }

        virtual void Analyse()
        {
            Console::Baseline( GetOverhead() );

            Console::PrintResult();
            Console::Result( mCurrent.GetTimeSamples().GetSampleStats() );

            Console::PrintResultCorrected();
            Console::Result( mCurrent.GetTimeCorrected().GetSampleStats() );

            uint32_t regression = ( uint32_t )Regression::None;

            std::vector< BenchmarkResult<> * > completedResults = GetCompletedResults();

            if ( !completedResults.empty() )
            {
                Statistics<double>::ConfidenceInterval histInterval;

                std::vector< Statistics<double>::StatHistory > history;

                for ( BenchmarkResult<> *result : completedResults )
                {
                    BenchmarkData< double, double > &timeCorrected = result->GetTimeCorrected();

                    BenchmarkStat<double> sampleStat;

                    if ( GetWinsorise() )
                    {
                        sampleStat = timeCorrected.GetWingsorisedStats();
                    }
                    else
                    {
                        sampleStat = timeCorrected.GetSampleStats();
                    }

                    Statistics<double>::StatHistory stat;
                    stat.average = sampleStat.average;
                    stat.variance = sampleStat.variance;
                    stat.sampleCount = result->GetSampleCount();
                    history.push_back( stat );
                }

                Statistics<double>::GetConfidenceIntervalFromHistory( history, histInterval );


                Statistics<double>::ConfidenceInterval currentInterval;
                BenchmarkStat<double> stats = GetWinsorise() ? mCurrent.GetTimeCorrected().GetWingsorisedStats() :
                                              mCurrent.GetTimeCorrected().GetSampleStats();

                Statistics<double>::GetConfidenceInterval( stats.standardDeviation, mCurrent.GetSampleCount(), stats.average,
                                                           currentInterval );


                if ( currentInterval.upper < histInterval.lower )
                {
                    regression |= ( uint32_t )Regression::TimeFaster;
                    Console::RegressTimeFaster( histInterval.lower, histInterval.upper, currentInterval.upper );
                }
                else if ( currentInterval.lower > histInterval.upper )
                {
                    regression |= ( uint32_t )Regression::TimeSlower;
                    Console::RegressTimeSlower( histInterval.lower, histInterval.upper, currentInterval.lower );
                }
            }

            if ( IsProfileMemoryEnabled() )
            {
                std::vector< Statistics<double, int64_t>::StatHistory > statHistory;
                std::vector< int64_t > peaks;

                for ( BenchmarkResult<> *result : completedResults )
                {
                    std::size_t sampleCount = result->GetMemoryCorrected().GetSamples().size();

                    BenchmarkStat<double, int64_t> sampleStat = result->GetMemoryCorrected().GetSampleStats();

                    if ( result->GetMemoryProfile() && sampleCount > 0 )
                    {
                        Statistics<double, int64_t>::StatHistory stat;
                        stat.average = sampleStat.average;
                        stat.variance = sampleStat.variance;
                        stat.sampleCount = sampleCount;

                        statHistory.push_back( stat );
                    }

                    peaks.push_back( sampleStat.high );
                }

                if ( !statHistory.empty() )
                {
                    Statistics<double, int64_t>::ConfidenceInterval interval;
                    Statistics<double, int64_t>::GetConfidenceIntervalFromHistory( statHistory, interval );

                    BenchmarkStat< double, int64_t > sampleStats = mCurrent.GetMemoryCorrected().GetSampleStats();
                    double average = sampleStats.average;

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

                    BenchmarkData< double, int64_t > peakData;
                    peakData.SetSamples( peaks );

                    BenchmarkStat< double, int64_t > peakStats = peakData.GetSampleStats();

                    Statistics<double, int64_t>::ConfidenceInterval peakInterval;
                    Statistics<double, int64_t>::GetConfidenceInterval( peakStats.standardDeviation, peaks.size(), peakStats.average,
                                                                        peakInterval );

                    if ( sampleStats.high < peakInterval.lower )
                    {
                        regression |= ( uint32_t )Regression::PeakMemSmaller;
                        Console::RegressPeakMemSmaller( peakInterval.lower, peakInterval.upper, sampleStats.high );
                    }
                    else if ( sampleStats.high > peakInterval.upper )
                    {
                        regression |= ( uint32_t )Regression::PeakMemLarger;
                        Console::RegressPeakMemLarger( peakInterval.lower, peakInterval.upper, sampleStats.high );
                    }
                }
            }

            mCurrent.SetRegression( regression );
        }

        virtual bool IsCompleted() const
        {
            return mCurrent.IsCompleted();
        }

        virtual void SetCompleted( bool isCompleted )
        {
            mCurrent.SetCompleted( isCompleted );
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
            return mCurrent.GetOperationCount();
        }

        void CalculateOperationCount()
        {
            const int64_t minTimeRequiredPerUnit = gConfig.minMsPerBenchUnit;
            size_t operationCount = 0;

            const TimePoint start = Clock::now();

            while ( Timer<std::chrono::milliseconds>::GetDuration( start ).count() < minTimeRequiredPerUnit )
            {
                ++operationCount;

                RunSamples();
            }

            mCurrent.SetOperationCount( operationCount );

            Console::Stats( GetSampleCount(), GetOperationCount() );
        }

        std::size_t GetSampleCount() const
        {
            assert( false );
            return 0;
        }

        bool GetWinsorise() const
        {
            return gConfig.winsoriseAnalysis;
        }

        uint32_t GetRegression() const
        {
            return mCurrent.GetRegression();
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

    private:

        std::vector< BenchmarkResult<> > mHistory;
        std::mutex mMutex;

        BenchmarkResult< true > mCurrent;

        std::string mShadowName;

        Case *mBenchmarkCase;

        double mBaselineDuration;
        double mSampleDuration;

        void RunMemorySamples()
        {
            std::vector< int64_t > samples;
            Memory::GetInstance().StartProfile();

            RunSamples();

            Memory::GetInstance().EndProfile( samples, mCurrent.GetMemoryLeaks() );

            mCurrent.GetMemorySamples().SetSamples( samples );
            mCurrent.GetMemoryCorrected().SetSamplesForCorrection( mCurrent.GetMemorySamples(), mCurrent.GetMemoryBaseline(),
                                                                   mCurrent.GetOperationCount() );
        }

        void RunTime()
        {
            const std::size_t sampleCount = GetSampleCount();
            const std::size_t operationCount = GetOperationCount();
            std::vector<double> samples( sampleCount );
            std::vector<double> baseline( sampleCount );


            for ( volatile std::size_t i = 0; i < sampleCount; ++i )
            {
                {
                    TimePoint startTime = Clock::now();
                    {
                        std::lock_guard< std::mutex > lock( mMutex );

                        for ( volatile std::size_t j = 0; j < operationCount; ++j )
                        {
                            RunSamples();
                        }
                    }

                    samples[i] = Timer<>::GetDuration( startTime ).count() / operationCount;
                }

                {
                    TimePoint startTime = Clock::now();
                    {
                        std::lock_guard< std::mutex > lock( mMutex );

                        for ( volatile std::size_t j = 0; j < operationCount; ++j )
                        {
                            RunBaseline();
                        }
                    }

                    baseline[i] = Timer<>::GetDuration( startTime ).count() / operationCount;
                }
            }

            mBaselineDuration = std::accumulate( baseline.begin(), baseline.end(), 0.0f );
            mSampleDuration = std::accumulate( samples.begin(), samples.end(), 0.0f );

            mCurrent.GetTimeBaseline().SetSamples( baseline );
            mCurrent.GetTimeSamples().SetSamples( samples );

            mCurrent.GetTimeCorrected().SetSamplesForCorrection( mCurrent.GetTimeSamples(), mCurrent.GetTimeBaseline(),
                                                                 mCurrent.GetOperationCount() );
        }

        void RunMemoryBaseline()
        {
            std::vector< int64_t > samples;
            Memory::GetInstance().StartProfile();

            RunBaseline();

            Memory::GetInstance().EndProfile( samples );

            if ( !samples.empty() )
            {
                mCurrent.GetMemoryBaseline().SetSamples( samples );
            }
        }

        virtual double GetOverhead() const
        {
            return mCurrent.GetTimeBaseline().GetSampleStats().average;
        }

        std::vector< BenchmarkResult<> * > GetCompletedResults()
        {
            std::vector< BenchmarkResult<> * > results;

            for ( BenchmarkResult<> &result : mHistory )
            {
                if ( result.IsCompleted() )
                {
                    results.push_back( &result );
                }
            }

            return results;
        }

        inline void RunSamples()
        {
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mInitMutex );
                mBenchmarkCase->Init();
            }
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mRunMutex );
                mBenchmarkCase->Run();
            }
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mFinaliseMutex );
                mBenchmarkCase->Finalise();
            }
        }

        inline void RunBaseline()
        {
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mInitMutex );
                mBenchmarkCase->Init();
            }
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mBaselineMutex );
                mBenchmarkCase->Baseline();
            }
            {
                std::lock_guard< std::mutex > lock( mBenchmarkCase->mFinaliseMutex );
                mBenchmarkCase->Finalise();
            }
        }

    };

}

#endif