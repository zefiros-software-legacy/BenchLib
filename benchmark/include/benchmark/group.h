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
#ifndef __BENCHLIB__GROUP_H__
#define __BENCHLIB__GROUP_H__

#include "benchmark/benchmark.h"
#include "benchmark/benchmarkGroup.h"
#include "benchmark/console.h"

#include <iostream>
#include <string>

namespace BenchLib
{

    class Group
    {
    public:

        Group()
        {
        }

        Group( const std::string &name )
            : mName( name ),
              mMicros( name )
        {
        }

        template< typename tWriter >
        void Serialise( tWriter &writer )
        {
            writer.StartObject();

            writer.String( "name" );
            writer.String( mName.c_str() );

            writer.String( "micros" );
            mMicros.Serialise( writer );

            writer.EndObject();
        }

        template< typename tReader >
        void Deserialise( tReader &reader )
        {
            mName = reader["name"].GetString();

            mMicros.Deserialise( reader["micros"] );
        }

        bool AddMicroBenchmark( Benchmark *benchmark )
        {
            if ( !mMicros.AddBenchmark( benchmark ) )
            {
                std::cerr << "There is already a benchmark registered in group '" << mName << "' with the name '" <<
                          benchmark->GetName() << "'!" << std::endl;
                delete benchmark;
                return false;
            }

            return true;
        }

        bool RunBenchmarks()
        {
            Console::GroupStart( mName, GetCount() );
            TimePoint start = Clock::now();

            mMicros.RunBenchmarks();

            mDuration = Timer<std::chrono::milliseconds>::GetDuration( start );
            Console::GroupEnd( mName, GetCount(), mDuration );
            return true;
        }

        std::size_t GetMicroCount() const
        {
            return mMicros.GetSize();
        }

        std::string GetName() const
        {
            return mName;
        }

        std::vector< std::string > GetFailedNames() const
        {
            std::vector< std::string > failed;

            for ( const Benchmark *const bench : mMicros.GetFailed() )
            {
                failed.push_back( bench->GetName() );
            }

            return failed;
        }

        std::vector< std::string > GetRegressedNames() const
        {
            std::vector< std::string > regressed;

            for ( const Benchmark *const bench : mMicros.GetRegressed() )
            {
                regressed.push_back( bench->GetName() );
            }

            return regressed;
        }

        std::size_t GetCount() const
        {
            return GetMicroCount();
        }

        std::chrono::milliseconds GetDuration() const
        {
            return mDuration;
        }

    private:

        BenchmarkGroup< Benchmark > mMicros;

        std::chrono::milliseconds mDuration;

        std::string mName;

    };

}

#endif