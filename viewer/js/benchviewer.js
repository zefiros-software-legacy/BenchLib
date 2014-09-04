function BenchmarkViewer(ctor)
{
    this.groups = new Map();
    this.data = {};
    this.latestTimestamp = "";

    this.mainPageID = "--main";
    this.subPages = new Map();

    this.BenchmarkViewer = function ()
    {
        AddPages.call(this);
        this.Deserialise(this.data, true);
    }

    this.Deserialise = function (obj, hasCurrent)
    {
        Config.Deserialise(obj.config, hasCurrent);
        var self = this;
        obj.groups.forEach((function (element)
        {
            var name = element.name;

            if (self.groups.Has(name) !== true)
            {
                var group = new Group();
                self.groups.Set(name, group);
                group.Deserialise(element, hasCurrent);
            }
        }))
    }

    this.Render = function ()
    {
        RenderMenu.call(this);
        RenderPages.call(this);
    }

    var RenderPages = function ()
    {
        var main = $("<div>");
        main.addClass("tab-content");

        this.groups.Foreach(function (group, name)
        {
            var page = new Page({
                "group": group,
                "name": name
            });
            page.RenderTo(main);
        });
        $("#main").append(main);
    }

    var RenderMenu = function ()
    {
        var pageUl = $("<ul>");
        pageUl.addClass("nav nav-sidebar");

        this.groups.Foreach(function (group, name)
        {
            var group = new MenuGroup({
                "group": group,
                "name": name
            });
            group.RenderTo(pageUl);
        });

        $("#page-navigation").append(pageUl);
    }

    var AddPages = function ()
    {
        var title = "Overview";

        this.subPages.Set(title, new OverviewSubPage({
            "name": title
        }));

        this.groups.Set("Main", new Group({
            "name": "Main",
            "subPages": this.subPages
        }));
    }

    __ConstructObject(this, ctor);
}

function MenuGroup(ctor)
{
    this.group = {};
    this.name = "";
    this.id = "#";

    this.li = {};
    this.link = {};
    this.title = {};

    this.subpagesContainer = {};
    this.subpagesUl = {};

    this.MenuGroup = function ()
    {
        this.id = Util.ComposePageID(this.name);
    }

    this.RenderTo = function (element)
    {
        this.li = $("<li>");

        AddPageLink.call(this);

        RenderMenuSubpages.call(this);

        AddCountBadge.call(this);

        element.append(this.li);
    }

    var AddPageLink = function ()
    {
        AddLink.call(this);

        AddTitle.call(this);

        this.li.append(this.link);
    }

    var RenderMenuSubpages = function ()
    {
        this.subpagesContainer = $("<div>");
        this.subpagesContainer.addClass("nav-sub-container");

        this.subpagesUl = $("<ul>");
        this.subpagesUl.addClass("nav nav-sub");
        this.subpagesUl.attr("role", "tablist");

        var self = this;

        this.group.subPages.Foreach((function (page, name)
        {
            var type = Benchmarks.Type.Page;
            var subpage = new MenuSubpage({
                "id": Util.ComposeBenchIDFromPage(self.id, type, name),
                "name": name
            });
            subpage.RenderTo(self.subpagesUl);
        }));

        this.group.micros.all.Foreach((function (benchmark, name)
        {
            var current = benchmark.current;

            var subpage = new MicroMenuSubpage({
                "id": Util.ComposeBenchIDFromPage(self.id, benchmark.GetType(), name),
                "completed": current.completed,
                "name": name
            });
            subpage.RenderTo(self.subpagesUl);
        }));


        this.subpagesContainer.append(this.subpagesUl);

        this.li.append(this.subpagesContainer);
    }

    var AddLink = function ()
    {
        this.link = $("<a>");
        this.link.addClass("left benchGroup");
        this.link.attr("title", this.name);
        this.link.attr("href", "#" + this.id);
    }

    var AddTitle = function ()
    {
        this.title = $("<div>");
        this.title.addClass("sub-page-title");
        this.title.html(this.name);

        this.link.html(this.title);
    }

    var AddCountBadge = function ()
    {
        if (this.totalCount > 0)
        {
            var countBadge = $("<span>");
            countBadge.addClass("badge pull-right");
            countBadge.html(this.successCount + " / " + this.group.GetCount());

            this.link.append(countBadge);
        }
    }

    function MenuSubpage(ctor)
    {
        this.name = "";

        this.id = "#";

        this.li = {};
        this.link = {};
        this.title = {};
        this.labels = {};

        this.RenderTo = function (element)
        {
            this.li = $("<li>");

            this.AddSubPageLink();

            this.AddLabels();

            element.append(this.li);
        }

        this.AddSubPageLink = function ()
        {
            this.AddLink();

            this.AddTitle();

            this.li.append(this.link);
        }

        this.AddLink = function ()
        {
            this.link = $("<a>");
            this.link.attr("title", this.name);
            this.link.attr("href", "#" + this.id);
        }

        this.AddTitle = function ()
        {
            this.title = $("<div>");
            this.title.addClass("sub-page-title");
            this.title.html(this.name);

            this.link.html(this.title);
        }

        this.AddLabels = function ()
        {
            this.labels = $("<div>");
            this.labels.addClass("pull-right label-holder");
            this.link.append(this.labels);
        }

        __ConstructObject(this, ctor);
    }

    function MicroMenuSubpage(ctor)
    {
        MenuSubpage.apply(this);

        this.completed = false;

        this.RenderTo = function (element)
        {
            this.li = $("<li>");

            this.AddSubPageLink();

            this.AddLabels();

            this.labels.append(Label.Status(this.completed));

            this.labels.append(Label.Benchmark(Benchmarks.Type.Micro));

            element.append(this.li);
        }

        __ConstructObject(this, ctor);
    }

    __ConstructObject(this, ctor);
}

function Page(ctor)
{
    this.group = {};
    this.name = "";
    this.id = "#";

    this.container = {};

    this.Page = function ()
    {
        this.id = Util.ComposePageID(this.name);

        this.container = $("<div>");
        this.container.addClass("tab-pane panel panel-default page");
        this.container.attr("id", this.id);

        var header = $("<h1>");
        header.addClass("page-header");
        header.html(this.name);

        this.container.append(header);
    }

    this.RenderTo = function (element)
    {
        var self = this;
        this.group.subPages.Foreach((function (page, name)
        {
            var type = Benchmarks.Type.Page;
            page.id = Util.ComposeBenchIDFromPage(self.id, type, name);
            page.RenderTo(self.container);
        }));


        this.group.micros.all.Foreach((function (benchmark, name)
        {
            var type = benchmark.GetType();
            var page = new MicroSubPage({
                "id": Util.ComposeBenchIDFromPage(self.id, type, name),
                "benchmark": benchmark,
                "name": name
            });
            page.RenderTo(self.container);
        }));

        element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function SubPage(ctor)
{
    this.name = "";

    this.id = "#";

    this.container = {};

    this.SubPage = function ()
    {
        this.container = $("<div>");
        this.container.addClass("sub-page");

        var header = $("<h2>");
        header.addClass("sub-header");
        header.append(Label.Benchmark(this.GetType()));
        header.append("\t" + this.name);

        this.container.append(header);

        this.container.append(this.AddContent(this.container));
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.Page;
    }

    this.RenderTo = function (element)
    {
        this.container.attr("id", this.id);

        element.append(this.container);
    }

    this.AddContent = function (container)
    {
        return;
    }

    __ConstructObject(this, ctor);
}

function MicroSubPage(ctor)
{
    SubPage.apply(this);

    this.benchmark = {};

    this.hasCompleted = false;

    this.analysis = $("<div>");
    this.overview = $("<div>");
    this.corrected = $("<div>");
    this.raw = $("<div>");
    this.baseline = $("<div>");
    this.memory = $("<div>");

    this.MicroSubPage = function ()
    {
        this.SubPage();

        this.hasCompleted = this.benchmark.GetCompleted().length > 0;

        AddAnalysis.call(this);

        AddSeries.call(this);
        AddData.call(this);

        AddCorrected.call(this);
        AddRaw.call(this);
        AddBaseline.call(this);
        AddMemory.call(this);
    }

    this.AddContent = function (container)
    {
        var tab = new Tab({
            "IDprefix": this.id
        });
        tab.AddTab("Analysis", this.analysis);
        tab.AddTab("Overview", this.overview);
        tab.AddTab("Corrected", this.corrected);
        tab.AddTab("Raw", this.raw);
        tab.AddTab("Baseline", this.baseline);
        tab.AddTab("Memory", this.memory);
        tab.RenderTo(container);
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.Micro;
    }

    var AddSeries = function ()
    {
        this.overview.append("<p><h3>Series</h3>To make the results more readable, we categorise each benchmark with a letter.</p>");

        var table = new Table();

        table.SetTitle("Series");
        table.SetHeader(["Series", "Date", "Status"]);

        this.benchmark.history.forEach((function (result)
        {
            table.AddRow([result.GetSerie(), result.timestamp, Label.Status(result.completed)]);
        }))

        table.RenderTo(this.overview);
    }

    var AddData = function ()
    {
        this.overview.append("<p><h3>Data</h3></p>");

        var table = new Table();

        table.SetTitle("Data");
        table.SetHeader(["Series", "All", "Inliers", "Outliers"]);

        if (this.hasCompleted)
        {
            this.benchmark.GetCompleted().forEach((function (element)
            {
                var allHtml = element.timeCorrected.samples.join(", ");
                var wellAll = $("<div>");
                wellAll.addClass("well well-sm");
                wellAll.html(allHtml === "" ? "-" : allHtml);

                var inlierHtml = element.timeCorrected.inliers.join(", ");
                var wellInlier = $("<div>");
                wellInlier.addClass("well well-sm");
                wellInlier.html(inlierHtml === "" ? "-" : inlierHtml);


                var outlierHtml = element.timeCorrected.outliers.join(", ");
                var wellOutlier = $("<div>");
                wellOutlier.addClass("well well-sm");
                wellOutlier.html(outlierHtml === "" ? "-" : outlierHtml);

                table.AddRow([element.GetSerie(), wellAll, wellInlier, wellOutlier]);
            }));
        }
        else
        {
            table.AddRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
        }

        table.RenderTo(this.overview);
    }

    var AddCorrected = function ()
    {
        if (this.hasCompleted)
        {
            RenderCorrectedGraphs.call(this, this.corrected);
        }

        var table = new Table();

        table.SetTitle("Corrected Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (data)
        {
            return data.timeCorrected;
        }));

        table.RenderTo(this.corrected);

    }

    var AddRaw = function ()
    {
        if (this.hasCompleted)
        {
            var div = $("<div>");
            div.addClass("graph");

            var history = this.benchmark.GetCompleted();
            var graph = new MicroBoxplot({
                "completedHistory": history,
                "dataFunction": (function (result)
                {
                    return result.timeSamples;
                })
            });
            graph.RenderTo(div);
            this.raw.append(div);
        }

        var table = new Table();

        table.SetTitle("Raw Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (result)
        {
            return result.timeSamples;
        }));

        table.RenderTo(this.raw);
    }

    var AddBaseline = function ()
    {
        if (this.hasCompleted)
        {
            var div = $("<div>");
            div.addClass("graph");

            var history = this.benchmark.GetCompleted();
            var graph = new MicroBoxplot({
                "completedHistory": history,
                "dataFunction": (function (result)
                {
                    return result.timeBaseline;
                })
            });
            graph.RenderTo(div);

            this.baseline.append(div);
        }

        var table = new Table();

        table.SetTitle("Baseline Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (result)
        {
            return result.timeBaseline;
        }));

        table.RenderTo(this.baseline);
    }

    var AddMemory = function ()
    {
        if (this.hasCompleted)
        {
            var tabs = new Tab({
                "IDprefix": this.id + "--Memory--Graphs",
                "vertical": true
            });
            tabs.container.addClass("graph-pane");

            var dataFunction = (function (result)
            {
                return result.memorySamples;
            });
            tabs.AddTab("Boxplot", RenderBoxplot.call(this, tabs, dataFunction));
            tabs.AddTab("Histogram", RenderHistogram.call(this, tabs, dataFunction));
            tabs.AddTab("Samples", RenderSamplePlot.call(this, tabs, (function (result)
            {
                return [{
                    name: "Memory Usage",
                    data: dataFunction(result).samples
                }]
            })));

            tabs.RenderTo(this.memory);
        }

        var table = new Table();

        table.SetTitle("Memory Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (result)
        {
            return result.memorySamples;
        }));

        table.RenderTo(this.memory);
    }

    var AddAnalysis = function ()
    {
        var current = this.benchmark.current;
        var leaks = current.memoryLeaks;
        var hasLeaks = leaks.length > 0;

        this.analysis.append("<h3>Analysis</h3>");

        if (!hasLeaks && current.regression === Benchmarks.Regression.None)
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
            if (current.regression !== Benchmarks.Regression.None)
            {
                this.analysis.append("<h4>Regressions Detected</h4>");

                var p = $("<ul>");
                if (current.regression & Benchmarks.Regression.TimeSlower)
                {
                    p.append("<li>The case ran <b>slower</b> than expected.</li>");
                }
                else if (current.regression & Benchmarks.Regression.TimeFaster)
                {
                    p.append("<li>The case ran <i>faster</i> than expected.</li>");
                }

                if (current.regression & Benchmarks.Regression.MemSmaller)
                {
                    p.append("<li>The case used <b>less</b> memory than expected.</li>");
                }
                else if (current.regression & Benchmarks.Regression.MemLarger)
                {
                    p.append("<li>The case used <b>more</b> memory than expected.</li>");
                }

                if (current.regression & Benchmarks.Regression.PeakMemLarger)
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
            leakTable.SetTitle("Memory Leaks");
            leakTable.SetHeader(["File", "Line", "Size"]);

            this.benchmark.current.memoryLeaks.forEach((function (element)
            {
                leakTable.AddRow([element.file, element.line, element.size]);
            }));

            leakTable.RenderTo(this.analysis);
        }
    }

    var ComposeRows = function (table, dataFunc)
    {
        if (this.hasCompleted)
        {
            this.benchmark.GetCompleted().forEach((function (element)
            {
                var data = dataFunc(element);

                var med = data.median.toFixed(Config.Precision);
                var avg = data.sampleStats.average.toFixed(Config.Precision);
                var sd = data.sampleStats.standardDeviation.toFixed(Config.Precision);
                var low = data.sampleStats.low.toFixed(Config.Precision);
                var high = data.sampleStats.high.toFixed(Config.Precision);
                table.AddRow([element.GetSerie(), avg, med, sd, low, high]);
            }));
        }
        else
        {
            table.AddRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
        }
    }

    var RenderCorrectedGraphs = function (element)
    {
        var tabs = new Tab({
            "IDprefix": this.id + "--Corrected--Graphs",
            "vertical": true
        });
        tabs.container.addClass("graph-pane");

        if (this.hasCompleted)
        {
            var dataFunction = (function (result)
            {
                return result.timeCorrected;
            });
            tabs.AddTab("Boxplot", RenderBoxplot.call(this, tabs, dataFunction));
            tabs.AddTab("Histogram", RenderHistogram.call(this, tabs, dataFunction));
            tabs.AddTab("Samples", RenderSamplePlot.call(this, tabs, (function (result)
            {
                return [
                    {
                        name: "Raw",
                        data: result.timeSamples.samples
                    },
                    {
                        name: "Baseline",
                        data: result.timeBaseline.samples
                    }]
            })));
        }

        tabs.RenderTo(element);
    }

    var RenderBoxplot = function (tabs, dataFunction)
    {
        var div = $("<div>");
        div.addClass("graph");

        var graph = new MicroBoxplot({
            "completedHistory": this.benchmark.GetCompleted(),
            "dataFunction": dataFunction
        });
        graph.RenderTo(div);

        return div;
    }

    var RenderHistogram = function (tabs, dataFunction)
    {
        var div = $("<div>");
        div.addClass("graph");

        var current = this.benchmark.current;
        if (current.completed)
        {
            var samples = dataFunction(current).samples;
            if (samples.length > 1)
            {

                var graph = new DataHistogram({
                    "samples": samples
                });
                graph.RenderTo(div);
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

    var RenderSamplePlot = function (tabs, dataFunction)
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
                graph.RenderTo(div);
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

    __ConstructObject(this, ctor);
}

function OverviewSubPage(ctor)
{
    SubPage.apply(this);

    this.OverviewSubPage = function ()
    {
        this.name = "Overview";
        this.SubPage();
    }

    this.AddContent = function (container)
    {
        return "\
        <p>\
        These pages will describe your benchmarks results benchmarks.\
        We also try to help with automatically analysing the results,\
        which will make your life easier.\
        </p>\
        <p>\
        <h3>Explanation</h3> \
        You will notice the symbols on the left of the benchmark name in the\
        left side menu. These symbols indicate what kind of benchmark this particular case is.\
        <p>\
        <div class=\"panel panel-default\">\
            <div class=\"panel-heading\">Benchmark Types</div>\
            <table class=\"table table-striped\">\
		    <tbody>\
			    <tr>\
				    <th>\
					    Symbol\
				    </th>\
				    <th>\
					    Meaning\
				    </th>\
			    </tr>\
			    <tr>\
				    <td>\
					    <span class=\"label label-default\">&mu;</span>\
				    </td>\
				    <td>\
					    Micro benchmark\
				    </td>\
			    </tr>\
			    <tr>\
				    <td>\
				    <span class=\"label label-default\">V</span>\
				    </td>\
				    <td>\
					    Variant benchmark\
				    </td>\
			    </tr>\
			    <tr>\
				    <td>\
				    <span class=\"label label-default\">A</span>\
				    </td>\
				    <td>\
					    Advanced benchmark\
				    </td>\
			    </tr>\
		    </tbody>\
	        </table>\
        </div>\
        </p>";
    }

    __ConstructObject(this, ctor);
}

function Group(ctor)
{
    this.name = "";

    this.subPages = new Map();

    this.micros = new BenchmarkGroup({
        "benchmarkType": MicroBenchmark
    });

    this.variants = new BenchmarkGroup();
    this.advanced = new BenchmarkGroup();

    this.Deserialise = function (obj, hasCurrent)
    {
        this.name = obj.name;
        this.micros.name = obj.name;

        this.micros.Deserialise(obj.micros, hasCurrent);
    }

    this.AddMicroBenchmark = function (benchmark)
    {
        return this.micros.AddBenchmark(benchmark);
    }

    this.GetCount = function ()
    {
        return GetMicroCount.call(this);
    }

    this.GetCompletedCount = function ()
    {
        return GetMicroCompletedCount.call(this);
    }

    var GetMicroCount = function ()
    {
        return this.micros.all.Size();
    }

    var GetMicroCompletedCount = function ()
    {
        return this.micros.completed.length;
    }

    __ConstructObject(this, ctor);
}

function BenchmarkGroup(ctor)
{
    this.name = "";

    this.benchmarkType = {};

    this.all = new Map();
    this.completed = [];
    this.failed = [];

    this.Deserialise = function (obj, hasCurrent)
    {
        var self = this;
        obj.forEach((function (element)
        {
            var name = element.name;
            var benchmark;

            if (self.all.Has(name) !== true)
            {
                benchmark = new self.benchmarkType();

                benchmark.Deserialise(element, hasCurrent);

                self.all.Set(name, benchmark);
            }
            else
            {
                benchmark = self.all.Get(name);
                benchmark.Deserialise(element, hasCurrent);
            }

            if (hasCurrent !== true)
            {
                if (benchmark.IsCompleted())
                {
                    self.completed.push(benchmark);
                }
                else
                {
                    self.failed.push(benchmark);
                }
            }
        }));
    }

    this.AddBenchmark = function (benchmark)
    {
        var name = benchmark.GetName();
        if (this.all.Has(benchmark) === false)
        {
            this.all.Set(name, benchmark);
            return true;
        }

        return false;
    }

    __ConstructObject(this, ctor);
}

function MicroBenchmark(ctor)
{
    this.name = "";
    this.history = [];
    this.current = new MicroResult();

    this.Deserialise = function (obj, hasCurrent)
    {
        this.name = obj.name;
        var self = this;
        obj.history.forEach((function (element)
        {
            var result = new MicroResult();
            result.Deserialise(element, hasCurrent);
            self.history.unshift(result);
        }));
        this.history.length = Config.MicroMaxHistory - 1;

        var result = new MicroResult();
        result.Deserialise(obj.current, hasCurrent);

        this.history.unshift(result);

        this.history.forEach((function (element, index)
        {
            element.index = index;
        }))

        if (hasCurrent)
        {
            this.current = result;
        }
    }

    this.GetCompleted = function ()
    {
        var completed = [];
        this.history.forEach((function (element)
        {
            if (element.completed)
            {
                completed.push(element);
            }
        }));
        return completed;
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.Micro;
    }

    this.IsCompleted = function ()
    {
        return this.current.completed;
    }

    __ConstructObject(this, ctor);
}

function MicroResult(ctor)
{
    this.timeSamples = new MicroData();
    this.timeBaseline = new MicroData();
    this.timeCorrected = new MicroData();

    this.memorySamples = new MicroData();

    this.regression = 0;

    this.memoryLeaks = [];

    this.timestamp = "";

    this.operationCount = 0;
    this.sampleCount = 0;

    this.memoryProfile = false;
    this.completed = false;

    this.index = 0;

    this.Deserialise = function (obj, hasCurrent)
    {
        this.completed = obj.completed;
        this.timestamp = obj.timestamp;

        if (this.completed)
        {
            this.operationCount = obj.operationCount;
            this.sampleCount = obj.sampleCount;

            if (typeof obj.regression !== "undefined")
            {
                this.regression = obj.regression;
            }

            this.timeSamples.Deserialise(obj.timeSamples, hasCurrent);
            this.timeBaseline.Deserialise(obj.timeBaseline, hasCurrent);

            if (typeof obj.timeCorrected === "undefined")
            {
                this.timeCorrected.SetSamples(this.timeSamples.samples, this.timeBaseline.sampleStats.average);
            }
            else
            {
                this.timeCorrected.Deserialise(obj.timeCorrected, hasCurrent);
            }

            if (typeof obj.memoryProfile !== "undefined")
            {
                this.memoryProfile = obj.memoryProfile;
                if (this.memoryProfile)
                {
                    this.memorySamples.Deserialise(obj.memorySamples, hasCurrent);

                    if (typeof obj.memoryLeaks !== "undefined")
                    {
                        var self = this;
                        obj.memoryLeaks.forEach((function (element)
                        {
                            var leak = new MemLeak();
                            leak.Deserialise(element, hasCurrent);
                            self.memoryLeaks.push(leak);
                        }))
                    }
                }
            }
        }
    }

    this.GetSerie = function ()
    {
        return IndexToSeries.call(this, this.index);
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.None;
    }

    var IndexToSeries = function (n)
    {
        var s = "";
        while (n >= 0)
        {
            s = String.fromCharCode(n % 26 + 'A'.charCodeAt()) + s;
            n = Math.floor(n / 26) - 1;
        }
        return s;
    }

    __ConstructObject(this, ctor);
}

function MicroData(ctor)
{
    this.samples = [];
    this.inliers = [];
    this.outliers = [];

    this.inlierStats = new MicroStat();
    this.sampleStats = new MicroStat();

    this.median = 0.0;
    this.Q1 = 0.0;
    this.Q3 = 0.0;

    this.Deserialise = function (obj, hasCurrent)
    {
        var self = this;
        obj.samples.forEach((function (element)
        {
            self.samples.push(element);
        }));

        var validSize = this.IsValid();

        if (typeof obj.sampleStats === "undefined" && validSize)
        {
            CalculateSampleStats.call(this);
        }
        else
        {
            if (validSize)
            {
                this.sampleStats.Deserialise(obj.sampleStats, hasCurrent);
            }
        }

        if (validSize)
        {
            if (typeof obj.inliers === "undefined" || typeof obj.outliers === "undefined")
            {
                CalculatePercentileStats.call(this);
            }
            else
            {
                this.median = obj.median;
                this.Q1 = obj.Q1;
                this.Q3 = obj.Q3;

                obj.outliers.forEach((function (element)
                {
                    self.outliers.push(element);
                }));

                obj.inliers.forEach((function (element)
                {
                    self.inliers.push(element);
                }));

                if (this.inliers.length > 1)
                {
                    this.inlierStats.Deserialise(obj.inlierStats, hasCurrent);
                }
            }
        }
    }

    this.SetSamples = function (samples, correction)
    {
        if (typeof correction !== "undefined")
        {
            samples.forEach((function (element)
            {
                element -= correction;
            }));
        }

        this.samples = samples;
        CalculateSampleStats.call(this);
        CalculatePercentileStats.call(this);
    }

    this.IsValid = function ()
    {
        return this.samples.length > 1;
    }

    var CalculatePercentileStats = function ()
    {
        if (!this.IsValid())
        {
            return;
        }

        var sortedSamples = this.samples;
        sortedSamples.sort(function (a, b) { return a - b; });

        var length = sortedSamples.length;
        var half = Math.floor(length / 2);
        var quart = Math.floor(half / 2);

        this.median = CalculateQ.call(this, sortedSamples, half);
        this.Q1 = CalculateQ.call(this, sortedSamples, half - quart);
        this.Q3 = CalculateQ.call(this, sortedSamples, half + quart);


        var IQR = this.Q3 - this.Q1 + Number.EPSILON;
        var lower = this.Q1 - 1.5 * IQR;
        var upper = this.Q3 + 1.5 * IQR;

        sortedSamples.forEach((function (value)
        {
            if (lower <= value && value <= upper)
            {
                this.inliers.unshift(value);
            }
            else
            {
                this.outliers.unshift(value);
            }
        }));

        var inlierLength = this.inliers.length;
        if (inlierLength > 0)
        {
            var inlierStats = new Statistics(this.inliers);
            this.inlierStats.average = inlierStats.mean;
            this.inlierStats.standardDeviation = inlierStats.standardDeviation;
            this.inlierStats.variance = inlierStats.variance;
            this.inlierStats.low = Util.Min(this.inliers);
            this.inlierStats.high = Util.Max(this.inliers);
        }
    }

    var CalculateSampleStats = function ()
    {
        var sampleStats = new Statistics(this.samples);
        this.sampleStats.average = sampleStats.mean;
        this.sampleStats.standardDeviation = sampleStats.standardDeviation;
        this.inlierStats.variance = inlierStats.variance;
        this.sampleStats.low = Util.Min(this.samples);
        this.sampleStats.high = Util.Max(this.samples);
    }

    var CalculateQ = function (array, place)
    {
        var length = array.length;
        if (length % 2 !== 0)
        {
            return array[place];
        }
        else
        {
            return (array[place - 1] + array[place]) * 0.5;
        }
    }

    __ConstructObject(this, ctor);
}

function MicroStat(ctor)
{
    this.average = 0.0;
    this.standardDeviation = 0.0;
    this.variance = 0.0;
    this.low = 0.0;
    this.high = 0.0;

    this.Deserialise = function (obj, hasCurrent)
    {
        this.average = obj.average;
        this.standardDeviation = obj.standardDeviation;
        this.variance = obj.variance;
        this.low = obj.low;
        this.high = obj.high;
    }

    __ConstructObject(this, ctor);
}

function MemLeak(ctor)
{
    this.file = "";
    this.size = 0;
    this.line = 0;

    this.Deserialise = function (obj, hasCurrent)
    {
        this.file = obj.file;
        this.size = obj.size;
        this.line = obj.line;
    }

    __ConstructObject(this, ctor);
}

function Statistics(samples)
{
    this.standardDeviation = 0.0;
    this.variance = 0.0;
    this.mean = 0.0;

    this.Statistics = function ()
    {
        this.mean = CalculateMean.call(this, samples);
        this.variance = CalculateVariance.call(this, samples, this.mean);
        this.standardDeviation = Math.sqrt(this.variance);
    }

    var CalculateMean = function (data)
    {
        if (data.length > 0)
        {
            return data.reduce((function (a, b)
            {
                return a + b;
            })) / data.length;
        }
        return 0;
    }

    var CalculateVariance = function (data, mean)
    {
        if (data.length > 1)
        {
            var temp = 0.0;
            data.forEach((function (element)
            {
                var v = element - mean;
                temp += v * v;
            }))
            return temp / (data.length - 1);
        }
        return 0;
    }

    __ConstructObject(this);
}

function Table(ctor)
{
    this.columns = 0;
    this.rows = 0;

    this.container = {};
    this.title = {};
    this.table = {};
    this.tableHeader = {};
    this.tableBody = {};

    this.Table = function ()
    {
        this.container = $("<div>");
        this.container.addClass("panel panel-default");

        this.title = $("<div>");
        this.title.addClass("panel-heading");

        this.table = $("<table>");
        this.table.addClass("table table-striped");
        this.table.attr("data-sortable", " ");

        this.tableBody = $("<tbody>");

        var thead = $("<thead>");
        this.tableHeader = $("<tr>");

        thead.append(this.tableHeader);

        this.table.append(thead);
        this.table.append(this.tableBody);

        this.container.append(this.title);
        this.container.append(this.table);
    }

    this.SetTitle = function (name)
    {
        this.title.html(name);
    }

    this.SetHeader = function (titles)
    {
        for (var i = 0, end = titles.length; i < end; ++i)
        {
            var th = $("<th>");
            th.html(titles[i]);
            this.tableHeader.append(th);
        }
        this.columns = titles.length;
    }

    this.AddRow = function (data)
    {
        var tr = $("<tr>");
        for (var i = 0, end = data.length; i < end; ++i)
        {
            var td = $("<td>");
            td.html(data[i]);

            tr.append(td);
        }
        this.tableBody.append(tr);

        ++this.rows;
    }

    this.AddRowspan = function (html)
    {
        var tr = $("<tr>");
        var td = $("<td>");
        td.attr("colspan", this.columns);
        td.html(html);
        tr.append(td);

        this.tableBody.append(tr);

        ++this.rows;
    }

    this.RenderTo = function (element)
    {
        element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function Tab(ctor)
{
    this.IDprefix = "";
    this.class = "tab-me";
    this.vertical = false;

    this.size = 0;

    this.container = {};
    this.ul = {};
    this.content = {};

    this.Tab = function ()
    {
        this.container = $("<div>");

        this.ul = $("<ul>");
        this.ul.addClass("nav nav-tabs");
        this.ul.attr("role", "tablist");

        this.content = $("<div>");
        this.content.addClass("tab-content");

        if (this.vertical)
        {
            this.ul.addClass("tabs-left");

            var tabDiv = $("<div>");
            tabDiv.addClass("col-xs-3 col-md-2");
            tabDiv.html(this.ul);

            var contentDiv = $("<div>");
            contentDiv.addClass("col-xs-7 col-md10");
            contentDiv.html(this.content);

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

    this.AddTab = function (name, contents)
    {
        var first = this.size++ === 0;
        var li = $("<li>");
        var link = $("<a>");
        link.attr("href", "#" + this.IDprefix + "--" + name);
        link.addClass(this.class);

        link.html(name);

        li.append(link);

        this.ul.append(li);

        var pane = $("<div>");
        pane.addClass("tab-pane inner-tab-pane");

        pane.attr("id", this.IDprefix + "--" + name);
        pane.append(contents);

        if (first)
        {
            li.addClass("active");
            pane.addClass("active");
        }

        this.content.append(pane);
    }

    this.RenderTo = function (element)
    {
        element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function MicroBoxplot(ctor)
{
    this.dataFunction = (function (result) { });
    this.completedHistory = [];

    this.averages = [];
    this.standardDeviations = [];
    this.outliers = [];
    this.values = [];

    this.MicroBoxplot = function ()
    {
        var self = this;
        this.completedHistory.forEach((function (result, index)
        {
            var data = self.dataFunction(result);

            self.values.push(Util.RoundArray([data.sampleStats.low, data.Q1, data.median, data.Q3, data.sampleStats.high]));
            self.standardDeviations.push([index, Util.Round(data.sampleStats.standardDeviation)]);
            self.averages.push([index, Util.Round(data.sampleStats.average)]);

            for (var j = 0, outlierEnd = data.outliers.length; j < outlierEnd; ++j)
            {
                var outlier = data.outliers[j];
                self.outliers.push([index, Util.Round(outlier)]);
            }
        }));
    }

    this.GetCategories = function ()
    {
        var categories = [];
        this.completedHistory.forEach((function (result, index)
        {
            categories.push(result.GetSerie());
        }));
        return categories;
    }

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "boxplot",
                reflow: true
            },
            title: {
                text: ""
            },
            xAxis: {
                categories: this.GetCategories(),
                title: {
                    text: "Series"
                }
            },
            yAxis: {
                title: {
                    text: "Time (ms)"
                }
            },
            series: [{
                name: "Measurements",
                data: this.values,
                tooltip: {
                    headerFormat: '<em>Series {point.key}</em><br/>'
                }
            },
            {
                name: "Outliers",
                type: "scatter",
                data: this.outliers,
                marker: {
                    fillColor: "white",
                    lineWidth: 1,
                    lineColor: Highcharts.getOptions().colors[0]
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
            }]

        });
    }

    __ConstructObject(this, ctor);
}

function MicroSamplePlot(ctor)
{
    this.series = [];

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "line"
            },
            title: {
                text: ""
            },
            xAxis: {
                title: {
                    text: "Sample No."
                }
            },
            yAxis: {
                title: {
                    text: "Time (ms)"
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                }
            },
            series: this.series
        });
    }

    __ConstructObject(this, ctor);
}

function DataHistogram(ctor)
{
    this.samples = [];

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "histogram",
                reflow: true
            },
            title: {
                text: "Recent Histogram"
            },
            plotOptions: {
                column: {
                    pointPadding: 0,
                    borderWidth: 0,
                    groupPadding: 0,
                    shadow: false
                }
            },
            legend: {
                enabled: false
            },
            yAxis: {
                title: {
                    text: "Frequency"
                }
            },
            xAxis: {
                title: {
                    text: "Time (ms)"
                }
            },
            series: [{
                name: "Frequency",
                data: this.samples
            }]

        });
    }

    __ConstructObject(this, ctor);
}

function Map()
{
    this.length = 0;
    this.items = {};

    this.Get = function (key)
    {
        if (this.Has(key) === true)
        {
            return this.items[key];
        }
        return null;
    }

    this.Array = function ()
    {
        var array = [];
        this.Foreach((function (element)
        {
            array.push(element);
        }));
        return array;
    }

    this.Has = function (key)
    {
        return this.items.hasOwnProperty(key);
    }

    this.Set = function (key, value)
    {
        if (this.Has(key) !== true)
        {
            ++this.length;
        }
        this.items[key] = value;
    }

    this.Apply = function (key, func)
    {
        if (this.Has(key) === true)
        {
            func(this.Get(key));
        }
    }

    this.Remove = function (key)
    {
        if (this.Has(key) === true)
        {
            --this.length;
            delete this.items[key];
        }
    }

    this.Clear = function ()
    {
        this.Foreach((function (item)
        {
            delete item;
        }));
        this.length = 0;
    }

    this.Foreach = function (func)
    {
        for (var item in this.items)
        {
            if (this.items.hasOwnProperty(item) === true)
            {
                func(this.items[item], item);
            }
        }
    }

    this.Size = function ()
    {
        return this.length;
    }
}

var Config = {

    Precision: 6,

    MicroMaxHistory: 20,

    Deserialise: function (obj, hasCurrent)
    {
        Config.MicroMaxHistory = obj.microMaxHistory;
    }

}

var Util = {

    Map: function (array, func)
    {
        var result = [];
        array.forEach((function (element)
        {
            result.unshift(func(element));
        }));

        return result;
    },

    ComposePageID: function (page)
    {
        return page;
    },

    ComposeBenchID: function (page, type, subpage)
    {
        return page + "--" + type + "--" + subpage;
    },

    ComposeBenchIDFromPage: function (pageID, type, subpage)
    {
        return pageID + "--" + type + "--" + subpage;
    },

    FixArray: function (array)
    {
        return Util.Map(array, function (x)
        {
            return Util.Fix(x);
        });
    },

    Fix: function (x)
    {
        return parseFloat(x).toFixed(Config.Precision);
    },

    RoundArray: function (array)
    {
        return Util.Map(array, function (x)
        {
            return Util.Round(x);
        });

    },

    Min: function (array)
    {
        return Math.min.apply(Math, array);
    },

    Max: function (array)
    {
        return Math.max.apply(Math, array);
    },

    Round: function (x)
    {
        if (x.toString().indexOf('e') >= 0)
        {
            return Math.round(x);
        }
        var decimals = Config.Precision;
        return +(Math.round(x + "e+" + decimals) + "e-" + decimals);
    },

    FMod: function (x, mod)
    {
        return (x - Math.floor(x / mod) * mod).toPrecision(7);
    }
}

var Benchmarks = {

    Type: {
        None: "None",
        Page: "Page",
        Micro: "Micro",
    },

    Regression: {
        None: 0x00,
        TimeSlower: 0x01,
        TimeFaster: 0x02,
        MemSmaller: 0x04,
        MemLarger: 0x08,
        PeakMemLarger: 0x10
    }
}

var Label = {

    Type: {
        Grey: "label label-default",
        Blue: "label label-primary",
        Green: "label label-success",
        Aqua: "label label-info",
        Orange: "label label-warning",
        Red: "label label-danger"
    },

    Create: function (type, content)
    {
        var span = $("<span>");
        span.addClass(type);
        span.html(content);
        return span;
    },

    Success: function ()
    {
        return Label.Create(Label.Type.Green, "C");
    },

    Failure: function ()
    {
        return Label.Create(Label.Type.Red, "F");
    },

    Status: function (completed)
    {
        return completed ? Label.Success() : Label.Failure();
    },

    Benchmark: function (benchType)
    {
        var content = "";
        switch (benchType)
        {
            case (Benchmarks.Type.None):
                break;
            case (Benchmarks.Type.Page):
                content = "P";
                break;
            case (Benchmarks.Type.Micro):
                content = "&mu;"
                break;
        };
        return Label.Create(Label.Type.Grey, content);
    }
}

function __ConstructObject(object, ctor)
{
    if (typeof ctor !== "undefined")
    {
        for (var prop in object)
        {
            if (object.hasOwnProperty(prop) && ctor.hasOwnProperty(prop))
            {
                object[prop] = ctor[prop];
            }
        }
    }

    var name = object.constructor.name;
    if (typeof object[name] === "function")
    {
        object[name].call(object);
    }
}