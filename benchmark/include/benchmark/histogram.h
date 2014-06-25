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
#ifndef __HISTOGRAM_H__
#define __HISTOGRAM_H__

#include <stdint.h>
#include <vector>
#include <map>

namespace BenchLib
{
    class Histogram
    {
    public:

        Histogram();

        Histogram( const std::vector< uint64_t > &data );

        void Calculate( const std::vector< uint64_t > &data );

        void Clear();

        const std::map< uint64_t, std::size_t> &GetResults() const;

        double GetStandardDeviation() const;

        double GetVariance() const;

        double GetAverage() const;

    private:

        std::map< uint64_t, std::size_t > mCounts;
        double mStandardDeviation;
        double mVariance;
        double mAverage;

        void CalculateAverage( const std::vector< uint64_t > &data );

        void CalculateStandardDeviation( const std::vector< uint64_t > &data );

    };
}

#endif