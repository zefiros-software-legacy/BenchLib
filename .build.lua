
project "BenchLib"

    filter "platforms:Windows"
        kind "Utility"

    filter "platforms:Unix"
        kind "StaticLib"

    filter "platforms:Mac"
        kind "StaticLib"

    filter {}

    if zpm.option( "ProfileMemory" ) then
        zpm.export [[
            defines "BENCHLIB_ENABLE_MEMPROFILE"
        ]]  
    end

    zpm.export [[
        includedirs "benchmark/include/"
        flags "C++11"
    ]]
