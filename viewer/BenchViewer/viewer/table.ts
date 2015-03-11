module BenchViewer
{
    export class Table
    {
        public columns = 0;
        public rows = 0;

        public container = $("<div>");
        public title = $("<div>");
        public table = $("<table>");
        public tableHeader = $("<tr>");
        public tableBody = $("<tbody>");

        constructor()
        {
            this.container.addClass( "panel panel-default" );
            this.title.addClass( "panel-heading" );
            this.table.addClass( "table table-striped" );
            this.table.attr( "data-sortable", " " );

            var thead = $( "<thead>" );
            thead.append( this.tableHeader );

            this.table.append( thead );
            this.table.append( this.tableBody );

            this.container.append( this.title );
            this.container.append( this.table );
        }

        setTitle( name: string )
        {
            this.title.html( name );
        }

        setHeader(titles: any[] )
        {
            for ( var i = 0, end = titles.length; i < end; ++i )
            {
                var th = $( "<th>" );
                th.html( titles[ i ] );
                this.tableHeader.append( th );
            }
            this.columns = titles.length;
        }

        addRow( data: any[] )
        {
            var tr = $( "<tr>" );
            for ( var i = 0, end = data.length; i < end; ++i )
            {
                var td = $( "<td>" );
                td.html( data[ i ] );

                tr.append( td );
            }
            this.tableBody.append( tr );

            ++this.rows;
        }

        addRowspan( html: string ): void
        {
            var tr = $( "<tr>" );
            var td = $( "<td>" );
            td.attr( "colspan", this.columns );
            td.append( html );
            tr.append( td );

            this.tableBody.append( tr );

            ++this.rows;
        }

        renderTo( element: JQuery ): void
        {
            element.append( this.container );
        }
    }
}