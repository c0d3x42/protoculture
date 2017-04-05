#!/usr/bin/env ts-node
import {BaseServiceProvider, StaticServiceProvider} from "../src";
import {BaseApp} from "../src/App";
import {BaseSuite} from "../src/Suite";
import {ConsoleServiceProvider} from "../src/Console/ConsoleServiceProvider";


//
// This is how we declare a service provider.
class ConsoleDemoServiceProvider extends BaseServiceProvider {

    public async boot(suite: BaseSuite): Promise<void> {

        this.bindApp(BoringConsoleDemoApp);
        this.bindApp(AsynchronousConsoleDemoApp);
    }
}

//
// Here's a boring console demo app.
class BoringConsoleDemoApp extends BaseApp {

    public name = "console-demo";

    protected async onRun(): Promise<void> {

        console.log("This is from the boring console demo app!");
    }
}

class AsynchronousConsoleDemoApp extends BaseApp {

    public name = "async-demo";

    protected _working: boolean;

    protected timeout = 20;

    public get working(): boolean {

        return this._working;
    }

    protected async onRun(): Promise<void> {

        this._working = true;

        let resolveDeferred: any;
        const deferred = new Promise((resolve) => resolveDeferred = resolve);

        const timeout = setTimeout(
            () => {
                console.log(`${this.timeout} second timeout elapsed!`);
                resolveDeferred();
            },
            this.timeout * 1000
        );

        console.log(`${this.timeout} second timeout started.`);

        await deferred;

        this._working = false;
    }
}

//
// Here's a suite that acts as the composition root for everything.
class ConsoleDemoSuite extends BaseSuite {

    protected name = "console-demo";

    protected get serviceProviders(): StaticServiceProvider<any>[] {

        return [
            ConsoleServiceProvider,
            ConsoleDemoServiceProvider,
        ];
    }
}

//
// And this is how we start it!

const suite = new ConsoleDemoSuite();
suite.run();