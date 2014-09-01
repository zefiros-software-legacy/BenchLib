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
#ifndef __BENCHLIB__BENCHMARKGROUP_H__
#define __BENCHLIB__BENCHMARKGROUP_H__

#include "benchmark/console.h"

#include <unordered_map>
#include <vector>

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
                    MicroBenchmark *benchmark = new MicroBenchmark();
                    benchmark->Deserialise( *it );
                    AddBenchmark( benchmark );

                    mAll[name] = benchmark;
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
                    benchmark->CalculateOperationCount();

                    benchmark->RunBaseline();

                    benchmark->RunSamples();

                    const bool result = benchmark->Analyse();

                    if ( result )
                    {
                        SetCompleted( benchmark, name );
                    }
                    else
                    {
                        SetFailed( failCount, benchmark, name );
                    }
                }
                catch ( const std::exception &ex )
                {
                    std::cerr << ex.what() << std::endl;

                    SetFailed( failCount, benchmark, name );
                }
                catch ( ... )
                {
                    SetFailed( failCount, benchmark, name );
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
                mAll[benchmark->GetName()] = benchmark;
                return true;
            }

            return false;
        }

        const std::vector< tBenchmarkType * > &GetFailed() const
        {
            return mFailed;
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

        std::unordered_map<std::string, tBenchmarkType * > mAll;

        std::vector< tBenchmarkType *> mCompleted;
        std::vector< tBenchmarkType *> mFailed;

        std::string mName;

        std::size_t SetFailed( std::size_t &failCount, tBenchmarkType *benchmark, const std::string name )
        {
            ++failCount;

            mFailed.push_back( benchmark );

            benchmark->SetCompleted( false );

            Console::Fail( benchmark->GetGroup(), name );   return failCount;
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