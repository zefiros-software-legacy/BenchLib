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
#ifndef __CONSOLE_H__
#define __CONSOLE_H__

#include <stdint.h>
#include <vector>
#include <string>

namespace BenchLib
{
    namespace Console
    {
        void Init( std::size_t testCount, std::size_t groupCount );

        void GroupStart( const std::string &group, std::size_t groupSize );

        void NormalStart( std::size_t groupSize );

        void Run( const std::string &group, const std::string &name );

        void Stats( std::size_t samples, std::size_t operations );

        void Baseline( double correction );

        void Result( double avg, double sd, double low, double high );

        void ResultCorrected( double avg, double sd, double low, double high, double baseline );

        void Fail( const std::string &group, const std::string &name );

        void Done( const std::string &group, const std::string &name, uint64_t benchTime, uint64_t baselineTime );

        void GroupEnd( const std::string &group, std::size_t groupSize, uint64_t totalTime );

        void End( std::size_t totalBenchmarks, std::size_t totalGroups, uint64_t totalTime,
                  const std::vector< std::pair< std::string, std::string > > &failed );

        void PrintHeader();

        void PrintSubheader();

        void PrintRun();

        void PrintStats();

        void PrintBaseline();

        void PrintResult();

        void PrintResultCorrected();

        void PrintDone();

        void PrintCompleted();

        void PrintFail();

        void SetDefaultColour();

        void SetRedColour();

        void SetGreenColour();

        void SetBlueColour();

        void SetCyanColour();

        std::string GetBenchmarkAmount( std::size_t amount );

        std::string GetGroupAmount( std::size_t amount );
    }
}

#endif