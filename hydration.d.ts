import { Action, Reducer } from 'redux';
export declare const hydrationActionTypes: {
    HYDRATION_REQ: string;
    HYDRATION_REPLY: string;
};
export interface HydrationRequestAction extends Action {
}
export interface HydrationReplyAction extends Action {
    payload: {
        [key: string]: any;
    };
}
export interface HydrationMap {
    [key: string]: string;
}
/*********************************************************
 * Action Creator
 *********************************************************/
export declare function hydrationRequest(): {
    type: string;
};
export declare function hydrationReply(state: any, hydrationMap?: HydrationMap): HydrationReplyAction;
/*********************************************************
 * Reducer Enhancer
 *********************************************************/
export declare function hydratable(reducer: Reducer<any>, hydrationMap?: HydrationMap): Reducer<any>;
