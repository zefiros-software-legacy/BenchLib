/**
 * Copyright (c) 2017 Zefiros Software.
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
#ifndef __BENCHLIB__BENCHMARKGROUP_H__
#define __BENCHLIB__BENCHMARKGROUP_H__

#include "benchmark/console.h"

#include <vector>
#include <map>

namespace BenchLib
{

    template< typename tBenchmarkType >
    class BenchmarkGroup
    {
    public:

        BenchmarkGroup()
        {
        }

        BenchmarkGroup( const std::string &name )
            : mName( name )
        {
        }

        ~BenchmarkGroup()
        {
            for ( auto &it : mAll )
            {
                delete it.second;
            }
        }

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartArray();

            for ( auto &it : mAll )
            {
                it.second->Serialise( writer );
            }

            writer.EndArray();
        }

        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            for ( auto it = reader.Begin(), end = reader.End(); it != end; ++it )
            {
                const std::string name = ( *it )["name"].GetString();
                auto fit = mAll.find( name );

                if ( fit == mAll.end() )
                {
                    Benchmark *benchmark = new Benchmark();
                    benchmark->Deserialise( *it );
                    AddBenchmark( benchmark );
                }
                else
                {
                    fit->second->Deserialise( *it );
                }
            }
        }

        bool RunBenchmarks()
        {
            std::size_t failCount = 0;

            for ( auto &it : mAll )
            {
                const std::string name = it.first;
                tBenchmarkType *benchmark = it.second;

                if ( benchmark->IsShadow() )
                {
                    continue;
                }

                Console::Run( mName, name );

                try
                {
                    benchmark->OnInit();

                    benchmark->CalculateOperationCount();

                    benchmark->OnRun();

                    benchmark->Analyse();

                    benchmark->OnFinalise();

                    SetCompleted( benchmark, name );
                }
                catch ( const std::exception &ex )
                {
                    std::cerr << ex.what() << std::endl;

                    ++failCount;
                    SetFailed( benchmark, name );
                }
                catch ( ... )
                {
                    ++failCount;
                    SetFailed( benchmark, name );
                }

            }

            return failCount == 0;
        }

        bool AddBenchmark( tBenchmarkType *benchmark )
        {
            const std::string name = benchmark->GetName();
            auto it = mAll.find( name );

            if ( it == mAll.end() )
            {
                mAll[name] = benchmark;
                return true;
            }

            return false;
        }

        const std::vector< tBenchmarkType * > &GetFailed() const
        {
            return mFailed;
        }

        const std::vector< tBenchmarkType * > GetRegressed() const
        {
            std::vector< tBenchmarkType * > regressed;

            for ( tBenchmarkType *completed : mCompleted )
            {
                if ( completed->GetRegression() != ( uint32_t )Regression::None )
                {
                    regressed.push_back( completed );
                }
            }

            return regressed;
        }

        const std::vector< tBenchmarkType * > &GetCompleted() const
        {
            return mCompleted;
        }

        std::size_t GetSize() const
        {
            return mAll.size();
        }

        std::string GetName() const
        {
            return mName;
        }

    private:

        std::map<std::string, tBenchmarkType * > mAll;

        std::vector< tBenchmarkType *> mCompleted;
        std::vector< tBenchmarkType *> mFailed;

        std::string mName;

        void SetFailed( tBenchmarkType *benchmark, const std::string name )
        {
            mFailed.push_back( benchmark );

            benchmark->SetCompleted( false );

            Console::Fail( benchmark->GetGroup(), name );
        }

        void SetCompleted( tBenchmarkType *benchmark, const std::string name )
        {
            mCompleted.push_back( benchmark );

            benchmark->SetCompleted( true );

            Console::Done( mName, name, benchmark->GetSampleDuration(), benchmark->GetBaselineDuration() );
        }

    };

}

#endif