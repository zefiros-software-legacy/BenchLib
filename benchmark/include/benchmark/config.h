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
#ifndef __BENCHLIB__CONFIG_H__
#define __BENCHLIB__CONFIG_H__

#include <string>

namespace BenchLib
{

#define BENCHLIB_MICRO_MAX_HISTORY 20
#define BENCHLIB_MICRO_ALPHA 0.02
#define BENCHLIB_WINSORISING_ANALSYSIS false
#define BENCHLIB_VIEWER_VAR "benchmarkData"
#define BENCHLIB_MIN_MS_PER_BENCH_UNIT 10

    static struct Config
    {
        std::size_t microMaxHistory;
        std::size_t minMsPerBenchUnit;

        std::string viewerVar;
        std::string timestamp;

        double alpha;

        bool winsoriseAnalysis;

        Config()
            : microMaxHistory( BENCHLIB_MICRO_MAX_HISTORY ),
              minMsPerBenchUnit( BENCHLIB_MIN_MS_PER_BENCH_UNIT ),
              alpha( BENCHLIB_MICRO_ALPHA ),
              winsoriseAnalysis( BENCHLIB_WINSORISING_ANALSYSIS )
        {
        }

    } gConfig;


    template< typename tWriter >
    void Serialise( Config &config, tWriter &writer )
    {
        writer.StartObject();

        writer.String( "microMaxHistory" );
        writer.Uint( static_cast<uint32_t>( config.microMaxHistory ) );

        writer.String( "minMsPerBenchUnit" );
        writer.Uint( static_cast<uint32_t>( config.minMsPerBenchUnit ) );

        writer.String( "alpha" );
        writer.Double( config.alpha );

        writer.String( "winsoriseAnalysis" );
        writer.Bool( config.winsoriseAnalysis );

        writer.EndObject();
    }

    template< typename tReader >
    void Deserialise( Config &config, tReader &reader )
    {
        config.microMaxHistory = reader["microMaxHistory"].GetUint();
        config.minMsPerBenchUnit = reader["minMsPerBenchUnit"].GetUint();
        config.alpha = reader["alpha"].GetDouble();
        config.winsoriseAnalysis = reader["winsoriseAnalysis"].GetBool();
    }
}

#endif