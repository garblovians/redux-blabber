import { createStore } from 'redux';

import createMockReducer, {
  initialMockState
} from './mockReducer';

let actionsReceived = new Array()
let statesReceived= new Array()

describe('MockReducer', () => {

  let mockStore = createStore(
    createMockReducer(
      (a)=>{actionsReceived.push(a)}, 
      (s)=>{statesReceived.push(s)}
    )
  )

  beforeEach(() => {
    actionsReceived = new Array()
    statesReceived = new Array()
    mockStore.dispatch({ type: 'RESET' })
  })

  it('should push actions and states on to test-arrays', () => {

    const expectedActions = [
      { type: 'RESET' },
      { type: 'A' },
      { type: 'FOO' },
      { type: 'B' },
    ]

    const expectedStates = [
      initialMockState,
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
    ]

    mockStore.dispatch({ type: 'A' })
    mockStore.dispatch({ type: 'FOO' })
    mockStore.dispatch({ type: 'B' })

    expect(actionsReceived).toEqual(expectedActions)
    expect(statesReceived).toEqual(expectedStates)
  })

})
