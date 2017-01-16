#!/bin/bash
set -e

if [ "$TYPE" == "zpm" ]; then
    cd test
    
    zpm install-package --allow-install --allow-module
    zpm gmake --allow-install

    cd zpm/
    make
    cd ../../

    test/bin/x86/benchmark-zpm-test

else
    zpm install-package --allow-install --allow-module
    zpm gmake --allow-install
    cd benchmark
    make config=${TYPE}_${ARCH}
    cd ../


    if [ "$TYPE" == "debug" ]; then
        bin/${ARCH}/benchmark-testd

    elif [ "$TYPE" == "coverage" ]; then
        ./benchmark-testcd
    else
        bin/${ARCH}/benchmark-test
    fi
fi