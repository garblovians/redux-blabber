
# redux-blabber

Redux [store enhancer](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer) for synchronizing states and actions across store instances.

Blabber is designed to make stores talk to each other. The idea is to synchronize the full state once and then sync individual actions afterwards

In other words: It makes the redux store blabber on about what is happening.

It uses [Observables](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html) and [Observers](http://reactivex.io/rxjs/class/es6/MiscJSDoc.js~ObserverDoc.html) to communicate and therefore supports synchronization through anything that implements their interfaces.

## Getting Started

### Installing

```
npm install --save redux-blabber
```

## Usage

A single store should be chosen as master. This is the store, that will hydrate other connected stores when the hydrate-action is dispatched. Below is

```js
import { masterReducer, slaveReducer } from './myReducers';
import { createStore }                 from 'redux';
import blabberEnhancer, { hydrate }    from 'redux-blabber';

// A quick and dirty communication stream using Rx.Subject
import { Subject } from 'rxjs/Subject';
const stream1 = new Subject()
const stream2 = new Subject()

// MASTER SETUP

const masterEnhancer = blabberEnhancer({
  // Ingoing actions using the Rx.Observable interface
  receive$:     stream1,     
  // Outgoing actions using the Rx.Observer interface
  transmit$:    stream2,      
  // Filter which actions should be distributed (let's through all actions per default)
  predicate:    (action) => action.type === 'MY_ACTION',
  // Map out which parts of state should hydrate on full syncs (full state sync is default)
  hydrationMap: { slice1: 'fee', slice2: 'fi.fo' }, 
  // Note whether this store instance should send or receive full state on hydration (master sends)
  isMaster:     true,        
  // Create custom ID for the blabberInstance (optional)
  createUUID:   () => 'master',
})

const masterStore = createStore(masterReducer, masterEnhancer)

// SLAVE SETUP

const slaveEnhancer = blabberEnhancer({
  receive$:     stream2, //inverted order of streams
  transmit$:    stream1,      
  predicate:    (action) => action.type === 'MY_ACTION',
  hydrationMap: { slice1: 'fee', slice2: 'fo' }, 
  isMaster:     false,        
})

const slaveStore = createStore(slaveReducer, slaveEnhancer)

// Initial full state sync
slaveStore.dispatch(hydrate())

// Action sync
masterStore.dispatch({type: 'MY_ACTION'})
slaveStore.dispatch({type: 'MY_ACTION'})
// 'MY_ACTION' is triggered two times on both stores

```

### Full state syncs

A single store should be chosen as master, that will hydrate other connected stores with its state on demand. A state synchronization is triggered whenever either a master or slave dispatch the hydrate() action (this should always be done when a new blabbering store is connected)

The above hydrationMap configuration gives the below redux states:
```js
const masterState = {
  fee:  'synced1',
  fi: {
    fo: 'synced2'
  },
  fum:  'local'
}

const slaveState = {
  fee: 'synced1',
  fo:  'synced2',
  fum: 'local'
}
```
Only the fields 'fee' and 'fo' will be syncronized as the hydrate() action is dispatched on the store.
Note that the supplied hydration maps must contain the same keys (otherwise, hydration for the field will be discarded), but that their state paths are flexible as in the 'slice2' example. The path is specified using the lodash [set](https://lodash.com/docs/4.17.4#set) path syntax. An empty string as path will sync the whole store.

### Action syncs

All actions that pass the predicate will be synced. In the example above, only the action of type 'MY_ACTION' is syncronized. If no predicate is supplied, all actions are synchronized

### Interoperability with other middleware

The blabberEnhancer can be used with other middlewares and store enhancers via composition
```js
import { createStore, compose } from 'redux';

const myEnhancer = compose(
  applyMiddleware(thunk, logger),
  myOtherStoreEnhancer,
  blabberEnhancer(blabberOptions),
)

const myStore = createStore(myReducer, myEnhancer)
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
