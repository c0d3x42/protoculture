#!/usr/bin/env ts-node
import * as _ from "lodash";
import "../../src/Shims";
import {
    reduxSymbols,
    ServiceProvider,
    StaticServiceProvider,
    ConsoleServiceProvider,
    BaseApp,
    Bundle,
    App,
    LogLevel,
    BusReducer,
    busReducer,
} from "../../src";
import { Store, Action } from "redux";


// Reducers can be declared as classes and annotated in!
@busReducer()
class TestReducer implements BusReducer<any> {

    public action = "test";

    public reducer(state: any, action: Action) {

        if (_.isEmpty(state)) {

            return {
                counter: 1,
            };
        }

        return {
            counter: ++state.counter,
        };
    }
}

// tslint:disable:max-classes-per-file
//
// This is how we declare a service provider.
class ConsoleDemoServiceProvider extends ServiceProvider {

    public async boot(): Promise<void> {

        this.bindApp(BoringConsoleDemoApp);
        this.bindApp(AsynchronousConsoleDemoApp);
        this.bindApp(ReduxConsoleDemoApp);
        this.bindConstructorParameter(reduxSymbols.Store, ReduxConsoleDemoApp, 0);
        this.bindConstructorParameter(reduxSymbols.Store, AsynchronousConsoleDemoApp, 0);

        // This is a non-class style reducer.  This works too!
        this.bundle.container.bind(reduxSymbols.BusReducer)
            .toConstantValue({
                action: "done",
                reducer: (state: any, action: Action) => {

                    return { ...state, done: true };
                }
            });
    }
}

//
// Here's a boring console demo app.
class BoringConsoleDemoApp extends BaseApp {

    public name = "boring-app";

    public async run(): Promise<void> {

        this.log("This is from the boring console demo app!");
    }
}

//
// Here's another app that is asynchronous. But still boring.
class AsynchronousConsoleDemoApp implements App {

    public name = "async-app";

    public bundle: Bundle;

    protected _working: boolean;

    protected timeout = 20;

    public constructor(protected store: Store<any>) {

    }

    public get working(): boolean {

        return this._working;
    }

    public async run(): Promise<void> {

        this._working = true;

        let resolveDeferred: any;
        const deferred = new Promise((resolve) => resolveDeferred = resolve);

        const timeout = setTimeout(
            () => {
                this.bundle.logger.log(`${this.timeout} second timeout elapsed!`, this);
                resolveDeferred();
            },
            this.timeout * 1000
        );

        this.bundle.logger.log(`${this.timeout} second timeout started.`, this);

        await deferred;

        this.store.dispatch({
            type: "done",
        });

        const count = this.store.getState().counter;

        this.bundle.logger.log(`The Redux app triggered: ${count} times!`, this);

        this._working = false;
    }
}

//
// This app triggers Redux actions every 200ms!
class ReduxConsoleDemoApp implements App {

    public name = "redux-app";

    public working = true;

    public bundle: Bundle;

    protected interval: NodeJS.Timer;

    public constructor(protected store: Store<any>) {

    }

    public async run(): Promise<void> {

        this.interval = setInterval(() => this.tick(), 200);
    }

    protected tick() {

        if (_.get(this.store.getState(), "done")) {

            clearInterval(this.interval);

            this.bundle.logger.log("All done!", this);

            this.working = false;
        }
        else {

            this.store.dispatch({
                type: "test"
            });
        }
    }
}

//
// Here's a bundle that acts as the composition root for the ServiceProvider.
class ConsoleDemoBundle extends Bundle {

    public name = "boring-demo";

    protected get serviceProviders(): StaticServiceProvider<any>[] {

        return [
            ConsoleServiceProvider,
            ConsoleDemoServiceProvider,
        ];
    }
}

//
// And this is how we start it!

const bundle = new ConsoleDemoBundle();
bundle.run().catch(console.error);
