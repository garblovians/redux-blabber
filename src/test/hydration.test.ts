import {
  hydrationActionTypes,
  hydrationReply,
  hydratable,
} from '../hydration';

import createMockReducer, {
  initialMockState
} from './mockReducer';

let actionsReceived = new Array()
let statesReceived = new Array()

const mockReducer = createMockReducer(
  (a)=>{actionsReceived.push(a)}, 
  (s)=>{statesReceived.push(s)}
)

/*********************************************************
 * hydrationReply
 *********************************************************/

describe('hydrationReply', () => {

  const state = {
    a: 'a value',
    b: {
      c: 'c me'
    }
  }

  it('should assign empty payload for no entries in hydration map', () => {

    const hydrationMap = {}

    const expectedAction = {
      type: hydrationActionTypes.HYDRATION_REPLY,
      payload: {}
    }

    const action = hydrationReply(state, hydrationMap)

    expect(action).toEqual(expectedAction)
  })

  it('should assign propper payload for single entry in hydration map', () => {

    const hydrationMap = {
      SINGLE_OBJECT: 'b.c'
    }

    const expectedAction = {
      type: hydrationActionTypes.HYDRATION_REPLY,
      payload: {
        SINGLE_OBJECT: 'c me'
      }
    }

    const action = hydrationReply(state, hydrationMap)

    expect(action).toEqual(expectedAction)
  })

  it('should assign propper payload for multiple entries in hydration map', () => {

    const hydrationMap = {
      FIRST: 'a',
      SECOND: 'b.c',
    }

    const expectedAction = {
      type: hydrationActionTypes.HYDRATION_REPLY,
      payload: {
        FIRST: 'a value',
        SECOND: 'c me'
      }
    }

    const action = hydrationReply(state, hydrationMap)

    expect(action).toEqual(expectedAction)

  })

  it('should assign full state payload for hydration map entry that is empty', () => {

    const hydrationMap = {
      FULL: '',
    }

    const expectedAction = {
      type: hydrationActionTypes.HYDRATION_REPLY,
      payload: {
        FULL: state,
      }
    }

    const action = hydrationReply(state, hydrationMap)

    expect(action).toEqual(expectedAction)

  })

  it('should assign full state payload for no hydration map given', () => {

    const expectedAction = {
      type: hydrationActionTypes.HYDRATION_REPLY,
      payload: {
        FULL_STATE: state,
      }
    }

    const action = hydrationReply(state)

    expect(action).toEqual(expectedAction)

  })

})

/*********************************************************
 * hydratable
 *********************************************************/

describe('hydratable', () => {

  it(`should not act on action other than '${hydrationActionTypes.HYDRATION_REPLY}-action'`, () => {

    const reducer = hydratable(
      (state = 1, action) => state + 1
    )

    expect(reducer(1, { type: 'foo' })).toEqual(2)
  })

  it(`should handle '${hydrationActionTypes.HYDRATION_REPLY}'-action for empty hydrationMap by returing untouched state`, () => {

    const hydrationMap = {}

    const reducer = hydratable(
      (state = 1, action) => state + 1,
      hydrationMap
    )

    const stateHydratee = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 1 },
      c: 1,
    }
    const stateHydrator = {
      substate: { someHydrationState: { a: 2 }, },
      anotherHydrationState: { b: 2 },
      c: 2,
    }
    const stateHydrated = stateHydratee

    const action = hydrationReply(stateHydrator, hydrationMap)

    expect(reducer(stateHydratee, action)).toEqual(stateHydrated)
  })

  it(`should handle '${hydrationActionTypes.HYDRATION_REPLY}'-action by returing state with field updated accoring to hydrationMap (single entry)`, () => {

    const hydrationMap = {
      TEST: 'anotherHydrationState.b'
    }

    const reducer = hydratable(
      (state = 1, action) => state + 1,
      hydrationMap
    )

    const stateHydratee = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 1 },
      c: 1,
    }
    const stateHydrator = {
      substate: { someHydrationState: { a: 2 }, },
      anotherHydrationState: { b: 2 },
      c: 2,
    }
    const stateHydrated = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 2 }, //<--
      c: 1,
    }

    const action = hydrationReply(stateHydrator, hydrationMap)

    expect(reducer(stateHydratee, action)).toEqual(stateHydrated)
  })

  it(`should handle '${hydrationActionTypes.HYDRATION_REPLY}'-action by returing state with field updated accoring to hydrationMap (multipe entries)`, () => {

    const hydrationMap = {
      FIRST: 'anotherHydrationState.b',
      SECOND: 'c'
    }

    const reducer = hydratable(
      (state = 1, action) => state + 1,
      hydrationMap
    )

    const stateHydratee = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 1 },
      c: 1,
    }
    const stateHydrator = {
      substate: { someHydrationState: { a: 2 }, },
      anotherHydrationState: { b: 2 },
      c: 2,
    }
    const stateHydrated = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 2 }, //<--
      c: 2, //<--
    }

    const action = hydrationReply(stateHydrator, hydrationMap)

    expect(reducer(stateHydratee, action)).toEqual(stateHydrated)
  })

  it(`should handle '${hydrationActionTypes.HYDRATION_REPLY}'-action by returing state with field updated accoring to hydrationMap (full state)`, () => {

    const hydrationMap = {
      FULL: '',
    }

    const reducer = hydratable(
      (state = 1, action) => state + 1,
      hydrationMap
    )

    const stateHydratee = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 1 },
      c: 1,
    }
    const stateHydrator = {
      substate: { someHydrationState: { a: 2 }, },
      anotherHydrationState: { b: 2 },
      c: 2,
    }
    const stateHydrated = stateHydrator

    const action = hydrationReply(stateHydrator, hydrationMap)

    expect(reducer(stateHydratee, action)).toEqual(stateHydrated)
  })

  it(`should handle '${hydrationActionTypes.HYDRATION_REPLY}'-action for default hydrationMap by syncing full state`, () => {

    const reducer = hydratable(
      (state = 1, action) => state + 1,
    )

    const stateHydratee = {
      substate: { someHydrationState: { a: 1 }, },
      anotherHydrationState: { b: 1 },
      c: 1,
    }
    const stateHydrator = {
      substate: { someHydrationState: { a: 2 }, },
      anotherHydrationState: { b: 2 },
      c: 2,
    }
    const stateHydrated = stateHydrator

    const action = hydrationReply(stateHydrator)

    expect(reducer(stateHydratee, action)).toEqual(stateHydrated)
  })

})