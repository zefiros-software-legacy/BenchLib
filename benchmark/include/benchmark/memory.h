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
#ifndef __BENCHLIB__MEMORY_H__
#define __BENCHLIB__MEMORY_H__

#include "benchmark/util.h"

#include <unordered_map>
#include <stdint.h>
#include <vector>
#include <string>

namespace BenchLib
{
    struct MemLeak
    {
        std::string file;
        int64_t size;
        std::size_t line;
    };

    class Memory
    {
    public:

        void AddTrace( void *ptr, std::size_t size, const std::string &file, std::size_t line )
        {
            if ( mEnabled )
            {
                mSamples.push_back( mSamples.back() + size );

                MemLeak &leak = mMemoryLeaks[ptr];
                leak.file = file;
                leak.size = size;
                leak.line = line;
            }
        }

        void RemoveTrace( void *ptr )
        {
            if ( mEnabled )
            {
                auto it = mMemoryLeaks.find( ptr );

                if ( it != mMemoryLeaks.end() )
                {
                    mSamples.push_back( mSamples.back() - it->second.size );
                    mMemoryLeaks.erase( it );
                }
            }
        }

        void StartProfile()
        {
            mSamples.clear();
            mSamples.shrink_to_fit();
            mSamples.push_back( 0 );

            mMemoryLeaks.clear();
            mMemoryLeaks = std::move( std::unordered_map< void *, MemLeak >() );
            mEnabled = true;
        }

        void EndProfile( std::vector< int64_t > &samples, std::vector< MemLeak > &memoryLeaks )
        {
            mEnabled = false;
            samples = mSamples;

            for ( auto &it : mMemoryLeaks )
            {
                memoryLeaks.push_back( it.second );
            }
        }

        void EndProfile( std::vector< int64_t > &samples )
        {
            mEnabled = false;
            samples = mSamples;
        }

        static Memory &GetInstance()
        {
            static Memory mMemory;
            return mMemory;
        }

    private:

        std::unordered_map< void *, MemLeak > mMemoryLeaks;
        std::vector< int64_t > mSamples;

        bool mEnabled;

        Memory()
        {
        }

        Memory( Memory & );
        Memory &operator=( Memory & );
    };

    template< typename tWriter >
    void Serialise( MemLeak &leak, tWriter &writer )
    {
        writer.StartObject();

        writer.String( "file" );
        writer.String( leak.file.c_str() );

        writer.String( "size" );
        writer.Int64( leak.size );

        writer.String( "line" );
        writer.Uint( leak.line );

        writer.EndObject();
    }

    template< typename tReader >
    void Deserialise( MemLeak &leak, tReader &reader )
    {
        leak.file = reader["file"].GetString();
        leak.size = reader["size"].GetInt64();
        leak.line = reader["line"].GetUint();
    }
}

void *operator new( std::size_t size, const char *file, std::size_t line )
{
    void *ptr = operator new( size );
    BenchLib::Memory::GetInstance().AddTrace( ptr, size, file, line );
    return ptr;
}

static void *operator new[]( std::size_t size, const char *file, std::size_t line )
{
    return operator new( size, file, line );
}

void *operator new( std::size_t size )
{
    return malloc( size );
}

static void operator delete( void *ptr, const char *, std::size_t )
{
    BenchLib::Memory::GetInstance().RemoveTrace( ptr );
    free( ptr );
}

inline void _cdecl operator delete( void *ptr )
{
    BenchLib::Memory::GetInstance().RemoveTrace( ptr );
    free( ptr );
}

void operator delete[]( void *ptr )
{
    operator delete( ptr );
}

#define new new(__FILE__, __LINE__)

#endif