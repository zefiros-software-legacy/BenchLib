
module BenchViewer.Core
{
    export interface IBenchmarkCase
    {
        sampleDuration: number;
        baselineDuration: number;

        serialise(): any;
        deserialise(object: any): void;

        onInit(): void;
        onRun(): void;
        onFinalise(): void;

        analyse(): void;

        isProfileMemoryEnabled(): boolean;

        getName(): string;
        getGroup(): string;

        getRegression(): number;

        isCompleted(): boolean;
        setCompleted(isCompleted: boolean): void;

        getSampleCount(): number;
        getOperationCount(): number;

        isShadow(): boolean;

        calculateOperationCount(): void;
    }
}