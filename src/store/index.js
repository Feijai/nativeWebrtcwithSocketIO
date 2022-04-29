import {createStore, applyMiddleware, combineReducers} from 'redux';
import getUserIdReducer from './reducers/user';
import thunk from 'redux-thunk';

const allReducer = combineReducers({
  userId: getUserIdReducer,
});
export default createStore(allReducer, applyMiddleware(thunk));
