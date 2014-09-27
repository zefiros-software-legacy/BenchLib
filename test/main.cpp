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

#include "benchmark/benchLib.h"

#include <chrono>
#include <thread>

MICRO( Test, Test1, 200, true )
{
    new uint32_t[32];
    new uint32_t[32];
    delete[] new uint32_t[32];
    std::this_thread::sleep_for( std::chrono::milliseconds( 6 ) );
}

MICRO( Test, Test2, 200, true )
{
    //delete[] new uint32_t[32];
    std::this_thread::sleep_for( std::chrono::milliseconds( 10 ) );
}

MICRO( Test, Fail, 200, true )
{
    throw "";
}

MICRO( Test2, Test1, 200, true )
{
    delete[] new uint32_t[32];
    std::this_thread::sleep_for( std::chrono::milliseconds( 7 ) );
}


EXTMICRO( Test, Test3, 200, true,
{
    uint32_t *sleep;

    void Init()
    {
        sleep = new uint32_t( 5 );
    }

    void Baseline()
    {

    }

    void Finalise()
    {
        delete sleep;
    }

    void Run()
    {
        std::this_thread::sleep_for( std::chrono::milliseconds( *sleep ) );
    }
} )

int main( int argc, char *argv[] )
{
#ifdef _WIN32

    _CrtSetDbgFlag( _CRTDBG_ALLOC_MEM_DF | _CRTDBG_LEAK_CHECK_DF );
    _CrtSetReportMode( _CRT_ASSERT, _CRTDBG_MODE_FILE );
    _CrtSetReportFile( _CRT_ASSERT, _CRTDBG_FILE_STDERR );
    //_crtBreakAlloc =  0;

#endif

    int32_t result = BenchLib::RunAll( argc, argv );

    system( "pause" );

    return result;
}
