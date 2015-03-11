
module BenchViewer.Core
{
    export class MicroBoxplot
    {
        public averages = [];
        public standardDeviations = [];
        public outliers = [];
        public values = [];

        constructor( public dataFunction: ( result: any ) => Core.BenchmarkData, public completedHistory: Core.BenchmarkResult[], public series: string[] )
        {
            this.completedHistory.forEach( ( result, index ) =>
            {
                var data = this.dataFunction( result );

                this.values.push( roundArray( [ data.sampleStats.low, data.q1, data.median, data.q3, data.sampleStats.high ] ) );
                this.standardDeviations.push( [ index, round( data.sampleStats.standardDeviation ) ] );
                this.averages.push( [ index, round( data.sampleStats.average ) ] );

                for ( var j = 0, outlierEnd = data.outliers.length; j < outlierEnd; ++j )
                {
                    var outlier = data.outliers[ j ];
                    this.outliers.push( [ index, round( outlier ) ] );
                }
            } );
        }

        getCategories()
        {
            var categories = [];
            this.series.forEach( serie => categories.push( serie ) );
            return categories;
        }

        renderTo( element: JQuery )
        {
            element.highcharts( {
                chart: {
                    type: "boxplot",
                    reflow: true
                },
                title: {
                    text: ""
                },
                xAxis: {
                    categories: this.getCategories(),
                    title: {
                        text: "Series"
                    }
                },
                yAxis: {
                    title: {
                        text: "Time (ms)"
                    }
                },
                series: [
                    {
                        name: "Measurements",
                        data: this.values,
                        tooltip: {
                            headerFormat: "<em>Series {point.key}</em><br/>"
                        }
                    },
                    {
                        name: "Outliers",
                        type: "scatter",
                        data: this.outliers,
                        marker: {
                            fillColor: "white",
                            lineWidth: 1,
                            lineColor: Highcharts.getOptions().colors[ 0 ]
                        },
                        tooltip: {
                            pointFormat: "Outlier: {point.y}"
                        }
                    },
                    {
                        name: "Standard Deviation",
                        type: "line",
                        data: this.standardDeviations,
                        tooltip: {
                            pointFormat: "Standard Deviation: {point.y}"
                        }
                    },
                    {
                        name: "Average",
                        type: "line",
                        data: this.averages,
                        tooltip: {
                            pointFormat: "Average: {point.y}"
                        }
                    }
                ]

            } );
        }
    }
} 