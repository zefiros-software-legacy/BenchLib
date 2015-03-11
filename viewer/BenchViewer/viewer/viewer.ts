

module BenchViewer
{
    declare var benchmarkData: any;

    export class BenchViewer
    {
        public benchLib: BenchLib;
        public pages: Page[] = [];

        constructor(benchmarkData)
        {
            this.benchLib = new BenchLib(benchmarkData);
            this.benchLib.runBenchmarks();
            this.render();
        }

        render(): void
        {
            this.addDefaultPages();

            this.renderPages();
            this.renderMenu();
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

                this.pages.push( page );
            });

            $("#main").append(main);
        }

        private renderMenu(): void
        {
            var title: string = "BenchViewer";
            var pageUl = $( "<ul>" );
            pageUl.addClass( "nav nav-sidebar" );

            this.pages.forEach( page =>
            {
            });

            $( "#page-navigation" ).append( pageUl );
        }
    }

    window.onload = () =>
    {
        var viewer: BenchViewer = new BenchViewer(benchmarkData);

        $("body").scrollspy({ target: ".nav-sub-container" });

        $(".tab-me").click(function (e)
        {
            e.preventDefault();
            $(this).tab('show');
        });
    };
}