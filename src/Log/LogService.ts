import {App} from "../App";
import {Suite} from "../Suite";
import {LogLevel} from "./LogLevel";
import {Environment, Platform} from "../Suite";


export class LogService {

    public constructor(
        protected suite: Suite,
        protected environment: Environment,
        protected platform: Platform
    ) {

    }

    public log(message: any, app: App = null, level: LogLevel = LogLevel.Info) {

        if(this.environment.logLevel >= level || this.environment.debug) {

            this.platform.log(this.buildLogMessage(message, level, app), level);
        }
    }

    protected buildLogMessage(message: any, level: LogLevel, app: App = null): string {

        const logLineParts = [
            `protoculture@${this.platform.name}:${this.suite.name}`
        ];

        if(app) {

            logLineParts.push(`/${app.name}`);
        }

        logLineParts.push("#");
        logLineParts.push(message);

        return logLineParts.join();
    }
}