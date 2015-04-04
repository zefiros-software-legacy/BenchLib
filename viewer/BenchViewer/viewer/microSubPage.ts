/// <reference path="./subPage.ts"/>

module BenchViewer
{
    import Regression = Core.Regression;
    import Config = Core.Config;
    import MicroBoxplot = BenchViewer.Core.MicroBoxplot;
    import MicroHistogram = BenchViewer.Core.MicroHistogram;

    export class MicroSubPage extends SubPage
    {
        public benchmark: Core.Benchmark;

        public analysis: JQuery = $("<div>");
        public overview: JQuery = $("<div>");
        public corrected: JQuery = $("<div>");
        public raw: JQuery = $("<div>");
        public baseline: JQuery = $("<div>");
        public memory: JQuery = $("<div>"); 

        constructor(benchmark: Core.Benchmark, name: string )
        {
            super(name);

            this.benchmark = benchmark;

            this.addAnalysis();

            this.addSeries();

            this.addCorrected();
            this.addRaw();
            this.addBaseline();

            this.addMemory();
        }

        renderTo(element: JQuery): void
        {
            super.renderTo(element);
        }
        
        addLabels(): void
        {
            var statusLabel = Label.status(this.getMostRecentBenchmark().completed);
            statusLabel.container.addClass("pull-right");
            statusLabel.renderTo( this.header );
        }

        getBenchmarkLabel(): Label
        {
            return new Label(Label.type.grey, "&mu;");
        }

        addContent(): JQuery
        {
            var tab = new Tab();
            tab.addTab("Analysis", this.analysis);
            tab.addTab("Overview", this.overview);
            tab.addTab("Corrected", this.corrected);
            tab.addTab("Raw", this.raw);
            tab.addTab("Baseline", this.baseline);
            tab.addTab("Memory", this.memory);
            tab.renderTo(this.container);

            return null;
        }

        private getMostRecentBenchmark(): Core.BenchmarkResult
        {
            return this.benchmark.benchmarkCase == null ? this.benchmark.history[0] : this.benchmark.current;
        }

        private getHistory(): Core.BenchmarkResult[]
        {
            return this.benchmark.benchmarkCase == null ? this.benchmark.history : this.benchmark.history.concat(this.benchmark.current);
        }

        private getCompleted(): Core.BenchmarkResult[]
        {
            return this.getHistory().filter(benchmark => benchmark.completed);
        }

        private getCompletedSeries(): string[]
        {
            var completed = this.getCompleted();
            var series: string[] = [];
            if ( completed.length > 0 )
            {
                this.getHistory().forEach( ( element, index ) =>
                {
                    if ( !element.completed )
                    {
                        return;
                    }

                    series.push( this.getSerie( index ) );
                } );
            }
            return series;
        }

        private addAnalysis(): void
        {
            var current = this.getMostRecentBenchmark();
            var leaks = current.memoryLeaks;
            var hasLeaks = leaks.length > 0;

            this.analysis.append("<h3>Analysis</h3>");

            if (!hasLeaks && current.regression === Regression.None)
            {
                if (current.completed)
                {
                    this.analysis.append("<p>Everything looks OK!</p>");
                }
                else
                {
                    this.analysis.append("<p>Oh dear, it looks like this case needs fixing!</p>");
                }
            }
            else
            {
                if (current.regression !== Regression.None)
                {
                    this.analysis.append("<h4>Regressions Detected</h4>");

                    var p = $("<ul>");
                    if (current.regression & Regression.TimeSlower)
                    {
                        p.append("<li>The case ran <b>slower</b> than expected.</li>");
                    }
                    else if (current.regression & Regression.TimeFaster)
                    {
                        p.append("<li>The case ran <i>faster</i> than expected.</li>");
                    }

                    if (current.regression & Regression.MemSmaller)
                    {
                        p.append("<li>The case used <b>less</b> memory than expected.</li>");
                    }
                    else if (current.regression & Regression.MemLarger)
                    {
                        p.append("<li>The case used <b>more</b> memory than expected.</li>");
                    }

                    if (current.regression & Regression.PeakMemLarger)
                    {
                        p.append("<li>The peak memory was <b>higher</b> than expected.</li>");
                    }

                    this.analysis.append(p);
                }
            }

            if (hasLeaks)
            {
                this.analysis.append("<h3>Memory leaks found</h3>");
                var leakTable = new Table();
                leakTable.setTitle("Memory Leaks");
                leakTable.setHeader(["File", "Line", "Size"]);

                current.memoryLeaks.forEach( element =>
                {
                    leakTable.addRow([
                        element.file,
                        element.line,
                        element.size
                    ]);
                } );

                leakTable.renderTo(this.analysis);
            }
        }

        private addSeries(): void
        {
            this.overview.append("<p><h3>Series</h3>To make the results more readable, we categorise each benchmark with a letter.</p>");

            var table = new Table();

            table.setTitle("Series");
            table.setHeader(["Series", "Date", "Status", "All", "Inliers", "Outliers"]);

            this.getHistory().forEach( (result, index) =>
            {
                var labelDiv: JQuery = $("<div>");
                var label: Label = Label.status(result.completed);
                label.renderTo(labelDiv);

                var allHtml = result.timeCorrected.samples.join(", ");
                var wellAll = $("<div>");
                wellAll.addClass("well well-sm");
                wellAll.html(allHtml === "" ? "-" : allHtml);

                var inlierHtml = result.timeCorrected.inliers.join(", ");
                var wellInlier = $("<div>");
                wellInlier.addClass("well well-sm");
                wellInlier.html(inlierHtml === "" ? "-" : inlierHtml);


                var outlierHtml = result.timeCorrected.outliers.join(", ");
                var wellOutlier = $("<div>");
                wellOutlier.addClass("well well-sm");
                wellOutlier.html(outlierHtml === "" ? "-" : outlierHtml);

                table.addRow([
                    this.getSerie(index),
                    result.timestamp,
                    labelDiv,
                    wellAll,
                    wellInlier,
                    wellOutlier
                ]);
            } );

            table.renderTo(this.overview);
        }

        private getSerie(index: number): string
        {
            var s = "";
            while (index >= 0)
            {
                s = String.fromCharCode(index % 26 + "A".charCodeAt(0)) + s;
                index = Math.floor(index / 26) - 1;
            }
            return s;
        }

        private addCorrected(): void
        {
            var current = this.getMostRecentBenchmark();
            if (current.completed)
            {
                this.renderCorrectedGraphs(this.corrected);
            }

            var table = new Table();

            table.setTitle("Corrected Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, data => data.timeCorrected);

            table.renderTo(this.corrected);

        }
        
        private addRaw(): void
        {
            var current = this.getMostRecentBenchmark();
            if (current.completed)
            {
                this.renderSampleGraphs(this.raw);
            }

            var table = new Table();

            table.setTitle("Raw Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, result => result.timeSamples);

            table.renderTo(this.raw);
        }

        private addBaseline(): void
        {
            var current = this.getMostRecentBenchmark();
            if (current.completed)
            {
                this.renderBaselineGraphs( this.baseline );
            }

            var table = new Table();

            table.setTitle("Baseline Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, (result => result.timeBaseline));

            table.renderTo(this.baseline);
        }

        private addMemory(): void
        {
            var current = this.getMostRecentBenchmark();
            if (current.completed)
            {
                this.renderMemoryGraphs( this.memory );
            }

            var table = new Table();

            table.setTitle("Memory Measurements");
            table.setHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

            this.composeRows(table, current.completed, result => result.memorySamples);

            table.renderTo(this.memory);
        }

        private renderCorrectedGraphs(element: JQuery): void
        {
            var tabs = new Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = result => result.timeCorrected;

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));
            tabs.addTab("Samples", this.renderSamplePlot(tabs, result => [
                {
                    name: "Raw",
                    data: result.timeSamples.samples
                },
                {
                    name: "Baseline",
                    data: result.timeBaseline.samples
                }]
                ));

            tabs.renderTo(element);
        }

        private renderSampleGraphs(element: JQuery): void
        {
            var tabs = new Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = result => result.timeSamples;

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));

            tabs.renderTo(element);
        }

        private renderBaselineGraphs(element: JQuery): void
        {
            var tabs = new Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = result => result.timeBaseline;

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));

            tabs.renderTo(element);
        }

        private renderMemoryGraphs(element: JQuery): void
        {
            var tabs = new Tab(true);
            tabs.container.addClass("graph-pane");

            var dataFunction = result => result.timeCorrected;

            tabs.addTab("Boxplot", this.renderBoxplot(tabs, dataFunction));
            tabs.addTab("Histogram", this.renderHistogram(tabs, dataFunction));
            tabs.addTab("Samples", this.renderSamplePlot(tabs, result => [{
                name: "Memory Usage",
                data: dataFunction(result).samples
            }]));

            tabs.renderTo(element);
        }

        private composeRows(table: Table, completed: boolean, dataFunc): void
        {
            if (completed)
            {
                this.getHistory().forEach((element, index) =>
                {
                    if (!element.completed)
                    {
                        return;
                    }

                    var data = dataFunc(element);

                    var med = data.median.toFixed(Config.precision);
                    var avg = data.sampleStats.average.toFixed(Config.precision);
                    var sd = data.sampleStats.standardDeviation.toFixed(Config.precision);
                    var low = data.sampleStats.low.toFixed(Config.precision);
                    var high = data.sampleStats.high.toFixed(Config.precision);
                    table.addRow([this.getSerie(index), avg, med, sd, low, high]);
                });
            }
            else
            {
                table.addRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
            }
        }

        private renderBoxplot(tabs: Tab, dataFunction: (result: any) => Core.BenchmarkData)
        {
            var div = $("<div>");
            div.addClass("graph");

            var graph = new MicroBoxplot(dataFunction,this.getCompleted(), this.getCompletedSeries());
            graph.renderTo(div);

            return div;
        }

        private renderHistogram(tabs: Tab, dataFunction: (result: any) => Core.BenchmarkData)
        {
            var div = $("<div>");
            div.addClass("graph");

            var current = this.getMostRecentBenchmark();
            if (current.completed)
            {
                var samples = dataFunction(current).samples;
                if (samples.length > 1)
                {

                    var graph = new MicroHistogram(samples);
                    graph.renderTo(div);
                }
                else
                {
                    div.append("<h4>Not enough data to show!</h4>");
                }
            }
            else
            {
                div.append("<h4>The most recent benchmark failed!</h4>");
            }

            return div;
        }


        renderSamplePlot(tabs: Tab, dataFunction)
        {
            var div = $("<div>");
            div.addClass("graph");

            var current = this.benchmark.current;
            if (current.completed)
            {
                var samples = dataFunction(current);
                if (samples.length > 1)
                {
                    var graph = new MicroSamplePlot({
                        "series": samples
                    });
                    graph.renderTo(div);
                }
                else
                {
                    div.append("<h4>Not enough data to show!</h4>");
                }
            }
            else
            {
                div.append("<h4>The most recent benchmark failed!</h4>");
            }

            return div;
        }
    }
}