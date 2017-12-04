"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forEach = require("lodash/forEach");
const mapValues = require("lodash/mapValues");
const isEmpty = require("lodash/isEmpty");
const at = require("lodash/at");
const set = require("lodash/fp/set");
/*********************************************************
 * Actions
 *********************************************************/
const prefix = '@@' + require('./package.json').name + '/';
exports.hydrationActionTypes = {
    HYDRATION_REQ: prefix + 'HYDRATION_REQ',
    HYDRATION_REPLY: prefix + 'HYDRATION_REPLY',
};
/*********************************************************
 * Action Creator
 *********************************************************/
function hydrationRequest() {
    return { type: exports.hydrationActionTypes.HYDRATION_REQ };
}
exports.hydrationRequest = hydrationRequest;
function hydrationReply(state, hydrationMap = { FULL_STATE: '' }) {
    return {
        type: exports.hydrationActionTypes.HYDRATION_REPLY,
        payload: mapValues(hydrationMap, (path) => isEmpty(path) ? state : at(state, path)[0])
    };
}
exports.hydrationReply = hydrationReply;
/*********************************************************
 * Reducer Enhancer
 *********************************************************/
function hydratable(reducer, hydrationMap = { FULL_STATE: '' }) {
    return (state, action) => {
        if (action.type === exports.hydrationActionTypes.HYDRATION_REPLY) {
            let path, retState = state;
            forEach(action.payload, (val, key) => {
                if (key in hydrationMap) {
                    path = hydrationMap[key];
                    retState = isEmpty(path) ? val : set(path, val)(retState);
                }
            });
            return retState;
        }
        return reducer(state, action);
    };
}
exports.hydratable = hydratable;
