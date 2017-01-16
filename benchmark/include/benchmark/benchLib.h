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
#ifndef __BENCHLIB__BENCHMARK_H__
#define __BENCHLIB__BENCHMARK_H__

#include "rapidjson/filewritestream.h"
#include "rapidjson/filereadstream.h"
#include "rapidjson/prettywriter.h"
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/reader.h"

#include "benchmark/definitions.h"

#include "benchmark/memory.h"

#include "benchmark/benchmark.h"
#include "benchmark/config.h"
#include "benchmark/group.h"
#include "benchmark/timer.h"

#include <iostream>
#include <fstream>
#include <string>
#include <limits>
#include <map>

// Silly silly msvc...
#undef max

namespace BenchLib
{
    class BenchmarkIntern
    {
    public:

        int32_t RunBenchmarks( int argc, char *argv[] )
        {
            mCmdBegin = argv;
            mCmdEnd   = argv + argc;

            if ( HasCmdOption( "in" ) )
            {
                const std::string file = GetCmdOption( "in" );

                Deserialise( file );
            }

            SetTimestamp();


            const bool success = RunBenchmarkSuites();

            if ( HasCmdOption( "out" ) )
            {
                const std::string file = GetCmdOption( "out" );

                Serialise( file, HasCmdOption( "v" ) );
            }

            return success ? 0 : -1;
        }

        void Serialise( const std::string &file, bool viewerCompatible )
        {
            std::ofstream stream( file );

            if ( stream.is_open() )
            {
                if ( viewerCompatible )
                {
                    stream << "var " BENCHLIB_VIEWER_VAR << " = ";
                }

                OFStream ostream( stream );
                rapidjson::PrettyWriter<OFStream> writer( ostream );

                writer.StartObject();

                writer.String( "groups" );
                writer.StartArray();

                for ( auto &it : mGroups )
                {
                    it.second.Serialise( writer );
                }

                writer.EndArray();

                writer.String( "config" );
                ::BenchLib::Serialise( gConfig, writer );

                writer.EndObject();
            }
        }

        void Deserialise( const std::string &file )
        {
            std::ifstream stream( file );

            if ( stream.is_open() )
            {
                stream.ignore( 100, '{' );
                const std::size_t pos = stream.tellg();
                stream.seekg( pos - 1 );

                IFStream istream( stream );
                rapidjson::Document reader;
                reader.ParseStream<0, rapidjson::UTF8<>, IFStream>( istream );

                if ( reader.HasMember( "config" ) )
                {
                    ::BenchLib::Deserialise( gConfig, reader["config"] );
                }

                const rapidjson::Value &groups = reader["groups"];

                for ( auto it = groups.Begin(), end = groups.End(); it != end; ++it )
                {
                    const std::string name = ( *it )["name"].GetString();

                    auto fit = mGroups.find( name );

                    if ( fit == mGroups.end() )
                    {
                        Group group;
                        group.Deserialise( *it );
                        mGroups.emplace( name, name );
                    }
                    else
                    {
                        fit->second.Deserialise( *it );
                    }
                }
            }
        }

        bool RegisterMicroBenchmark( const std::string &group, Benchmark *benchCase )
        {
            CheckGroup( group );

            return mGroups[group].AddMicroBenchmark( benchCase );
        }

        static BenchmarkIntern &GetInstance()
        {
            static BenchmarkIntern mBenchmark;
            return mBenchmark;
        }

    private:

        std::map< std::string, Group > mGroups;

        char **mCmdBegin;
        char **mCmdEnd;

        BenchmarkIntern()
        {
        }

        BenchmarkIntern( BenchmarkIntern & );
        BenchmarkIntern &operator=( BenchmarkIntern & );

        std::string GetCmdOption( const std::string &option )
        {
            if ( option[0] != '-' && option[0] != '/' )
            {
                const std::string unix = GetCmdOption( "-" + option );

                if ( unix == "" )
                {
                    return GetCmdOption( "/" + option );
                }
                else
                {
                    return unix;
                }
            }

            char **it = std::find( mCmdBegin, mCmdEnd, option );

            if ( it != mCmdEnd && ++it != mCmdEnd )
            {
                return *it;
            }

            return "";
        }

        bool HasCmdOption( const std::string &option )
        {
            if ( option[0] != '-' && option[0] != '/' )
            {
                return HasCmdOption( "-" + option ) || HasCmdOption( "/" + option );
            }

            return std::find( mCmdBegin, mCmdEnd, option ) != mCmdEnd;
        }

        void SetTimestamp()
        {
            const std::chrono::system_clock::time_point now = std::chrono::system_clock::now();
            std::time_t now_c = std::chrono::system_clock::to_time_t( now );

#ifdef _WIN32
#   pragma warning(push)
#   pragma warning(disable:4996)
#endif
            char buffer[32];
            std::strftime( buffer, 32, "%Y-%m-%dT%H:%M:%SZ", std::localtime( &now_c ) );
#ifdef _WIN32
#   pragma warning(pop)
#endif
            gConfig.timestamp = buffer;
        }

        void CheckGroup( const std::string &group )
        {
            auto it = mGroups.find( group );

            if ( it == mGroups.end() )
            {
                mGroups.emplace( group, group );
            }
        }

        std::size_t GetBenchmarkCount() const
        {
            std::size_t count = 0;

            for ( auto &it : mGroups )
            {
                count += it.second.GetCount();
            }

            return count;
        }

        std::vector< std::pair<std::string, std::string > > GetFailed()
        {
            std::vector< std::pair<std::string, std::string > > failed;

            for ( auto &it : mGroups )
            {
                for ( std::string &name : it.second.GetFailedNames() )
                {
                    failed.emplace_back( it.first, name );
                }
            }

            return failed;
        }

        std::vector< std::pair<std::string, std::string > > GetRegressed()
        {
            std::vector< std::pair<std::string, std::string > > regressed;

            for ( auto &it : mGroups )
            {
                for ( std::string &name : it.second.GetRegressedNames() )
                {
                    regressed.emplace_back( it.first, name );
                }
            }

            return regressed;
        }

        bool RunBenchmarkSuites()
        {
            std::size_t benchmarkCount = GetBenchmarkCount();
            std::size_t groupCount = mGroups.size();

            Console::Init( benchmarkCount, groupCount );
            TimePoint start = Clock::now();

            bool failed = false;

            for ( auto &it : mGroups )
            {
                Group &group = it.second;
                failed |= !group.RunBenchmarks();
            }

            Console::End( benchmarkCount, groupCount, Timer<std::chrono::milliseconds>::GetDuration( start ),
                          GetFailed(), GetRegressed() );

            return !failed;
        }

        class IFStream
        {
        public:

            typedef char Ch;

            IFStream( std::istream &is )
                : mStream( is )
            {
            }

            char Peek() const
            {
                int32_t c = mStream.peek();
                return c == std::char_traits<char>::eof() ? '\0' : static_cast< char >( c );
            }

            char Take()
            {
                int32_t c = mStream.get();
                return c == std::char_traits<char>::eof() ? '\0' : static_cast< char >( c );
            }

            std::size_t Tell() const
            {
                return ( size_t )mStream.tellg();
            }

            char *PutBegin()
            {
                return nullptr;
            }

            void Put( char )
            {

            }

            void Flush()
            {

            }

            std::size_t PutEnd( char * )
            {
                return 0;
            }

        private:

            IFStream( const IFStream & );
            IFStream &operator=( const IFStream & );

            std::istream &mStream;
        };

        class OFStream
        {
        public:

            typedef char Ch;

            OFStream( std::ostream &os )
                : mStream( os )
            {
            }

            char Peek() const
            {
                return '\0';
            }

            char Take()
            {
                return '\0';
            }

            std::size_t Tell() const
            {
                assert( false && "Should not be used" );
                return 0;
            }

            char *PutBegin()
            {
                return NULL;
            }

            void Put( char c )
            {
                mStream.put( c );
            }

            void Flush()
            {
                mStream.flush();
            }

            std::size_t PutEnd( char * )
            {
                return 0;
            }

        private:

            OFStream( const OFStream & );
            OFStream &operator=( const OFStream & );

            std::ostream &mStream;
        };
    };

    static inline bool RegisterMicroBenchmark( const std::string &group, Benchmark *benchCase )
    {
        BenchmarkIntern &benchmark = BenchmarkIntern::GetInstance();
        return benchmark.RegisterMicroBenchmark( group, benchCase );
    }

    static inline int32_t RunAll( int argc, char *argv[] )
    {
        BenchmarkIntern &benchmark = BenchmarkIntern::GetInstance();
        return benchmark.RunBenchmarks( argc, argv );
    }

}

#endif