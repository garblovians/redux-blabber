"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockReducer_1 = require("./mockReducer");
const redux_1 = require("redux");
const hydration_1 = require("../hydration");
const redux_thunk_1 = require("redux-thunk");
const redux_logger_1 = require("redux-logger");
const Subject_1 = require("rxjs/Subject");
const includes = require("lodash/includes");
const syncEnhancer_1 = require("../syncEnhancer");
/*********************************************************
 * Common preperation
 *********************************************************/
// CHANNEL
let transmitsReceived = new Array();
const subject = new Subject_1.Subject();
subject.subscribe((msg) => transmitsReceived.push(msg), (err) => transmitsReceived.push(err), () => { });
// LOGGER
let customLogger = (function () {
    let logs = new Array();
    return {
        log: (type, format, body) => {
            if (includes(type, 'action') && !!body) {
                logs.push(body);
            }
        },
        clear: () => { logs = []; },
        getLogs: () => logs
    };
})();
const logger = redux_logger_1.createLogger({
    logger: customLogger,
    timestamp: false,
});
// FILTERS
const actionFilter = (a) => (includes([
    'A',
    'B',
    'C',
    'RESET',
    'THUNK',
], a.type));
const hydrationMap = {
    someHydrationState: 'substate.someHydrationState',
    anotherHydrationState: 'anotherHydrationState'
};
// MASTER
let masterActionsReceived = new Array();
let masterStatesReceived = new Array();
const masterMockReducer = mockReducer_1.default((a) => { masterActionsReceived.push(a); }, (s) => { masterStatesReceived.push(s); });
const masterEnhancer = redux_1.compose(redux_1.applyMiddleware(redux_thunk_1.default, logger), syncEnhancer_1.default({
    receive$: subject,
    transmit$: subject,
    predicate: actionFilter,
    hydrationMap: hydrationMap,
    isMaster: true,
    createUUID: () => 'syncUUID1',
}));
let masterStore = redux_1.createStore(masterMockReducer, masterEnhancer);
// SLAVE
let slaveActionsReceived = new Array();
let slaveStatesReceived = new Array();
const slaveMockReducer = mockReducer_1.default((a) => { slaveActionsReceived.push(a); }, (s) => { slaveStatesReceived.push(s); });
const slaveEnhancer = syncEnhancer_1.default({
    receive$: subject,
    transmit$: subject,
    predicate: actionFilter,
    hydrationMap: hydrationMap,
    isMaster: false,
    createUUID: () => 'syncUUID2',
});
const slaveStore = redux_1.createStore(slaveMockReducer, slaveEnhancer);
/*********************************************************
 * Test
 *********************************************************/
describe('syncEnhancer', () => {
    beforeEach(() => {
        masterStore.dispatch({ type: 'RESET' });
        slaveStore.dispatch({ type: 'RESET' });
        masterActionsReceived = [];
        slaveActionsReceived = [];
        masterStatesReceived = [];
        slaveStatesReceived = [];
        customLogger.clear();
        transmitsReceived = [];
    });
    it('should enhance only filtered actions with an origin key', () => {
        const expectedActions = [
            { type: 'A', origin: 'syncUUID1' },
            { type: 'FOO' },
            { type: 'B', origin: 'syncUUID1' },
        ];
        const expectedTransmits = expectedActions;
        masterStore.dispatch({ type: 'A' });
        masterStore.dispatch({ type: 'FOO' }); //<- doesn't pass filter
        masterStore.dispatch({ type: 'B' });
        expect(masterActionsReceived).toEqual(expectedActions);
    });
    it('should emit only actions that pass the actionFilter on to transmissionSubject', () => {
        const expectedActions = [
            { type: 'A', origin: 'syncUUID1' },
            { type: 'B', origin: 'syncUUID1' },
        ];
        const expectedTransmits = expectedActions;
        masterStore.dispatch({ type: 'A' });
        masterStore.dispatch({ type: 'FOO' }); //<- doesn't pass filter
        masterStore.dispatch({ type: 'B' });
        expect(transmitsReceived).toEqual(expectedTransmits);
    });
    it('should receive and dispatch only actions that have foreign origin and pass the actionFilter', () => {
        subject.next({ type: 'A', origin: '' }); // empty origin
        subject.next({ type: 'A' }); // no origin
        subject.next({ type: 'FOO', origin: 'syncUUID2' }); // doesn't pass actionFilter
        subject.next({ type: 'A', origin: 'syncUUID1' }); // own uuid
        subject.next({ type: 'A', origin: 'syncUUID2' });
        subject.next({ type: 'B', origin: 'syncUUID2' });
        const expectedActions = [
            { type: 'A', origin: 'syncUUID2' },
            { type: 'B', origin: 'syncUUID2' },
        ];
        expect(masterActionsReceived).toEqual(expectedActions);
    });
    it('should work with other middleware', (done) => {
        const expectedActions = [
            { type: 'THUNK', origin: 'syncUUID1' }
        ];
        const expectedTransmits = expectedActions;
        const expectedLogs = expectedActions;
        function thunkAction() {
            return (dispatch, getState) => {
                dispatch({ type: 'THUNK' });
                return Promise.resolve();
            };
        }
        masterStore.dispatch(thunkAction()).then(() => {
            expect(masterActionsReceived).toEqual(expectedActions);
            expect(transmitsReceived).toEqual(expectedTransmits);
            expect(customLogger.getLogs()).toEqual(expectedLogs);
            done();
        });
    });
    it('should sync actions between multiple instances', () => {
        slaveStore.dispatch({ type: 'A' });
        masterStore.dispatch({ type: 'B' });
        slaveStore.dispatch({ type: 'C' });
        const expectedActions = [
            { type: 'A', origin: 'syncUUID2' },
            { type: 'B', origin: 'syncUUID1' },
            { type: 'C', origin: 'syncUUID2' },
        ];
        expect(slaveActionsReceived).toEqual(expectedActions);
        expect(masterActionsReceived).toEqual(expectedActions);
        expect(transmitsReceived).toEqual(expectedActions);
    });
    it('should hydrate only states mapped', () => {
        // Setup
        // A bit of hacking: it will not sync if the action's origin is self
        slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' });
        slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' });
        slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' });
        slaveStore.dispatch({ type: 'B', origin: 'syncUUID2' });
        slaveStore.dispatch({ type: 'B', origin: 'syncUUID2' });
        slaveStore.dispatch({ type: 'C', origin: 'syncUUID2' });
        expect(slaveStore.getState()).toEqual({
            substate: { someHydrationState: { a: 3 }, },
            anotherHydrationState: { b: 2 },
            c: 1,
        });
        expect(masterStore.getState()).toEqual(mockReducer_1.initialMockState);
        // So, we're out of sync now, let's hydrate!
        const hydrationRequestAction = hydration_1.hydrationRequest();
        slaveStore.dispatch(hydrationRequestAction);
        const expectedTransmits = [
            Object.assign({}, hydrationRequestAction, { origin: 'syncUUID2' }),
            Object.assign({}, hydration_1.hydrationReply(masterStore.getState(), hydrationMap), { origin: 'syncUUID1' })
        ];
        expect(transmitsReceived).toEqual(expectedTransmits);
        expect(masterActionsReceived).toEqual(expectedTransmits);
        expect(slaveStore.getState()).toEqual({
            substate: { someHydrationState: { a: 0 }, },
            anotherHydrationState: { b: 0 },
            c: 1,
        });
        expect(masterStore.getState()).toEqual(mockReducer_1.initialMockState);
    });
});
