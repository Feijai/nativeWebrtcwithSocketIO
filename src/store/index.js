import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import getUserIdReducer from './reducers/user';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import sagas from './sagas';
import getCallReducer from './reducers/call';

const allReducer = combineReducers({
  userId: getUserIdReducer,
  socketState: getCallReducer,
});

// const sagaMiddleware = createSagaMiddleware();

// const enhancers = compose(
//   applyMiddleware(thunk),
//   applyMiddleware(sagaMiddleware),
// );
// export default createStore(allReducer, enhancers);
export default createStore(allReducer, applyMiddleware(thunk));

// sagaMiddleware.run(sagas);
