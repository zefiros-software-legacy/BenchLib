/// <reference path="../core/group.ts" />
/// <reference path="../core/config.ts" />

module BenchViewer
{
    export class TestName
    {
        constructor(public groupName: string, public testName: string)
        {
        }
    }

    export class BenchLib
    {
        public groups: collections.Dictionary<string, Core.Group> = new collections.Dictionary<string, Core.Group>();

        constructor(private data)
        {

        }

        runBenchmarks(): boolean
        {
            this.deserialise(this.data);

            this.setTimestamp();

            var success: boolean = this.runBenchmarkSuites();

            return success;
        }

        serialise(): any
        {
            var groups = [];

            this.groups.forEach((key, value) =>
            {
                groups.push(value.serialise());
            });

            return {
                groups: groups,
                config: Core.Config.serialise()
            };
        }

        deserialise(object): void
        {
            Core.Config.deserialise(object["config"]);

            var groups = object["groups"];

            groups.forEach(group =>
            {
                var name: string = group.name;

                if (!this.groups.containsKey(name))
                {
                    var nGroup: Core.Group = new Core.Group(name);
                    nGroup.deserialise(group);
                    this.groups.setValue(name, nGroup);
                }
                else
                {
                    this.groups.getValue(name).deserialise(group);
                }
            });
        }


        private setTimestamp(): void
        {
            var time: string = new Date().toISOString();
            Core.Config.timestamp = time;
        }

        private checkGroup(group: string): void
        {
            if (!this.groups.containsKey(group))
            {
                this.groups.setValue(group, new Core.Group(group));
            }
        }

        private getFailed(): TestName[]
        {
            var failed: TestName[] = [];

            this.groups.forEach((name, group) =>
            {
                group.getFailedNames().forEach(failedGroup =>
                {
                    var item: TestName = new TestName(name, failedGroup);
                    failed.push(item);
                });
            });

            return failed;
        }

        private getRegressed(): TestName[]
        {
            var regressed: TestName[] = [];

            this.groups.forEach((name, group) =>
            {
                group.getRegressedNames().forEach(failedGroup =>
                {
                    var item: TestName = new TestName(name, failedGroup);
                    regressed.push(item);
                });
            });

            return regressed;
        }

        private getBenchmarkCount(): number
        {
            var count: number = 0;
            this.groups.forEach((name, group) =>
            {
                count += group.getCount();
            });

            return count;
        }

        private runBenchmarkSuites(): boolean
        {
            var benchmarkCount: number = this.getBenchmarkCount();
            var groupCount: number = this.groups.size();

            // Console.init( benchmarkCount, groupCount);

            var start: number = performance.now();
            var failed: boolean = false;
            this.groups.forEach((name, group) =>
            {
                failed = failed || !group.runBenchmarks();
            });

            // Console.end( benchmarkCount, groupCount, performance.now() - start, this.getFailed(), this.getRegressed() );

            return !failed;
        }
    }
}