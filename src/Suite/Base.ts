import * as es6Promise from "es6-promise";
import "isomorphic-fetch";
import "reflect-metadata";
//
import * as _ from "lodash";
import {symbols} from "../";
import {suiteSymbols} from "./";
import {appSymbols, App} from "../App";
import {Container, interfaces} from "inversify";
import ContainerOptions = interfaces.ContainerOptions;
import {ServiceProvider} from "../";
import {Platform} from "../Platform";
import {LogLevel} from "../Log/LogLevel";
import {StaticServiceProvider} from "../ServiceProvider";
import {ProtocultureServiceProvider} from "./ProtocultureServiceProvider";
import {logSymbols, LogServiceProvider, LogService} from "../Log";
import {ReduxServiceProvider} from "../Redux/ReduxServiceProvider";


es6Promise.polyfill();

export abstract class Suite {

    //
    // Configurable by Subclasses

    public abstract get name(): string;

    protected get containerConfiguration(): ContainerOptions { return null; }

    protected get heartbeatInterval(): number { return 5; }

    protected get serviceProviders(): StaticServiceProvider<any>[] {

        return [];
    }

    //
    // Internal

    protected platform: Platform;

    protected _container: Container;

    protected loadedServiceProviders: ServiceProvider[];

    protected apps: App[];

    protected booted: boolean;

    protected log: LogService;

    //
    // External

    public get container(): Container {

        return this._container;
    }

    public get working() {

        return _.filter(this.apps, app => app.working);
    }

    //
    // Initialization Phase

    public constructor() {

        this.loadServiceProviders();
    }

    protected loadServiceProviders() {

        const internalServiceProviders = [
            ProtocultureServiceProvider,
            LogServiceProvider,
            ReduxServiceProvider,
        ];

        const serviceProviders = _.concat(internalServiceProviders, this.serviceProviders);

        this.loadedServiceProviders = _.map(serviceProviders, (serviceProvider: StaticServiceProvider<any>) => new serviceProvider(this));
    }

    //
    // Boot Phase

    public async boot(): Promise<void> {

        this.booted = false;

        this.bootContainer();

        await this.bootServiceProviders();
        await this.bootPlatform();

        this.booted = true;
    }

    protected bootContainer() {

        if(this.containerConfiguration) {

            this._container = new Container(this.containerConfiguration);
        }
        else {

            this._container = new Container();
        }
    }

    protected async bootServiceProviders() {

        const bootPromises = _.map(this.loadedServiceProviders, (serviceProvider: ServiceProvider) => serviceProvider.boot());

        await Promise.all(bootPromises);
    }

    protected async bootPlatform() {

        const currentPlatform = _.find(
            this.container.getAll<Platform>(symbols.AvailablePlatform),
            (platform: Platform) => platform.current
        );

        if(!currentPlatform) {

            throw new Error("Unable to determine current platform.");
        }

        this.container.bind<Platform>(symbols.CurrentPlatform)
            .toConstantValue(currentPlatform);

        this.platform = this.container.get<Platform>(symbols.CurrentPlatform);

        this.log = this.container.get<LogService>(logSymbols.LogService);
    }

    //
    // Run Phase

    public async run(): Promise<void> {

        if(!this.booted) {

            await this.boot();
        }

        if(!_.isEmpty(this.apps)) {

            this.log.log("Suite already run", null, LogLevel.Error);
        }

        this.log.log("Suite started", null, LogLevel.Debug);
        // ToDo: Redux event.

        this.buildApps();

        await this.runApps();
    }

    protected async runApps() {

        this.log.log("Running apps", null, LogLevel.Debug);

        const appPromises = _.map(this.apps, (app: App) => {

            this.log.log("Starting app", app, LogLevel.Info);

            try {

                return app.run(this);
            }
            catch(error) {

                this.log.log(error.stack, app, LogLevel.Error);
            }
        });

        this.log.log("All apps started", null, LogLevel.Debug);

        if(!_.isEmpty(this.working)) {

            this.log.log("An asynchronous app was detected", null, LogLevel.Info);
            this.startHeartbeat();
        }

        await Promise.all(appPromises);

    }

    public async stop(): Promise<void> {

        try {


        }
        catch(error) {

            this.log.log(error.stack, null, LogLevel.Error);
        }

        return null;
    }

    protected buildApps() {

        this.log.log("Building apps", null, LogLevel.Debug);
        this.apps = this.container.getAll<App>(appSymbols.App);
    }

    protected startHeartbeat() {

        this.log.log("Starting heartbeat", null, LogLevel.Debug);
        const heartBeat = setInterval(
            () => {

                this.log.log("Beat...", null, LogLevel.Debug);

                const workingApps = this.working;

                if(_.isEmpty(workingApps)) {

                    this.log.log("...Heart beat.", null, LogLevel.Debug);

                    clearInterval(heartBeat);
                    this.stop();
                }
                else {

                    _.forEach(workingApps, (app: App) => this.log.log("Still working", app, LogLevel.Debug));
                }
            },
            this.heartbeatInterval * 1000
        );
    }

    //
    // Utils

    public async bootChild(): Promise<Container> {

        const childContainer = this.container.createChild();

        const bootPromises = _.map(this.loadedServiceProviders, (serviceProvider: ServiceProvider) => serviceProvider.bootChild(childContainer));
        await Promise.all(bootPromises);

        return childContainer;
    }
}
