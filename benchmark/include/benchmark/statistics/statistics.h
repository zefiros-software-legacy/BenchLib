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
#ifndef __BENCHLIB__STATISTICS_H__
#define __BENCHLIB__STATISTICS_H__

#include <assert.h>
#include <numeric>
#include <vector>
#include <cmath>

namespace BenchLib
{
    template< typename tDataType >
    class Statistics
    {
    public:

        Statistics( const std::vector< tDataType > &data )
        {
            mMean = CalculateMean( data );
            mVariance = CalculateVariance( data, mMean );
            mStandardDeviation = std::sqrt( mVariance );
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

    private:

        tDataType mStandardDeviation;
        tDataType mVariance;
        tDataType mMean;

        tDataType CalculateMean( const std::vector< tDataType > &data ) const
        {
            assert( !data.empty() );
            return std::accumulate( data.begin(), data.end(), 0.0f ) / data.size();
        }

        tDataType CalculateVariance( const std::vector< tDataType > &data, tDataType mean ) const
        {
            assert( data.size() > 1 );
            tDataType temp = 0;

            for ( tDataType value : data )
            {
                tDataType valueSqrt = value - mean;
                temp += valueSqrt * valueSqrt;
            }

            return temp / ( data.size() - 1 );
        }

    };

}

#endif