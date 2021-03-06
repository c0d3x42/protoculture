import {Bundle} from "../Bundle";
import {LogLevel} from "../Log/LogLevel";


export interface StaticApp<AppType extends App> {

    new(...args: any[]): AppType;
}

export interface App {

    readonly name: string;

    readonly working?: boolean;

    // ToDo: Shift over to property/setter injection - https://github.com/inversify/InversifyJS/issues/531
    bundle: Bundle;

    run(): Promise<void>;
}

// Provided as a reference.  If you don't mind calling `super()`, feel free to use it!
export abstract class BaseApp implements App {

    private _bundle: Bundle;

    public abstract get name(): string;

    // ToDo: Shift over to property/setter injection - https://github.com/inversify/InversifyJS/issues/531
    public set bundle(bundle: Bundle) {

        this._bundle = bundle;
    }

    // ToDo: Once property/setter injection is done, make this protected.
    public get bundle(): Bundle {

        return this._bundle;
    }

    public get working(): boolean {

        return false;
    }

    public async run() {

        throw new Error("Run not implemented!");
    }

    protected log(message: any, level: LogLevel = LogLevel.Info) {

        this.bundle.logger.log(message, this, level);
    }
}
