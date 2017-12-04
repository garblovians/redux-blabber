"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialMockState = {
    substate: { someHydrationState: { a: 0 }, },
    anotherHydrationState: { b: 0 },
    c: 0,
};
function createMockReducer(onAction = (a) => { }, onState = (s) => { }) {
    return (state = exports.initialMockState, action) => {
        let ret = state;
        switch (action.type) {
            case 'A': {
                ret = Object.assign({}, state, { substate: {
                        someHydrationState: {
                            a: (state.substate.someHydrationState.a + 1)
                        }
                    } });
                break;
            }
            case 'B': {
                ret = Object.assign({}, state, { anotherHydrationState: {
                        b: (state.anotherHydrationState.b + 1)
                    } });
                break;
            }
            case 'C': {
                ret = Object.assign({}, state, { c: (state.c + 1) });
                break;
            }
            case 'RESET': {
                ret = exports.initialMockState;
                break;
            }
        }
        onAction(action);
        onState(ret);
        return ret;
    };
}
exports.default = createMockReducer;
