
project "BenchLib"

    kind "StaticLib"

    if zpm.option( "ProfileMemory" ) then
        zpm.export [[
            defines "BENCHLIB_ENABLE_MEMPROFILE"
        ]]  
    end

    zpm.export [[
        includedirs "benchmark/include/"
        flags "C++11"
    ]]
