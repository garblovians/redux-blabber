import {
  Reducer,
  AnyAction
} from 'redux';

interface MockState {
  substate: {
    someHydrationState: {
      a: number,
    },
  },
  anotherHydrationState: {
    b: number
  },
  c: number,
}

export const initialMockState = {
  substate: { someHydrationState: { a: 0 }, },
  anotherHydrationState: { b: 0 },
  c: 0,
}

export default function createMockReducer(onAction = (a)=>{}, onState = (s)=>{}) : Reducer<any> {
  return (state = initialMockState, action: AnyAction) => {
    
      let ret = state
    
      switch (action.type) {
        case 'A': { //increment a
          ret = {
            ...state,
            substate: {
              someHydrationState: {
                a: (state.substate.someHydrationState.a + 1)
              }
            }
          }
          break;
        }
        case 'B': { //push value at b
          ret = {
            ...state,
            anotherHydrationState: {
              b: (state.anotherHydrationState.b + 1)
            }
          }
          break;
        }
        case 'C': { //increment c
          ret = {
            ...state,
            c: (state.c + 1)
          }
          break;
        }
        case 'RESET': {
          ret = initialMockState
          break;
        }
      }
    
      onAction(action)
      onState(ret)
    
      return ret;
    }
}