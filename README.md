# redux-blabber
Redux store enhancer for synchronizing states and actions across store instances

## Usage
```js
import syncEnhancer from 'redux-blabber'
import { Subject }  from 'rxjs';

const receive$  = new Subject()
const transmit$ = new Subject()

const blabberEnhancer = syncEnhancer{
  receive$:     receive$,
  transmit$:    transmit$,
  predicate:    a => includes(a.type, 'SOME_ACTION_PREFIX'),
  hydrationMap: { FULL_STATE: ''},
  isMaster:     true,
  createUUID:   () => 'The Real Slim Shady',
}

const store     = createStore(reducers, blabberEnhancer)
```