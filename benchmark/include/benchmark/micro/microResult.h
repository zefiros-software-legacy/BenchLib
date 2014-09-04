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
#ifndef __BENCHLIB__MICRORESULT_H__
#define __BENCHLIB__MICRORESULT_H__

#include "benchmark/micro/microData.h"

namespace BenchLib
{
    struct MicroResult
    {
        MicroData< double > timeSamples;
        MicroData< double > timeBaseline;
        MicroData< double > timeCorrected;

        MicroData< double, int64_t > memorySamples;
        MicroData< double, int64_t > memoryBaseline;
        MicroData< double, int64_t > memoryCorrected;

        std::vector< MemLeak > memoryLeaks;

        std::string timestamp;

        std::size_t operationCount;
        std::size_t sampleCount;

        uint32_t regression;

        bool memoryProfile;
        bool completed;

        MicroResult()
            : operationCount( 0 ),
              sampleCount( 0 ),
              regression( 0 ),
              memoryProfile( true ),
              completed( false )
        {
        }
    };

    template< typename tWriter >
    void Serialise( MicroResult &result, tWriter &writer )
    {
        writer.StartObject();

        if ( result.completed )
        {
            writer.String( "operationCount" );
            writer.Uint( result.operationCount );

            writer.String( "sampleCount" );
            writer.Uint( result.sampleCount );

            writer.String( "regression" );
            writer.Uint( result.regression );

            writer.String( "timeSamples" );
            result.timeSamples.Serialise( writer );

            writer.String( "timeBaseline" );
            result.timeBaseline.Serialise( writer );

            writer.String( "timeCorrected" );
            result.timeCorrected.Serialise( writer );

            if ( result.memoryProfile )
            {
                writer.String( "memoryProfile" );
                writer.Bool( result.memoryProfile );

                writer.String( "memorySamples" );
                result.memorySamples.Serialise( writer );

                writer.String( "memoryBaseline" );
                result.memoryBaseline.Serialise( writer );

                writer.String( "memoryCorrected" );
                result.memoryCorrected.Serialise( writer );

                writer.String( "memoryLeaks" );
                writer.StartArray();

                for ( MemLeak &leak : result.memoryLeaks )
                {
                    ::BenchLib::Serialise( leak, writer );
                }

                writer.EndArray();
            }
        }

        writer.String( "timestamp" );
        writer.String( result.timestamp.c_str() );

        writer.String( "completed" );
        writer.Bool( result.completed );

        writer.EndObject();
    }

    template< typename tReader >
    void Deserialise( MicroResult &result, tReader &reader )
    {
        result.completed = reader["completed"].GetBool();
        result.timestamp = reader["timestamp"].GetString();

        if ( result.completed )
        {
            result.operationCount = reader["operationCount"].GetUint();
            result.sampleCount = reader["sampleCount"].GetUint();

            if ( reader.HasMember( "regression" ) )
            {
                result.regression = reader["regression"].GetUint();
            }
            else
            {
                result.regression = 0;
            }

            result.timeSamples.Deserialise( reader["timeSamples"] );
            result.timeBaseline.Deserialise( reader["timeBaseline"] );

            if ( !reader.HasMember( "timeCorrected" ) )
            {
                result.timeCorrected.SetSamples( result.timeSamples.GetSamples(), result.timeBaseline.GetSampleStats().average );
            }
            else
            {
                result.timeCorrected.Deserialise( reader["timeCorrected"] );
            }

            if ( reader.HasMember( "memoryProfile" ) )
            {
                result.memoryProfile = reader["memoryProfile"].GetBool();

                if ( result.memoryProfile )
                {
                    result.memorySamples.Deserialise( reader["memorySamples"] );
                    result.memoryBaseline.Deserialise( reader["memoryBaseline"] );
                    result.memoryCorrected.Deserialise( reader["memoryCorrected"] );

                    if ( reader.HasMember( "memoryLeaks" ) )
                    {
                        const rapidjson::Value &leaks = reader["memoryLeaks"];

                        for ( auto it = leaks.Begin(), end = leaks.End(); it != end; ++it )
                        {
                            MemLeak leak;
                            ::BenchLib::Deserialise( leak, *it );
                            result.memoryLeaks.emplace_back( leak );
                        }
                    }
                }
            }
        }
    }
}

#endif