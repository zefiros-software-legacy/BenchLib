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
#ifndef __BENCHLIB__MICROSTAT_H__
#define __BENCHLIB__MICROSTAT_H__

namespace BenchLib
{

    template< typename tDataType, typename tSampleType = tDataType >
    struct BenchmarkStat
    {
        tDataType average;
        tDataType standardDeviation;
        tDataType variance;
        tSampleType low;
        tSampleType high;

        BenchmarkStat()
            : average( 0 ),
              standardDeviation( 0 ),
              variance( 0 ),
              low( 0 ),
              high( 0 )
        {
        }
    };

    template< typename tDataType, typename tSampleType, typename tWriter >
    void Serialise( BenchmarkStat<tDataType, tSampleType> &result, tWriter &writer )
    {
        writer.StartObject();

        writer.String( "average" );
        writer.Double( static_cast< double >( result.average ) );

        writer.String( "standardDeviation" );
        writer.Double( static_cast< double >( result.standardDeviation ) );

        writer.String( "variance" );
        writer.Double( static_cast< double >( result.variance ) );

        writer.String( "low" );
        writer.Double( static_cast< double >( result.low ) );

        writer.String( "high" );
        writer.Double( static_cast< double >( result.high ) );

        writer.EndObject();
    }

    template< typename tDataType, typename tSampleType, typename tReader >
    void Deserialise( BenchmarkStat<tDataType, tSampleType> &result, tReader &reader )
    {
        result.average = static_cast< tDataType >( reader["average"].GetDouble() );
        result.standardDeviation = static_cast< tDataType >( reader["standardDeviation"].GetDouble() );
        result.variance = static_cast< tDataType >( reader["variance"].GetDouble() );
        result.low = static_cast< tSampleType >( reader["low"].GetDouble() );
        result.high = static_cast< tSampleType >( reader["high"].GetDouble() );
    }

}

#endif