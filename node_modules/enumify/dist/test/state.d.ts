import { Enumify } from '../src';
export declare class State extends Enumify {
    static start: State;
    static one: State;
    static two: State;
    static three: State;
    static _: void;
    done: boolean;
    accept(x: string): State;
    constructor(props: {
        [k: string]: any;
    });
}
