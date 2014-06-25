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
#ifndef __BENCHMARK_H__
#define __BENCHMARK_H__

#include "benchmark/benchmarkCase.h"
#include "benchmark/console.h"
#include "benchmark/util.h"

#include <unordered_set>
#include <string>
#include <set>
#include <map>

#include <iostream>

// #define BASELINE( group, name ) \
//     class CONCAT( ___, group, name )    \
//     { \
//         void CONCAT( BaseLine, group, name )() \
//         {   \
//         }   \
//     }

#define BENCHMARK( group, name, samples )                                                               \
    namespace __Benchmark                                                                               \
    {                                                                                                   \
        class CONCAT( ___, group, name )                                                                \
            : public BenchLib::BenchmarkCase< CONCAT( ___, group, name ), samples >                     \
        {                                                                                               \
        public:                                                                                         \
            std::string GetName() const                                                                 \
            {                                                                                           \
                return #name;                                                                           \
            }                                                                                           \
            std::string GetGroup() const                                                                \
            {                                                                                           \
                return #group;                                                                          \
            }                                                                                           \
            inline void Body();                                                                         \
        };                                                                                              \
        volatile bool CONCAT( ___gResult, group, name ) =                                               \
                BenchLib::RegisterBenchmark( #group, #name, new CONCAT( ___, group, name ) );           \
    }                                                                                                   \
    inline void __Benchmark::CONCAT( ___, group, name )::Body()


// #define BASELINE_VAR( group, name )
//
// #define BENCHMARK_VAR( group, name, variant, samples )

namespace BenchLib
{
    class BenchmarkIntern
    {
    public:

        int32_t RunBenchmarks();

        bool RegisterBenchmark( const std::string &group, const std::string &name, IBenchmarkCase *benchCase );

        static BenchmarkIntern &GetInstance();

    private:

        std::map< std::string, std::vector< std::pair< std::string, IBenchmarkCase * > > > mBenchmarkCases;
        std::map< std::string, std::unordered_set< std::string > > mUsedBenchmarkCases;

        std::vector< std::pair< std::string, std::string > > mFailedBenchmarks;

        std::map< std::string, std::vector< BaselineAnalysis > > mNormalBaselineResults;
        std::map< std::string, std::vector< Analysis > > mNormalBenchmarkResults;

        std::set< std::string > mGroups;

        BenchmarkIntern();

        ~BenchmarkIntern();

        BenchmarkIntern &operator=( BenchmarkIntern & );

        bool ProcessNormalBenchmarks( const std::string &group, uint64_t &totalTime );

        std::size_t GetBenchmarkCount() const;

        std::size_t GetNormalBenchmarkCount() const;

        std::size_t GetGroupCount() const;

        std::size_t GetGroupSize( const std::string &group ) const;

        std::size_t GetNormalGroupSize( const std::string &group ) const;
    };

    bool RegisterBenchmark( const std::string &group, const std::string &name, IBenchmarkCase *benchCase );

    int32_t RunAll();
}

#endif