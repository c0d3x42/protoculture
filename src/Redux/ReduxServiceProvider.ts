import {ServiceProvider} from "../ServiceProvider";
import {reduxSymbols} from "./";
import {Suite} from "../Suite";
import {Container} from "inversify";
import {createStore, Reducer} from "redux";
import {createBusReducer, BusReducer} from "./BusReducer";


export class ReduxServiceProvider<State> extends ServiceProvider {

    public async boot(suite: Suite): Promise<void> {

    }

    public async bootChild(container: Container): Promise<void> {

        // ToDo: Other kinds of reducers can totally be a thing by inspecting a config here and switching!

        container.bind<Redux.Store<State>>(reduxSymbols.Store)
            .toDynamicValue((context) => {

                const busReducers = context.container.getAll<BusReducer>(reduxSymbols.BusReducer);

                return this.createBusReducerStore(busReducers);
            });
    }

    protected createBusReducerStore(busReducers: BusReducer[]): Redux.Store<State> {

        return createStore<State>(createBusReducer<State>(busReducers));
    }
}