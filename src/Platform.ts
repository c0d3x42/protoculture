import {LogLevel} from "./Log/LogLevel";
import {BaseEnvironment} from "./";


export interface StaticPlatform<PlatformType extends Platform> {

    new(): PlatformType;
}

export interface Platform {

    current: boolean;

    environment: BaseEnvironment;

    name: string;

    log(message: string, level: LogLevel): void;
}
