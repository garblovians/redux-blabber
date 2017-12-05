"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const index_1 = require("../index");
const masterReducer = (state = {
        fee: 'synced1',
        fi: {
            fo: 'synced2'
        },
        fum: 'local'
    }, action) => state;
const slaveReducer = (state = {
        fee: 'notYetSynced1',
        fo: 'notYetSynced2',
        fum: 'local'
    }, action) => state;
// A quick and dirty communication stream using Rx.Subject
const Subject_1 = require("rxjs/Subject");
const stream1 = new Subject_1.Subject();
const stream2 = new Subject_1.Subject();
// MASTER SETUP
const masterEnhancer = index_1.default({
    // Ingoing actions using the Rx.Observable interface
    receive$: stream1,
    // Outgoing actions using the Rx.Observer interface
    transmit$: stream2,
    // Filter which actions should be distributed (let's through all actions per default)
    predicate: (action) => action.type === 'MY_ACTION',
    // Map out which parts of state should hydrate on full syncs (full state sync is default)
    hydrationMap: { slice1: 'fee', slice2: 'fi.fo' },
    // Note whether this store instance should send or receive full state on hydration (master sends)
    isMaster: true,
    // Create custom ID for the blabberInstance (optional)
    createUUID: () => 'master',
});
const masterStore = redux_1.createStore(masterReducer, masterEnhancer);
// SLAVE SETUP
// Add other middleware 
const slaveEnhancer = index_1.default({
    receive$: stream2,
    transmit$: stream1,
    predicate: (action) => action.type === 'MY_ACTION',
    hydrationMap: { slice1: 'fee', slice2: 'fo' },
    isMaster: false,
});
const slaveStore = redux_1.createStore(slaveReducer, slaveEnhancer);
// Initial full state sync
slaveStore.dispatch(index_1.hydrate());
// Action sync
masterStore.dispatch({ type: 'MY_ACTION' });
slaveStore.dispatch({ type: 'MY_ACTION' });
// 'MY_ACTION' is triggered two times on both stores
describe('README example', () => {
    it('should work', () => {
        expect(masterStore.getState().fee).toEqual(slaveStore.getState().fee);
        expect(masterStore.getState().fi.fo).toEqual(slaveStore.getState().fo);
    });
});
