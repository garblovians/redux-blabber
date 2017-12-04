import { 
  Action,
  Reducer,
} from 'redux';

import forEach = require('lodash/forEach');
import mapValues = require('lodash/mapValues');
import isEmpty = require('lodash/isEmpty');
import at = require('lodash/at');
import set = require('lodash/fp/set');

/*********************************************************
 * Actions
 *********************************************************/

const prefix = '@@' + require('./package.json').name + '/'

export const hydrationActionTypes = {
  HYDRATION_REQ:    prefix + 'HYDRATION_REQ',
  HYDRATION_REPLY:  prefix + 'HYDRATION_REPLY',
}

export interface HydrationRequestAction extends Action { }
export interface HydrationReplyAction extends Action { 
  payload: {
    [key: string]: any
  }
}

export interface HydrationMap {
  [key: string]: string //path to object
}


/*********************************************************
 * Action Creator
 *********************************************************/

export function hydrationRequest() {
  return { type: hydrationActionTypes.HYDRATION_REQ }
}

export function hydrationReply(state: any, hydrationMap: HydrationMap = { FULL_STATE: '' }): HydrationReplyAction {
  return {
    type: hydrationActionTypes.HYDRATION_REPLY,
    payload: mapValues(hydrationMap,
      (path) => isEmpty(path) ? state : at(state, path)[0]
    )
  }
}

/*********************************************************
 * Reducer Enhancer
 *********************************************************/

export function hydratable(reducer: Reducer<any>, hydrationMap: HydrationMap = { FULL_STATE: '' }, ): Reducer<any> {
  return (state, action) => {
    if (action.type === hydrationActionTypes.HYDRATION_REPLY) {
      let path, retState = state
      forEach((action as HydrationReplyAction).payload, (val, key) => {
        if (key in hydrationMap) {
          path = hydrationMap[key]
          retState = isEmpty(path) ? val : set(path, val)(retState)
        }
      })
      return retState
    } 
    return reducer(state, action)
  }
}

