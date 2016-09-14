
project "BenchLib"

    filter { "action:not xcode4" }
            kind "Utility"

    filter { "action:xcode4" }
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
