import { AnyAction, StoreEnhancer } from 'redux';
import { Observer, Observable } from 'rxjs';
import { HydrationMap } from './hydration';
/*********************************************************
 * Synchronizer
 *********************************************************/
export interface SyncAction extends AnyAction {
    origin: string;
}
export interface SyncEnhancerParams {
    receive$: Observable<{}>;
    transmit$: Observer<{}>;
    predicate?: (a: AnyAction) => boolean;
    hydrationMap?: HydrationMap;
    hydrateOn?: AnyAction;
    isMaster?: boolean;
    createUUID?: (p?) => string;
}
export default function syncEnhancer<S>({receive$, transmit$, predicate, hydrationMap, hydrateOn, isMaster, createUUID}: SyncEnhancerParams): StoreEnhancer<S>;
