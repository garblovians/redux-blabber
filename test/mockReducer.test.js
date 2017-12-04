"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const mockReducer_1 = require("./mockReducer");
let actionsReceived = new Array();
let statesReceived = new Array();
describe('MockReducer', () => {
    let mockStore = redux_1.createStore(mockReducer_1.default((a) => { actionsReceived.push(a); }, (s) => { statesReceived.push(s); }));
    beforeEach(() => {
        actionsReceived = new Array();
        statesReceived = new Array();
        mockStore.dispatch({ type: 'RESET' });
    });
    it('should push actions and states on to test-arrays', () => {
        const expectedActions = [
            { type: 'RESET' },
            { type: 'A' },
            { type: 'FOO' },
            { type: 'B' },
        ];
        const expectedStates = [
            mockReducer_1.initialMockState,
            // a incremented
            {
                substate: { someHydrationState: { a: 1 }, },
                anotherHydrationState: { b: 0 },
                c: 0,
            },
            // same as before
            {
                substate: { someHydrationState: { a: 1 }, },
                anotherHydrationState: { b: 0 },
                c: 0,
            },
            // b incremented
            {
                substate: { someHydrationState: { a: 1 }, },
                anotherHydrationState: { b: 1 },
                c: 0,
            },
        ];
        mockStore.dispatch({ type: 'A' });
        mockStore.dispatch({ type: 'FOO' });
        mockStore.dispatch({ type: 'B' });
        expect(actionsReceived).toEqual(expectedActions);
        expect(statesReceived).toEqual(expectedStates);
    });
});
