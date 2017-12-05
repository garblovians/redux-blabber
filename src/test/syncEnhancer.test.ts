import configureMockStore from 'redux-mock-store';
import createMockReducer, {
  initialMockState
} from './mockReducer';

import {
  compose,
  createStore,
  combineReducers,
  applyMiddleware,
  Reducer,
  AnyAction
} from 'redux';

import {
  hydrationRequest,
  hydrationReply
} from '../hydration';

import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

import { Subject } from 'rxjs/Subject';
import includes = require('lodash/includes');

import syncEnhancer from '../syncEnhancer';


/*********************************************************
 * Common preperation
 *********************************************************/


// CHANNEL

let transmitsReceived = new Array()

const subject = new Subject()
subject.subscribe((msg) => transmitsReceived.push(msg), (err) => transmitsReceived.push(err), () => { }); 

// LOGGER

let customLogger = (function () {
  let logs = new Array()
  return {
    log: (type: string, format?, body?) => { 
      if (includes(type, 'action') && !!body) {
        logs.push(body)
      }
    },
    clear: () => { logs = [] },
    getLogs: () => logs
  }
})()

const logger = createLogger({
  logger: customLogger,
  timestamp: false,
})

// FILTERS

const actionFilter = (a: AnyAction) => (
  includes(
    [
      'A',
      'B',
      'C',
      'RESET',
      'THUNK',
    ],
    a.type
  )
)

const hydrationMap = {
  someHydrationState: 'substate.someHydrationState',
  anotherHydrationState: 'anotherHydrationState'
}

// MASTER

let masterActionsReceived = new Array()
let masterStatesReceived = new Array()

const masterMockReducer = createMockReducer(
  (a) => { masterActionsReceived.push(a) },
  (s) => { masterStatesReceived.push(s) }
)

const masterEnhancer = compose(
  applyMiddleware(thunk, logger),
  syncEnhancer({
    receive$: subject,
    transmit$: subject,
    predicate: actionFilter,
    hydrationMap: hydrationMap,
    isMaster: true,
    createUUID: () => 'syncUUID1',
  }),
)

let masterStore = createStore(masterMockReducer, masterEnhancer)

// SLAVE

let slaveActionsReceived = new Array()
let slaveStatesReceived = new Array()

const slaveMockReducer = createMockReducer(
  (a) => { slaveActionsReceived.push(a) },
  (s) => { slaveStatesReceived.push(s) }
)

const slaveEnhancer = syncEnhancer({
  receive$: subject,
  transmit$: subject,
  predicate: actionFilter,
  hydrationMap: hydrationMap,
  isMaster: false,
  createUUID: () => 'syncUUID2',
})

const slaveStore = createStore(slaveMockReducer, slaveEnhancer)

/*********************************************************
 * Test
 *********************************************************/

describe('syncEnhancer', () => {

  beforeEach(() => {
    masterStore.dispatch({ type: 'RESET' })
    slaveStore.dispatch({ type: 'RESET' })
    masterActionsReceived = []
    slaveActionsReceived = []
    masterStatesReceived = []
    slaveStatesReceived = []
    customLogger.clear()
    transmitsReceived = []
  })

  it('should enhance only filtered actions with an origin key', () => {

    const expectedActions = [
      { type: 'A', origin: 'syncUUID1' },
      { type: 'FOO' },
      { type: 'B', origin: 'syncUUID1' },
    ]

    const expectedTransmits = expectedActions

    masterStore.dispatch({ type: 'A' })
    masterStore.dispatch({ type: 'FOO' }) //<- doesn't pass filter
    masterStore.dispatch({ type: 'B' })

    expect(masterActionsReceived).toEqual(expectedActions)
  })

  it('should emit only actions that pass the actionFilter on to transmissionSubject', () => {

    const expectedActions = [
      { type: 'A', origin: 'syncUUID1' },
      { type: 'B', origin: 'syncUUID1' },
    ]

    const expectedTransmits = expectedActions

    masterStore.dispatch({ type: 'A' })
    masterStore.dispatch({ type: 'FOO' }) //<- doesn't pass filter
    masterStore.dispatch({ type: 'B' })

    expect(transmitsReceived).toEqual(expectedTransmits)
  })

  it('should receive and dispatch only actions that have foreign origin and pass the actionFilter', () => {

    subject.next({ type: 'A', origin: '' })            // empty origin
    subject.next({ type: 'A' })                        // no origin
    subject.next({ type: 'FOO', origin: 'syncUUID2' }) // doesn't pass actionFilter
    subject.next({ type: 'A', origin: 'syncUUID1' })   // own uuid
    subject.next({ type: 'A', origin: 'syncUUID2' })
    subject.next({ type: 'B', origin: 'syncUUID2' })

    const expectedActions = [
      { type: 'A', origin: 'syncUUID2' },
      { type: 'B', origin: 'syncUUID2' },
    ]

    expect(masterActionsReceived).toEqual(expectedActions) 
  })

  it('should work with other middleware', (done) => {

    const expectedActions = [
      { type: 'THUNK', origin: 'syncUUID1' }
    ]
    const expectedTransmits = expectedActions
    const expectedLogs = expectedActions

    function thunkAction() {
      return (dispatch, getState) => {
        dispatch({ type: 'THUNK' })
        return Promise.resolve()
      }
    }

    masterStore.dispatch(thunkAction()).then(() => {
      expect(masterActionsReceived).toEqual(expectedActions)
      expect(transmitsReceived).toEqual(expectedTransmits)
      expect(customLogger.getLogs()).toEqual(expectedLogs)
      done()
    })

  })

  it('should sync actions between multiple instances', () => {

    slaveStore.dispatch({ type: 'A' })
    masterStore.dispatch({ type: 'B' })
    slaveStore.dispatch({ type: 'C' })

    const expectedActions = [
      { type: 'A', origin: 'syncUUID2' },
      { type: 'B', origin: 'syncUUID1' },
      { type: 'C', origin: 'syncUUID2' },
    ]

    expect(slaveActionsReceived).toEqual(expectedActions)
    expect(masterActionsReceived).toEqual(expectedActions)
    expect(transmitsReceived).toEqual(expectedActions)

  })

  it('should hydrate only states mapped', () => {

    // Setup
    // A bit of hacking: it will not sync if the action's origin is self
    slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' })
    slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' })
    slaveStore.dispatch({ type: 'A', origin: 'syncUUID2' })
    slaveStore.dispatch({ type: 'B', origin: 'syncUUID2' })
    slaveStore.dispatch({ type: 'B', origin: 'syncUUID2' })
    slaveStore.dispatch({ type: 'C', origin: 'syncUUID2' })

    expect(slaveStore.getState()).toEqual({
      substate: { someHydrationState: { a: 3 }, },
      anotherHydrationState: { b: 2 },
      c: 1, 
    })

    expect(masterStore.getState()).toEqual(initialMockState)
    
    // So, we're out of sync now, let's hydrate!

    const hydrationRequestAction = hydrationRequest()
    
    slaveStore.dispatch(hydrationRequestAction)

    const expectedTransmits = [
      {
        ...hydrationRequestAction, 
        origin: 'syncUUID2'
      },
      {
        ...hydrationReply(masterStore.getState(), hydrationMap), 
        origin: 'syncUUID1'
      }
    ]

    expect(transmitsReceived).toEqual(expectedTransmits)
    expect(masterActionsReceived).toEqual(expectedTransmits)

    expect(slaveStore.getState()).toEqual({
      substate: { someHydrationState: { a: 0 }, },
      anotherHydrationState: { b: 0 },
      c: 1, //<-- not in hydration map!
    })

    expect(masterStore.getState()).toEqual(initialMockState)

  })

})





