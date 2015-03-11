/// <reference path="../core/benchmarkGroup.ts"/>
/// <reference path="./microSubPage.ts"/>

module BenchViewer
{
    export class Page
    {
        container: JQuery;

        constructor( public name: string, public group: Core.Group )
        {
            this.container = $("<div>");
            //this.container.addClass("tab-pane panel panel-default page");
            this.container.addClass("panel panel-default page");
            this.container.attr("id", this.getId());

            var header = $("<h1>");
            header.addClass("page-header");
            header.html(this.name);

            this.container.append(header);
        }

        public renderTo(element: JQuery)
        {
            this.group.micros.all.forEach((name, benchmark) =>
            {
                var page = new MicroSubPage(<Core.Benchmark>(benchmark), name);
                page.renderTo( this.container );
            });

            element.append( this.container );
        }

        public getId(): string
        {
            return this.name;
        }
    }
} 