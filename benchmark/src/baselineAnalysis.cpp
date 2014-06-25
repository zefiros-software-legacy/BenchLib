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

#include "benchmark/baselineAnalysis.h"

BenchLib::BaselineAnalysis::BaselineAnalysis()
    : mCorrection( 0.0f )
{
}

void BenchLib::BaselineAnalysis::Calculate( const TimePoint *const results, TimePoint start, std::size_t samples,
        std::size_t operations )
{
    Analysis::Calculate( results, start, samples, operations );

    mTotalTime = std::chrono::duration_cast<std::chrono::milliseconds>( results[samples - 1] - start ).count();
    mCorrection = ( double )mTotalTime / operations;
}

double BenchLib::BaselineAnalysis::GetCorrection() const
{
    return mCorrection;
}

uint64_t BenchLib::BaselineAnalysis::GetTotalTime() const
{
    return mTotalTime;
}
