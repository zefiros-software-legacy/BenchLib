module BenchViewer
{
    import Guid = Core.guid;

    export class Tab
    {
        public htmlClass: string = "tab-me";
        public size: number = 0;

        public container: JQuery;
        public ul: JQuery;
        public content: JQuery;

        constructor(public vertical: boolean = false)
        {
            this.container = $("<div>");
            this.ul = $("<ul>");
            this.ul.addClass("nav nav-tabs");
            this.ul.attr("role", "tablist");

            this.content = $("<div>");
            this.content.addClass("tab-content");

            if ( this.vertical )
            {
                this.ul.addClass("tabs-left");

                var tabDiv: JQuery = $("<div>");
                tabDiv.addClass("col-xs-3 col-md-2");
                tabDiv.append(this.ul);

                var contentDiv: JQuery = $("<div>");
                contentDiv.addClass("col-xs-7 col-md10");
                contentDiv.append(this.content);

                this.container.addClass("container-fluid");

                this.container.append(tabDiv);
                this.container.append(contentDiv);
            }
            else
            {
                this.container.append(this.ul);
                this.container.append(this.content);
            }
        }

        addTab(name, contents): string
        {
            var first = this.size++ === 0;
            var li = $("<li>");
            var link = $("<a>");

            var id = Guid();

            link.attr("href", "#" + id );
            link.addClass(this.htmlClass);

            link.html(name);

            li.append(link);

            this.ul.append(li);

            var pane = $("<div>");
            pane.addClass("tab-pane inner-tab-pane");

            pane.attr("id", id );
            pane.append(contents);

            if (first)
            {
                li.addClass("active");
                pane.addClass("active");
            }

            this.content.append(pane);

            return id;
        }

        renderTo(element): void
        {
            element.append(this.container);
        }
    }
}