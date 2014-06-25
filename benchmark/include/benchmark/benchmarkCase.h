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
#ifndef __BENCHMARKCASE_H__
#define __BENCHMARKCASE_H__

#include "benchmark/abstract/IBenchmarkCase.h"

#include "benchmark/baselineAnalysis.h"
#include "benchmark/analysis.h"

#include <future>
#include <atomic>
#include <thread>
#include <chrono>

#include <stdint.h>

namespace BenchLib
{
    template< typename T, std::size_t Samples >
    class BenchmarkCase
        : public IBenchmarkCase
    {
    public:

        BenchmarkCase()
            : mOperations( 0 )
        {
        }

        void Start( Analysis &analysis )
        {
            TimePoint results[ Samples ];
            TimePoint startTime = Clock::now();

            for ( volatile std::size_t i = 0; i < Samples; ++i )
            {
                for ( volatile std::size_t j = 0; j < mOperations; ++j )
                {
                    Body();
                }

                results[i] = Clock::now();
            }

            analysis.Calculate( results, startTime, Samples, mOperations );
        }

        void Baseline( BaselineAnalysis &analysis )
        {
            TimePoint results[ Samples ];
            TimePoint startTime = Clock::now();

            for ( volatile std::size_t i = 0; i < Samples; ++i )
            {
                for ( volatile std::size_t j = 0; j < mOperations; ++j )
                {
                }

                results[i] = Clock::now();
            }

            analysis.Calculate( results, startTime, Samples, mOperations );
        }

        std::size_t GetSamples() const
        {
            return Samples;
        }

        std::size_t GetOperations() const
        {
            return mOperations;
        }

        void CalculateOperationCount()
        {
            const TimePoint start = Clock::now();
            const uint64_t minTimeRequiredPerUnit = 10;

            while ( std::chrono::duration_cast<std::chrono::milliseconds>( Clock::now() - start ).count() < minTimeRequiredPerUnit )
            {
                ++mOperations;
                Body();
            }
        }

        virtual inline void Body() = 0;

    private:

        std::size_t mOperations;

        void CalculateOperations( std::atomic_bool *peek )
        {
            while ( peek->load() )
            {
                ++mOperations;
                Body();
            }
        }
    };
}

#endif