
module BenchViewer.Core
{
    export class Config
    {
        static alpha: number = 0.02;
        static winsoriseAnalysis: boolean = false;

        static microMaxHistory: number = 20;
        static minMsPerBenchUnit: number = 10;

        static precision: number = 6;

        static timestamp: string;

        static serialise(): any
        {
            return {
                microMaxHistory: Config.microMaxHistory,
                minMsPerBenchUnit: Config.minMsPerBenchUnit,
                alpha: Config.alpha,
                winsoriseAnalysis: Config.winsoriseAnalysis
            };
        }

        static deserialise(object): void
        {
            Config.microMaxHistory = object["microMaxHistory"];
            Config.minMsPerBenchUnit = object["minMsPerBenchUnit"];
            Config.alpha = object["alpha"];
            Config.winsoriseAnalysis = object[ "winsoriseAnalysis" ];
        }
    }
}