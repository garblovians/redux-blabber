import { createStore } from 'redux';
import blabberEnhancer, { hydrate } from '../index';

const masterReducer = (state = {
  fee: 'synced1',
  fi: {
    fo: 'synced2'
  },
  fum: 'local'
}, action) => state

const slaveReducer = (state = {
  fee: 'notYetSynced1',
  fo: 'notYetSynced2',
  fum: 'local'
}, action) => state

// A quick and dirty communication stream using Rx.Subject
import { Subject } from 'rxjs/Subject';
const stream1 = new Subject()
const stream2 = new Subject()

// MASTER SETUP

const masterEnhancer = blabberEnhancer({
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
})

const masterStore = createStore(masterReducer, masterEnhancer)

// SLAVE SETUP

// Add other middleware 
const slaveEnhancer = blabberEnhancer({
  receive$: stream2, //inverted order of streams
  transmit$: stream1,      
  predicate: (action) => action.type === 'MY_ACTION',
  hydrationMap: { slice1: 'fee', slice2: 'fo' }, 
  isMaster: false,        
})

const slaveStore = createStore(slaveReducer, slaveEnhancer)

// Initial full state sync
slaveStore.dispatch(hydrate())

// Action sync
masterStore.dispatch({type: 'MY_ACTION'})
slaveStore.dispatch({type: 'MY_ACTION'})
// 'MY_ACTION' is triggered two times on both stores

describe('README example', () => {

  it('should work', () => {

    expect((masterStore.getState() as any).fee)  .toEqual((slaveStore.getState() as any).fee)
    expect((masterStore.getState() as any).fi.fo).toEqual((slaveStore.getState() as any).fo)
    
  })

})