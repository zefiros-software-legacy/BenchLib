local root      = "../../"

solution "benchmark"

	location( root .. "benchmark/" )
	objdir( root .. "bin/obj/" )
	debugdir( root .. "bin/" )
	
	configurations { "Debug", "Release" }

	platforms { "x64", "x32" }

	vectorextensions "SSE2"

	floatingpoint "Fast"

	warnings "Extra"

	flags "Unicode"	

    configuration "x32"
		targetdir( root .. "bin/x32/" )
		architecture "x32"

    configuration "x64"
		targetdir( root .. "bin/x64/" )
		architecture "x64"
		
	configuration "Debug"
		targetsuffix "d"
		defines "DEBUG"
		flags "Symbols"
		optimize "Off"

	configuration "Release"		
		flags "LinkTimeOptimization"
		optimize "Speed"
				
	configuration {}
			
	project "benchmark-test"
		location(  root .. "test/" )
				
		kind "ConsoleApp"
		flags "WinMain"
		defines "GTEST_HAS_TR1_TUPLE=0"

		debugargs { 
			"-in ../viewer/data.js",
			"-out ../viewer/data.js",
			"-v"
		}
		
		includedirs {
			root .. "extern/gtest/include/",
			root .. "extern/gtest/",
			
			root .. "benchmark/include/",
			root .. "test/"
			}	
		
		files { 
			root .. "extern/gtest/src/gtest-all.cc",
			root .. "test/**.h",
			root .. "test/*.cpp"
			}
			
		configuration { "Debug", "x32" }
			defines "PREFIX=X32D_"
		
		configuration { "Debug", "x64" }
			defines "PREFIX=X64D_"
		
		configuration { "Release", "x32" }
			defines "PREFIX=X32R_"
		
		configuration { "Release", "x64" }
			defines "PREFIX=X64R_"
			
	project "benchmark"
		targetname "benchmark"
		kind "StaticLib"
		
		includedirs {
			root .. "benchmark/include/"
			}	
			
		files { 
			root .. "benchmark/include/**.h",
			}