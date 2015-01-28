/// <reference path="./benchmarkGroup.ts"/>

module BenchViewer.Core
{
    export class Group
    {
        public micros: BenchmarkGroup;
        public duration: number;

        constructor( public name: string )
        {
            this.micros = new BenchmarkGroup();
        }

        serialise(): any
        {
            return {
                name: this.name,
                micros: this.micros.serialise()
            };
        }

        deserialise(object): void
        {
            this.name = object["name"];
            this.micros.deserialise( object["micros"] );
        }

        addMicroBenchmark( benchmark: IBenchmarkCase ): boolean
        {
            if ( !this.micros.addBenchmark( benchmark ) )
            {
                // Console.log( "There is already a benchmark registered in group '"+ this.name +"' with the name '"+
                // benchmark.getName() +"'!" );

                return false;
            }

            return true;
        }

        runBenchmarks(): boolean
        {
            // Console.groupStart( this.name, this.getCount() );
            var start: number = performance.now();

            var success: boolean = this.micros.runBenchmarks();

            this.duration = performance.now() - start;

            // Console.groupEnd( this.name, this.getCount(), this.duration );

            return success;
        }

        getMicroCount(): number
        {
            return this.micros.getSize();
        }

        getFailedNames(): string[]
        {
            var failed: string[] = [];

            this.micros.failed.forEach( benchmark =>
            {
                failed.push( benchmark.getName() );
            });

            return failed;
        }

        getRegressedNames(): string[]
        {
            var regressed: string[] = [];

            this.micros.getRegressed().forEach( benchmark =>
            {
                regressed.push( benchmark.getName() );
            });

            return regressed;
        }

        getCount(): number
        {
            return this.getMicroCount();
        }
    }
}