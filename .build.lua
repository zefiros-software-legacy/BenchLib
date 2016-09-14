
project "BenchLib"

    kind "Utility"

    if _ACTION == "xcode4" then
            kind "StaticLib"

    end

    if zpm.option( "ProfileMemory" ) then
        zpm.export [[
            defines "BENCHLIB_ENABLE_MEMPROFILE"
        ]]  
    end

    zpm.export [[
        includedirs "benchmark/include/"
        flags "C++11"
    ]]
