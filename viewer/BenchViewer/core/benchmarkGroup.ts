
module BenchViewer.Core
{
    export class BenchmarkGroup
    {
        public all: collections.Dictionary<string, IBenchmarkCase> = new collections.Dictionary<string, IBenchmarkCase>();
        public completed: IBenchmarkCase[] = [];
        public failed: IBenchmarkCase[] = [];

        constructor(public name: string = "")
        {
            
        }

        serialise(): any
        {
            var groups = [];
            this.all.forEach( ( key, value ) =>
            {
                groups.push( value.serialise() );
            } );
            return groups;
        }

        deserialise(object): void
        {
            object.forEach( group =>
            {
                var name: string = group["name"];

                if ( !this.all.containsKey(name) )
                {
                    var benchmark: IBenchmarkCase = new Core.Benchmark();
                    benchmark.deserialise(group);
                    this.addBenchmark(benchmark);
                }
                else
                {
                    this.all.getValue( name ).deserialise(group);
                }
            });
        }

        runBenchmarks(): boolean
        {
            this.all.forEach( (name, benchmark) =>
            {
                if ( benchmark.isShadow() )
                {
                    return;
                }

                // Console.run( this.name, name );

                try
                {
                    benchmark.onInit();
                    benchmark.calculateOperationCount();
                    benchmark.onRun();
                    benchmark.analyse();
                    benchmark.onFinalise();
                }
                catch ( error )
                {
                    // console.log( error.message );
                    this.setFailed(benchmark, name);
                } 
            });

            return this.failed.length === 0;
        }

        addBenchmark(benchmark: IBenchmarkCase): boolean
        {
            var name: string = benchmark.getName();
            if ( this.all.getValue( name ) == undefined )
            {
                this.all.setValue( name, benchmark );
                return true;
            }
            return false;
        }

        getRegressed(): IBenchmarkCase[]
        {
            var regressed: IBenchmarkCase[] = [];
            this.completed.forEach( completed =>
            {
                if ( completed.getRegression() != Regression.None )
                {
                    regressed.push(completed );
                }
            });

            return regressed;
        }

        getSize(): number
        {
            return this.all.size();
        }

        private setFailed( benchmark: IBenchmarkCase, name: string ): void
        {
            this.failed.push( benchmark );
            benchmark.setCompleted( false );

            // Console.fail( benchmark.getGroup(), name );
        }

        private setCompleted(benchmark: IBenchmarkCase, name:string): void
        {
            this.completed.push(benchmark);

            benchmark.setCompleted(true);
            
            // Console.done(this.name, name, benchmark.sampleDuration, benchmark.baselineDuration );
        }
    }
}