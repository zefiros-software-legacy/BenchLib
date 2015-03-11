

module BenchViewer
{
    export class SubPage
    {
        public container: JQuery;
        public header: JQuery;

        constructor(public name: string)
        {
            this.container = $("<div>");
            this.container.addClass("sub-page");

            this.header = $("<h2>");
            this.header.addClass("sub-header");
        }

        addLabels(): void
        {

        }
        
        renderTo(element: JQuery): void
        {
            this.addLabels();

            var benchLabel = this.getBenchmarkLabel();
            benchLabel.container.addClass("pull-right");
            benchLabel.renderTo(this.header);

            this.header.append("\t" + this.name);

            this.container.append(this.header);

            this.container.append(this.addContent());

            element.append( this.container );
        }

        getBenchmarkLabel(): Label
        {
            return new Label( Label.type.grey );
        }

        addContent(): JQuery
        {
            return null;
        }
    }
} 