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
#ifndef __ANALYSIS_H__
#define __ANALYSIS_H__

#include "benchmark/histogram.h"
#include "benchmark/timer.h"

#include <stdint.h>
#include <vector>

namespace BenchLib
{

    class Analysis
    {
    public:

        Analysis();

        void Calculate( const TimePoint *const results, TimePoint start, std::size_t samples, std::size_t operations );

        void Clear();

        double GetStandardDeviation() const;

        double GetVariance() const;

        double GetAverage() const;

        uint64_t GetTotalTime() const;

        double GetLowest() const;

        double GetHighest() const;

        const Histogram &GetHistogram() const;

    private:

        Histogram mHistogram;

        uint64_t mTotalTime;

        uint64_t mLowest;
        uint64_t mHighest;

        std::size_t mSamples;
        std::size_t mOperations;

        void ProcessRawData( const TimePoint *const results, TimePoint start, std::vector< uint64_t > &times, std::size_t samples );

    };

}

#endif