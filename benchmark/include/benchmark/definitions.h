/**
 * Copyright (c) 2016  Koen Visscher, Mick van Duijn and Paul Visscher
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
#ifndef __BENCHLIB__DEFINITIONS_H__
#define __BENCHLIB__DEFINITIONS_H__

namespace BenchLib
{
#define MICRO( group, name, samples, memoryProfile )                                                    \
    namespace __Benchmark                                                                               \
    {                                                                                                   \
        class CONCAT( ___, group, ___, name )                                                           \
            : public BenchLib::Benchmark                                                                \
        {                                                                                               \
        public:                                                                                         \
            CONCAT( ___, group, ___, name )( Case *benchCase)                                           \
                : Benchmark( benchCase )                                                                \
            {                                                                                           \
            }                                                                                           \
            std::size_t GetSampleCount() const                                                          \
            {                                                                                           \
                return samples;                                                                         \
            }                                                                                           \
            std::string GetName() const                                                                 \
            {                                                                                           \
                return #name;                                                                           \
            }                                                                                           \
            std::string GetGroup() const                                                                \
            {                                                                                           \
                return #group;                                                                          \
            }                                                                                           \
            virtual bool IsProfileMemoryEnabled() const                                                 \
            {                                                                                           \
                return memoryProfile;                                                                   \
            }                                                                                           \
            virtual bool IsShadow() const                                                               \
            {                                                                                           \
                return false;                                                                           \
            }                                                                                           \
            class BCase                                                                                 \
                : public Case                                                                           \
            {                                                                                           \
            public:                                                                                     \
                inline void Run();                                                                      \
            };                                                                                          \
        };                                                                                              \
        volatile bool CONCAT( ___gResult, group, ___, name ) =                                          \
                BenchLib::RegisterMicroBenchmark(#group, new CONCAT( ___, group, ___, name )( new CONCAT( ___, group, ___, name )::BCase() ) );   \
    }                                                                                                   \
    inline void __Benchmark::CONCAT( ___, group, ___, name )::BCase::Run()

#define EXTMICRO( group, name, samples, memoryProfile, ...  )                                           \
    namespace __Benchmark                                                                               \
    {                                                                                                   \
        namespace CONCAT( ___, group, ___, name )                                                       \
        {                                                                                               \
            class Benchmark                                                                             \
                : public BenchLib::Benchmark                                                            \
            {                                                                                           \
            public:                                                                                     \
                Benchmark( Case *benchCase )                                                            \
                    : BenchLib::Benchmark( benchCase )                                                  \
                {                                                                                       \
                }                                                                                       \
                std::size_t GetSampleCount() const                                                      \
                {                                                                                       \
                    return samples;                                                                     \
                }                                                                                       \
                std::string GetName() const                                                             \
                {                                                                                       \
                    return #name;                                                                       \
                }                                                                                       \
                std::string GetGroup() const                                                            \
                {                                                                                       \
                    return #group;                                                                      \
                }                                                                                       \
                virtual bool IsProfileMemoryEnabled() const                                             \
                {                                                                                       \
                    return memoryProfile;                                                               \
                }                                                                                       \
                virtual bool IsShadow() const                                                           \
                {                                                                                       \
                    return false;                                                                       \
                }                                                                                       \
                struct Setup                                                                            \
                        : public Case                                                                   \
                        __VA_ARGS__;                                                                    \
            };                                                                                          \
        }                                                                                               \
        volatile bool CONCAT( ___gResult, group, ___, name ) =                                          \
                BenchLib::RegisterMicroBenchmark(#group, new CONCAT( ___, group, ___, name )::Benchmark( new CONCAT( ___, group, ___, name )::Benchmark::Setup ) );   \
    }
}

#endif