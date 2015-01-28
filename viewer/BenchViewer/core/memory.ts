
module BenchViewer.Core
{
    export class MemLeak
    {
        file: string;
        size: number;
        line: number;

        serialise(): any
        {
            return {
                file: this.file,
                size: this.size,
                line: this.line
            };
        }
       
        deserialise( object ): void
        {
            this.file = object["file"];
            this.size = object["size"];
            this.line = object["line"];
        }
    }
}