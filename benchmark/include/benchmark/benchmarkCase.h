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
#ifndef __BENCHLIB__IBENCHMARKCASE_H__
#define __BENCHLIB__IBENCHMARKCASE_H__

#include <string>

namespace BenchLib
{

    class BenchmarkCase
    {
    public:

        virtual void OnInit() = 0;

        virtual void OnRun() = 0;

        virtual void OnFinalise() = 0;

        virtual double GetSampleDuration() const = 0;
        virtual double GetBaselineDuration() const = 0;

        virtual void Analyse() = 0;

        virtual bool IsProfileMemoryEnabled() const = 0;

        virtual std::string GetName() const = 0;
        virtual std::string GetGroup() const = 0;

        virtual uint32_t GetRegression() const = 0;

        virtual bool IsCompleted() const = 0;
        virtual void SetCompleted( bool isCompleted ) = 0;

        virtual std::size_t GetSampleCount() const = 0;
        virtual std::size_t GetOperationCount() const = 0;

        virtual bool IsShadow() const = 0;

        virtual void CalculateOperationCount() = 0;
    };
}

#endif