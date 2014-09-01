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
#ifndef __BENCHLIB__UTIL_H__
#define __BENCHLIB__UTIL_H__

#define CONCATEXT( a, b, c, d ) a##b##c##d
#define CONCAT( a, b, c, d ) CONCATEXT( a, b, c, d )


/// @cond SKIP

/// Helper macro function

#define ___VA_SIZE( _1, _2, _3, _4, _5, _6, __count, ... ) __count

/// @endcond SKIP

/**
 * A macro that counts the amount of arguments given in a variable argument macro.
 *
 * @param    ...
 * The arguments.
 *
 * @pre
 * The argument list consists between 1 and 6 arguments. No argument will be seen as 1
 * argument, and more than 6 arguments won't be counted.
 *
 * @details
 * ### Examples ###
 * @snippet util.cpp VA_SIZE
 */

#define VA_SIZE( ... ) ___EXPAND( ___VA_SIZE( __VA_ARGS__, 6, 5, 4, 3, 2, 1 ) )

/**
 * A macro that allows us to overload macros on a given amount of arguments.
 *
 * @param   macroName
 * The name of the macro we are going to overload.
 * @param   ...
 * The argument list.
 *
 * @details
 * ### Examples ###
 * @snippet util.cpp VA_SELECT
 *
 * @see
 * VA_SIZE
 */

#define VA_SELECT( macroName, ... ) CONCAT( macroName, CONCAT( _, VA_SIZE( __VA_ARGS__ ) ) )( __VA_ARGS__ )

#endif