import {fork} from 'redux-saga/effects'

import errorsSaga from './errorsSaga';
import web3Saga from './web3Saga';
import balanceSaga from './balanceSaga';
import betSaga from './betSaga';

export const runSagas = (sagaMiddleware) => {
  function* rootSaga() {
    yield fork(web3Saga);
    yield fork(balanceSaga);
    yield fork(betSaga);
    yield fork(errorsSaga);
  }

  sagaMiddleware.run(rootSaga);
};