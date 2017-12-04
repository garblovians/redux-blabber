"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash/isEmpty");
const includes = require("lodash/includes");
const yeast = require("yeast");
const hydration_1 = require("./hydration");
function syncEnhancer({ receive$, transmit$, predicate = a => true, hydrationMap = { FULL_STATE: '' }, hydrateOn = { type: undefined }, isMaster = false, createUUID = yeast }) {
    return (createStore) => (reducer, preloadedState) => {
        // Each enhancer in use gets it's own uuid
        // Move below statement to above return statement to instead create 
        // uuid per instantiated enhancer (which could be used multiple places)
        const uuid = createUUID();
        const _predicate = (a) => {
            const ret = predicate(a) || includes(hydration_1.hydrationActionTypes, a.type);
            return ret;
        };
        // TRANSMIT
        const transmit = (action) => {
            if (!action.origin) {
                if (_predicate(action)) {
                    action.origin = uuid;
                    transmit$.next(action);
                }
            }
        };
        // STORE
        const store = createStore(isMaster ? reducer : hydration_1.hydratable(reducer, hydrationMap), preloadedState);
        const dispatch = (action) => {
            store.dispatch(action);
            // If we need to extend functionality more, 
            // a middleware approach with chained functionality could used here 
            if (isMaster && action.type === hydration_1.hydrationActionTypes.HYDRATION_REQ) {
                const hydrationReplyAction = hydration_1.hydrationReply(store.getState(), hydrationMap);
                store.dispatch(hydrationReplyAction);
                transmit(hydrationReplyAction);
            }
            else if (action.type === hydrateOn.type) {
                transmit(hydration_1.hydrationRequest());
                console.log("rehydrate!");
            }
            else {
                transmit(action);
            }
        };
        // RECEIVE
        const receive = (action) => {
            if (!isEmpty(action.origin) && action.origin !== uuid) {
                if (_predicate(action)) {
                    dispatch(action);
                }
            }
        };
        const receiveError = (err) => { console.log("syncEnhancer received error: "); console.log(err); };
        const receiveComplete = () => { console.log("syncEnhancer received complete"); };
        receive$.subscribe(receive, receiveError, receiveComplete);
        return Object.assign({}, store, { dispatch });
    };
}
exports.default = syncEnhancer;
