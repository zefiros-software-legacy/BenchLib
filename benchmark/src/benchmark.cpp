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

#include "benchmark/benchmark.h"
#include "benchmark/parser.h"

int32_t BenchLib::BenchmarkIntern::RunBenchmarks()
{
    std::size_t benchmarkCount = GetBenchmarkCount();
    std::size_t groupCount = GetGroupCount();

    Console::Init( benchmarkCount, groupCount );

    bool failed = false;

    uint64_t totalTime = 0;

    for ( auto it = mGroups.begin(), end = mGroups.end(); it != end; ++it )
    {
        const std::string group = *it;
        const std::size_t groupSize = GetGroupSize( group );

        Console::GroupStart( group, groupSize );

        uint64_t groupTime = 0;

        Console::NormalStart( GetNormalGroupSize( group ) );

        failed |= !ProcessNormalBenchmarks( group, groupTime );


        Console::GroupEnd( group, groupSize, groupTime );

        totalTime += groupTime;
    }

    Console::End( benchmarkCount, groupCount, totalTime, mFailedBenchmarks );

    return failed ? -1 : 0;
}

bool BenchLib::BenchmarkIntern::RegisterBenchmark( const std::string &group, const std::string &name,
        IBenchmarkCase *benchCase )
{
    std::unordered_set< std::string > &names = mUsedBenchmarkCases[ group ];
    auto it = names.find( name );

    if ( it == names.end() )
    {
        mBenchmarkCases[group].push_back( std::pair< std::string, IBenchmarkCase * >( name, benchCase ) );
        mGroups.insert( group );
        return true;
    }
    else
    {
        delete benchCase;

        std::cerr << "There is already a benchmark registered in group '" << group << "' with the name '" << name << "'!" <<
                  std::endl;
    }

    return false;
}

BenchLib::BenchmarkIntern &BenchLib::BenchmarkIntern::GetInstance()
{
    static BenchmarkIntern mBenchmark;
    return mBenchmark;
}

BenchLib::BenchmarkIntern::BenchmarkIntern()
{

}

BenchLib::BenchmarkIntern::~BenchmarkIntern()
{

}

BenchLib::BenchmarkIntern &BenchLib::BenchmarkIntern::operator=( BenchLib::BenchmarkIntern & )
{
    return *this;
}

bool BenchLib::BenchmarkIntern::ProcessNormalBenchmarks( const std::string &group, uint64_t &totalTime )
{
    std::size_t failCount = 0;

    auto it = mBenchmarkCases.find( group );

    if ( it != mBenchmarkCases.end() )
    {
        std::vector< std::pair< std::string, IBenchmarkCase * > > &names = it->second;

        for ( auto namesIt = names.begin(), namesEnd = names.end(); namesIt != namesEnd; ++namesIt )
        {
            std::string name = namesIt->first;
            IBenchmarkCase *bench = namesIt->second;

            Console::Run( group, name );

            try
            {
                bench->CalculateOperationCount();

                std::size_t samples = bench->GetSamples();
                std::size_t operations = bench->GetOperations();

                Console::Stats( samples, operations );

                BaselineAnalysis baseline;
                bench->Baseline( baseline );
                mNormalBaselineResults[ group ].push_back( baseline );

                double correction = baseline.GetCorrection();

                Console::Baseline( correction );

                Analysis analysis;
                bench->Start( analysis );
                mNormalBenchmarkResults[ group ].push_back( analysis );



                Console::Result( analysis.GetAverage(),
                                 analysis.GetStandardDeviation(),
                                 analysis.GetLowest(),
                                 analysis.GetHighest() );

                Console::ResultCorrected( analysis.GetAverage(),
                                          analysis.GetStandardDeviation(),
                                          analysis.GetLowest(),
                                          analysis.GetHighest(),
                                          correction );

                Console::Done( group, name, baseline.GetTotalTime(), analysis.GetTotalTime() );

                totalTime += baseline.GetTotalTime() + analysis.GetTotalTime();
            }
            catch ( const std::exception &ex )
            {
                ++failCount;

                mFailedBenchmarks.push_back( std::pair< std::string, std::string >( group, name ) );

                std::cerr << ex.what() << std::endl;

                Console::Fail( group, name );
            }
            catch ( ... )
            {
                ++failCount;

                mFailedBenchmarks.push_back( std::pair< std::string, std::string >( group, name ) );

                Console::Fail( group, name );
            }

            delete bench;
        }
    }

    return failCount == 0;
}

std::size_t BenchLib::BenchmarkIntern::GetBenchmarkCount() const
{
    std::size_t count = 0;
    count += GetNormalBenchmarkCount();

    return count;
}

std::size_t BenchLib::BenchmarkIntern::GetNormalBenchmarkCount() const
{
    std::size_t count = 0;

    for ( auto it = mBenchmarkCases.begin(), end = mBenchmarkCases.end(); it != end; ++it )
    {
        count += it->second.size();
    }

    return count;
}

std::size_t BenchLib::BenchmarkIntern::GetGroupCount() const
{
    return mBenchmarkCases.size();
}

std::size_t BenchLib::BenchmarkIntern::GetGroupSize( const std::string &group ) const
{
    std::size_t size = 0;

    size += GetNormalGroupSize( group );

    return size;
}

std::size_t BenchLib::BenchmarkIntern::GetNormalGroupSize( const std::string &group ) const
{
    const auto it = mBenchmarkCases.find( group );

    if ( it != mBenchmarkCases.end() )
    {
        return it->second.size();
    }

    return 0;
}

bool BenchLib::RegisterBenchmark( const std::string &group, const std::string &name, IBenchmarkCase *benchCase )
{
    BenchmarkIntern &benchmark = BenchmarkIntern::GetInstance();
    return benchmark.RegisterBenchmark( group, name, benchCase );
}

int32_t BenchLib::RunAll()
{
    BenchmarkIntern &benchmark = BenchmarkIntern::GetInstance();
    return benchmark.RunBenchmarks();
}
