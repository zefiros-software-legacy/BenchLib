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

#include "benchmark/histogram.h"

BenchLib::Histogram::Histogram()
    : mStandardDeviation( 0.0f ),
      mVariance( 0.0f ),
      mAverage( 0.0f )
{

}

BenchLib::Histogram::Histogram( const std::vector< uint64_t > &data )
{
    Calculate( data );
}

void BenchLib::Histogram::Calculate( const std::vector< uint64_t > &data )
{
    CalculateAverage( data );


    CalculateStandardDeviation( data );
}

void BenchLib::Histogram::Clear()
{
    mCounts.clear();
    mStandardDeviation = 0.0f;
    mVariance = 0.0f;
    mAverage = 0.0f;
}

const std::map< uint64_t, std::size_t> &BenchLib::Histogram::GetResults() const
{
    return mCounts;
}

double BenchLib::Histogram::GetStandardDeviation() const
{
    return mStandardDeviation;
}

double BenchLib::Histogram::GetVariance() const
{
    return mVariance;
}

double BenchLib::Histogram::GetAverage() const
{
    return mAverage;
}

void BenchLib::Histogram::CalculateAverage( const std::vector< uint64_t > &data )
{
    double sum = 0;

    for ( std::vector< uint64_t >::const_iterator it = data.begin(), end = data.end(); it != end; ++it )
    {
        const uint64_t value = *it;
        ++mCounts[ value ];
        sum += value;
    }

    mAverage = sum / data.size();
}

void BenchLib::Histogram::CalculateStandardDeviation( const std::vector< uint64_t > &data )
{
    double varianceSum = 0;

    for ( std::vector< uint64_t >::const_iterator it = data.begin(), end = data.end(); it != end; ++it )
    {
        const double value = std::fabs( *it - mAverage );
        varianceSum += value * value;
    }

    mVariance = varianceSum / data.size();
    mStandardDeviation = std::sqrt( mVariance );
}
