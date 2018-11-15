import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {routerMiddleware} from 'react-router-redux'
import history from '../history'

import rootReducer from '../reducers';
import {runSagas} from '../sagas/index';

const sagaMiddleware = createSagaMiddleware();
const routingMiddleware = routerMiddleware(history);

let store;

const configureStore = () => {
  if (store) {
    return store;
  }

  let middleware = [sagaMiddleware, routingMiddleware];

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  store = createStore(
    rootReducer, composeEnhancers(
      applyMiddleware(...middleware)
    )
  );
  runSagas(sagaMiddleware);
  return store;

};

export default configureStore;