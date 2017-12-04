import { Reducer } from 'redux';
export declare const initialMockState: {
    substate: {
        someHydrationState: {
            a: number;
        };
    };
    anotherHydrationState: {
        b: number;
    };
    c: number;
};
export default function createMockReducer(onAction?: (a: any) => void, onState?: (s: any) => void): Reducer<any>;
