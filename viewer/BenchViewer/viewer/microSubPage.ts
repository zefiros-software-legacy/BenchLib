/// <reference path="./subPage.ts"/>

module BenchViewer
{
    export class MicroSubPage extends SubPage
    {
        public benchmark: Core.Benchmark;
        constructor(name: string, benchmark: Core.Benchmark )
        {
            this.benchmark = benchmark;

            super(name);
        }

        renderTo(element: JQuery): void
        {


            super.renderTo(element);
        }

        addLabels(): void
        {
            var statusLabel = Label.status(this.benchmark.current.completed);
            statusLabel.container.addClass("pull-right");
            statusLabel.renderTo( this.container );
        }

        getBenchmarkLabel(): Label
        {
            return new Label(Label.type.grey, "&mu;");
        }

        addContent(): JQuery
        {
            return null;
        }
    }
}