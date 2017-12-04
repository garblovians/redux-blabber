import { 
  AnyAction, 
  Dispatch,
  Reducer,
  StoreCreator,
  StoreEnhancer,
} from 'redux';

import forEach = require('lodash/forEach');
import isEmpty = require('lodash/isEmpty');
import includes = require('lodash/includes');
import * as yeast from 'yeast'; 

import { 
  Observer, 
  Observable 
} from 'rxjs';

import {
  HydrationMap,
  hydrationActionTypes,
  hydratable,
  hydrationReply,
  hydrationRequest
} from './hydration';

/*********************************************************
 * Synchronizer
 *********************************************************/

export interface SyncAction extends AnyAction {
  origin: string,
}
export interface SyncEnhancerParams {
  // Ingoing messages subject
  receive$: Observable<{}>,
  // Outgoing messages subject
  transmit$: Observer<{}>,
  // Filter actions that should be distributed
  predicate?: (a: AnyAction) => boolean,
  // Get parts of state that should hydrate (default is whole state)
  hydrationMap?: HydrationMap,
  // Action to request rehydration from master on
  hydrateOn?: AnyAction,
  // Flag whether this store should be hydrator og hydratee on full state sync
  isMaster?: boolean,
  // Custom UUID creator
  createUUID?: (p?)=>string,
}

export default function syncEnhancer<S>(
  {
    receive$,
    transmit$,
    predicate       = a => true,
    hydrationMap    = {FULL_STATE: ''},
    hydrateOn       = {type:undefined},
    isMaster        = false,
    createUUID      = yeast
  }: SyncEnhancerParams
): StoreEnhancer<S> {
  return (createStore: StoreCreator) => (reducer: Reducer<S>, preloadedState: S) => {
    
    // Each enhancer in use gets it's own uuid
    // Move below statement to above return statement to instead create 
    // uuid per instantiated enhancer (which could be used multiple places)
    const uuid = createUUID() 

    const _predicate = (a) => {
      const ret =  predicate(a) || includes(hydrationActionTypes, a.type)
      return ret
    }
    
    // TRANSMIT
    const transmit = (action: AnyAction) => {
      if (!action.origin) { // Action has not been transmitted by anyone yet
        if (_predicate(action)) {
          action.origin = uuid  
          transmit$.next(action)
        }
      }
    }

    // STORE
    const store = createStore(
      isMaster ? reducer : hydratable(reducer, hydrationMap), 
      preloadedState
    )

    const dispatch: Dispatch<any> = (action) => {

      store.dispatch(action)

      // If we need to extend functionality more, 
      // a middleware approach with chained functionality could used here 
      if (isMaster && action.type === hydrationActionTypes.HYDRATION_REQ) {
        const hydrationReplyAction = hydrationReply(store.getState(), hydrationMap)
        store.dispatch(hydrationReplyAction)
        transmit(hydrationReplyAction)
      } else if(action.type === hydrateOn.type){
        transmit(hydrationRequest())
        console.log("rehydrate!");
      } else {
        transmit(action)
      }
    }

    // RECEIVE
    const receive = (action: SyncAction) => {
      if (!isEmpty(action.origin) && action.origin !== uuid) {
        if (_predicate(action)){
          dispatch(action)
        }
      }
    }
    const receiveError = (err) => { console.log("syncEnhancer received error: "); console.log(err) }
    const receiveComplete = () => { console.log("syncEnhancer received complete") }
    
    receive$.subscribe(
      receive,
      receiveError,
      receiveComplete
    )

    return {
      ...store,
      dispatch,
    }
  }
} 





