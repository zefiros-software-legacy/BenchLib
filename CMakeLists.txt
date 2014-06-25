cmake_minimum_required( VERSION 2.8.12 ) 

set( projectName    "Benchmark Library" )
set( projectSource  "benchmark/source"  )
set( projectInclude "benchmark/include" )

project( ${projectName} ) 
include_directories( ${projectInclude} )

add_library(test STATIC test.c)




enable_testing()

##
#Test Project
##
project( Benchmark-Test )

add_subdirectory( extern/gtest-1.7.0 )

include_directories(${gtest_SOURCE_DIR}/include) 

add_executable( runUnitTests testgtest.cpp )
target_link_libraries(runUnitTests gtest gtest_main)
add_test( runUnitTests runUnitTests )