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

#include "benchmark/analysis.h"

BenchLib::Analysis::Analysis()
    : mTotalTime( 0 ),
      mLowest( 0 ),
      mHighest( 0 ),
      mSamples( 0 ),
      mOperations( 0 )
{
}

void BenchLib::Analysis::Calculate( const TimePoint *const results, TimePoint start, std::size_t samples, std::size_t operations )
{
    mSamples = samples,
    mOperations = operations;

    std::vector< uint64_t > times( samples );

    ProcessRawData( results, start, times, samples );

    mHistogram.Calculate( times );
}

void BenchLib::Analysis::Clear()
{
    mHistogram.Clear();

    mTotalTime = 0;

    mLowest = 0;
    mHighest = 0;

    mSamples = 0;
    mOperations = 0;
}

double BenchLib::Analysis::GetStandardDeviation() const
{
    return mHistogram.GetStandardDeviation() / mOperations;
}

double BenchLib::Analysis::GetVariance() const
{
    return mHistogram.GetVariance() / mOperations;
}

double BenchLib::Analysis::GetAverage() const
{
    return mHistogram.GetAverage() / mOperations;
}

uint64_t BenchLib::Analysis::GetTotalTime() const
{
    return mTotalTime;
}

double BenchLib::Analysis::GetLowest() const
{
    return ( double )mLowest / mOperations;
}

double BenchLib::Analysis::GetHighest() const
{
    return ( double )mHighest / mOperations;
}

const BenchLib::Histogram &BenchLib::Analysis::GetHistogram() const
{
    return mHistogram;
}

void BenchLib::Analysis::ProcessRawData( const TimePoint *const results, TimePoint start, std::vector< uint64_t > &times,
        std::size_t samples )
{
    times.reserve( samples );

    TimePoint previous = results[0];
    uint64_t duration = std::chrono::duration_cast<std::chrono::milliseconds>( previous - start ).count();
    times[ 0 ] = duration;
    mLowest = duration;
    mHighest = duration;

    for ( std::size_t i = 1; i < samples; ++i )
    {
        TimePoint time = results[i];
        duration = std::chrono::duration_cast<std::chrono::milliseconds>( time - previous ).count();
        previous = time;

        if ( duration < mLowest )
        {
            mLowest = duration;
        }
        else if ( duration > mHighest )
        {
            mHighest = duration;
        }

        times[ i ] = duration;
    }

    mTotalTime = std::chrono::duration_cast<std::chrono::milliseconds>( results[ samples - 1 ] - start ).count();
}
