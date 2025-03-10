import { createStore, Action } from 'redux';

const DEFAULT_STATE: any = {
  auth: null,
  balance: 0,
  tokens: [],
};

function counterReducer(state: any = DEFAULT_STATE, action: any): any {
  switch (action.type) {
    case 'update/auth':
      return { ...state, auth: action.payload };
    case 'update/balance':
      return { ...state, balance: action.payload };
    case 'update/tokens':
      return { ...state, tokens: action.payload };
    default:
      return state;
  }
}

let store = createStore(counterReducer);

export default store;
