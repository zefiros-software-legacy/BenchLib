

module BenchViewer
{
    declare var benchmarkData: any;

    export class BenchViewer
    {
        benchLib: BenchLib;

        constructor(benchmarkData)
        {
            this.benchLib = new BenchLib(benchmarkData);
            this.benchLib.runBenchmarks();
            this.render();
        }

        render(): void
        {
            this.addDefaultPages();

            this.renderMenu();
            this.renderPages();
        }

        addPage(): void
        {
        }

        private addDefaultPages(): void
        {
            
        }

        private renderPages(): void
        {
            var main = $("<div>");
            main.addClass("tab-content");

            this.benchLib.groups.forEach(( name, group ) =>
            {
                var page = new Page(name, group);
                page.renderTo(main);
            });

            $("#main").append(main);
        }

        private renderMenu(): void
        {
            var title: string = "BenchViewer";
            var pageUl = $( "<ul>" );
            pageUl.addClass( "nav nav-sidebar" );

            this.benchLib.groups.forEach((name, group) =>
            {
            });

            $( "#page-navigation" ).append( pageUl );
        }
    }

    window.onload = () =>
    {
        var viewer: BenchViewer = new BenchViewer(benchmarkData);
    };
}