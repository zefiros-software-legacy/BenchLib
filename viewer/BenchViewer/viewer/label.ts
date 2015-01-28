module BenchViewer
{
    export class Label
    {
        public content: string;
        public container: JQuery;

        public static type = {
            grey: "label label-default",
            blue: "label label-primary",
            green: "label label-success",
            aqua: "label label-info",
            orange: "label label-warning",
            red: "label label-danger"
        }

        constructor(type: string, content: string = "")
        {
            this.container = $("<span>");
            this.container.addClass(type);
            this.content = content;
        }
        
        public renderTo(element: JQuery)
        {
            this.container.html(this.content);
            element.append(this.container);
        }

        public static success()
        {
            return new Label(this.type.green, "C");
        }

        public static failure()
        {
            return new Label(this.type.red, "F");
        }

        public static status(completed: boolean)
        {
            return completed ? this.success() : this.failure();
        }
    }
} 