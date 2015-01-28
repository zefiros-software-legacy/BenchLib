module BenchViewer.Core
{
    export class BenchmarkStat
    {
        average: number = 0.0;
        standardDeviation: number = 0.0;
        variance: number = 0.0;
        low: number = 0.0;
        high: number = 0.0;

        serialise(): any
        {
            return {
                average: this.average,
                standardDeviation: this.standardDeviation,
                variance: this.variance,
                low: this.low,
                high: this.high
            };
        }

        deserialise(object): void
        {
            this.average = object["average"];
            this.standardDeviation = object["standardDeviation"];
            this.variance = object["variance"];
            this.low = object["low"];
            this.high = object[ "high" ];
        }
    }
}