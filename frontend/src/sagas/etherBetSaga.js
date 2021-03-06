import {call, put, all, takeEvery, select} from 'redux-saga/effects';

import _ from 'lodash';

import * as etherBetActions from '../actions/etherBetActions';
import * as web3Actions from '../actions/web3Actions';
import * as notificationActions from '../actions/notificationActions';

import etherBetService from '../utils/etherBetService';

function* loadInitialData(data) {
  yield all([
    put(etherBetActions.getActiveBets()),
    put(etherBetActions.getExecutedBets()),
    put(etherBetActions.getPendingBets()),
    put(etherBetActions.getUserActiveBetsCount()),
  ])
}

function* saveNewBet(data) {
  yield put(etherBetActions.postSaveNewBet.request());
  try {
    const web3 = yield select(state => state.web3Store.get("web3"));
    const gasPriceType = yield select(state => state.web3Store.get("gasPriceType"));
    const newBet = yield select(state => state.etherBetStore.get("newBet"));

    yield call(etherBetService.makeBet, web3, gasPriceType, newBet);

    yield put(etherBetActions.postSaveNewBet.success({}));

    yield put(notificationActions.successMessage('bet creation ongoing, you will be notified when it is complete ...'));
  } catch (error) {
    yield put(etherBetActions.postSaveNewBet.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to save bet',
        // handle axios error format if available
        message: _.get(error, 'response.data.message') || error.message,
        position: 'br'
      }
    }));
  }
}

function* notifyBetCreated(data) {
  const web3 = yield select(state => state.web3Store.get("web3"));
  const bet = data.bet;

  // notify if creator
  if (_.get(web3, 'eth.defaultAccount') === bet.user) {
    console.log("betCreated ID:", bet.id);
    yield put(notificationActions.successMessage(`new bet created. ID: ${bet.id}, Amount: ${bet.amount}, Edge: ${bet.edge}`));
  }
}

function* getActiveBets(data) {
  yield put(etherBetActions.fetchGetActiveBets.request());
  try {
    const opts = yield select(state => state.etherBetStore.get("activeBetsLoadOpts"));
    const results = yield call(etherBetService.getActiveBets, opts);

    let loadMore = opts.offset > 0;
    yield put(etherBetActions.fetchGetActiveBets.success({
      activeBets: results.bets,
      activeBetsTotalCount: results.count,
      loadMore: loadMore
    }));
  } catch (error) {
    yield put(etherBetActions.fetchGetActiveBets.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to get active bets',
        message: error.message,
        position: 'br'
      }
    }));
  }
}


function* getUserActiveBetsCount(data) {
  yield put(etherBetActions.fetchGetUserActiveBetsCount.request());
  try {
    const web3 = yield select(state => state.web3Store.get("web3"));
    const count = yield call(etherBetService.getUserActiveBetsCount, web3);

    yield put(etherBetActions.fetchGetUserActiveBetsCount.success({ count }));
  } catch (error) {
    yield put(etherBetActions.fetchGetUserActiveBetsCount.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to get user active bets count',
        message: error.message,
        position: 'br'
      }
    }));
  }
}

function* getExecutedBets(data) {
  yield put(etherBetActions.fetchGetExecutedBets.request());
  try {
    const executedBets = yield call(etherBetService.getExecutedBets);
    yield put(etherBetActions.fetchGetExecutedBets.success({ executedBets }));
  } catch (error) {
    yield put(etherBetActions.fetchGetExecutedBets.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to get executed bets',
        message: error.message,
        position: 'br'
      }
    }));
  }
}

function* getBetInfo(data) {
  yield put(etherBetActions.fetchGetBetInfo.request({ id: data.id }));
  try {
    const bet = yield call(etherBetService.getBetInfo, data.id);
    yield put(etherBetActions.fetchGetBetInfo.success({ bet }));
  } catch (error) {
    yield put(etherBetActions.fetchGetBetInfo.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to get bet info',
        message: error.message,
        position: 'br'
      }
    }));
  }
}

function* getPendingBets(data) {
  yield put(etherBetActions.fetchGetPendingBets.request());
  try {
    const pendingBets = yield call(etherBetService.getPendingBets);
    yield put(etherBetActions.fetchGetPendingBets.success({ pendingBets }));
  } catch (error) {
    yield put(etherBetActions.fetchGetPendingBets.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to get pending bets',
        message: error.message,
        position: 'br'
      }
    }));
  }
}

function* cancelBet(data) {
  yield put(etherBetActions.postCancelBet.request({ betId: data.id }));
  try {
    const web3 = yield select(state => state.web3Store.get("web3"));
    const gasPriceType = yield select(state => state.web3Store.get("gasPriceType"));

    yield call(etherBetService.cancelBet, web3, gasPriceType, data.id);

    yield put(etherBetActions.postCancelBet.success({}));

    yield put(notificationActions.successMessage('bet cancellation ongoing, you will be notified when it is complete ...'));
  } catch (error) {
    yield put(etherBetActions.postCancelBet.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to cancel bet',
        // handle axios error format if available
        message: _.get(error, 'response.data.message') || error.message,
        position: 'br'
      }
    }));
  }
}

function* notifyBetCanceled(data) {
  const web3 = yield select(state => state.web3Store.get("web3"));
  const bet = data.bet;

  // notify if creator
  if (_.get(web3, 'eth.defaultAccount') === bet.user) {
    console.log("betCanceled ID:", bet.id);
    yield put(notificationActions.successMessage(`bet canceled. ID: ${bet.id}`));
  }
}

function* callBet(data) {
  yield put(etherBetActions.postCallBet.request({ betId: data.id }));
  try {
    const web3 = yield select(state => state.web3Store.get("web3"));
    const gasPriceType = yield select(state => state.web3Store.get("gasPriceType"));

    yield call(etherBetService.callBet, web3, gasPriceType, data.id);

    yield put(etherBetActions.postCallBet.success({}));

    yield put(notificationActions.successMessage('bet call ongoing, you will be notified when it is complete ...'));
  } catch (error) {
    yield put(etherBetActions.postCallBet.failure({ error }));
    yield put(notificationActions.error({
      notification: {
        title: 'failed to call bet',
        // handle axios error format if available
        message: _.get(error, 'response.data.message') || error.message,
        position: 'br'
      }
    }));
  }
}

function* notifyBetCalled(data) {
  const web3 = yield select(state => state.web3Store.get("web3"));
  const bet = data.bet;

  // notify if creator
  if (_.get(web3, 'eth.defaultAccount') === bet.callerUser) {
    console.log("betCalled ID:", bet.id);
    yield put(notificationActions.successMessage(`Bet ID: ${bet.id}. The bet was initialized and should be executed in the next few minutes ...`));
  }
}

function* notifyBetExecuted(data) {
  const web3 = yield select(state => state.web3Store.get("web3"));
  const bet = data.bet;

  // notify if creator
  if (_.get(web3, 'eth.defaultAccount') === bet.callerUser) {
    console.log("betExecuted ID:", bet.id);
    let rollUnder = 50 + bet.edge / 2;
    yield put(notificationActions.successMessage(`Bet ID: ${bet.id}. You rolled a ${Math.round(bet.roll * 100) / 100} (needed ${_.round(rollUnder, 4)}) and ${bet.makerWon ? 'lost' : 'won'} ${bet.amount } ETH!`));
  }
}

function* watchSaveNewBet() {
  yield takeEvery(etherBetActions.SAVE_NEW_BET, saveNewBet);
}

function* watchBetCreated() {
  yield takeEvery(etherBetActions.BET_CREATED, notifyBetCreated);
  yield takeEvery(etherBetActions.BET_CREATED, getUserActiveBetsCount);
}

function* watchGetActiveBets() {
  yield takeEvery(etherBetActions.GET_ACTIVE_BETS, getActiveBets);
}

function* watchGetUserActiveBetsCount() {
  yield takeEvery(etherBetActions.GET_USER_ACTIVE_BETS_COUNT, getUserActiveBetsCount);
}

function* watchGetExecutedBets() {
  yield takeEvery(etherBetActions.GET_EXECUTED_BETS, getExecutedBets);
}

function* watchGetBetInfo() {
  yield takeEvery(etherBetActions.GET_BET_INFO, getBetInfo);
}


function* watchGetPendingBets() {
  yield takeEvery(etherBetActions.GET_PENDING_BETS, getPendingBets);
}

function* watchCancelBet() {
  yield takeEvery(etherBetActions.CANCEL_BET, cancelBet);
}

function* watchBetCanceled() {
  yield takeEvery(etherBetActions.BET_CANCELED, notifyBetCanceled);
  yield takeEvery(etherBetActions.BET_CANCELED, getUserActiveBetsCount);
}

function* watchCallBet() {
  yield takeEvery(etherBetActions.CALL_BET, callBet);
}

function* watchBetCalled() {
  yield takeEvery(etherBetActions.BET_CALLED, notifyBetCalled);
  yield takeEvery(etherBetActions.BET_CALLED, getUserActiveBetsCount);
}

function* watchBetExecuted() {
  yield takeEvery(etherBetActions.BET_EXECUTED, notifyBetExecuted);
  yield takeEvery(etherBetActions.BET_EXECUTED, getUserActiveBetsCount);
}

function* watchEtherLoadInitialData() {
  yield takeEvery(web3Actions.ETHER_LOAD_INITIAL_DATA, loadInitialData);
}

export default function* betSaga() {
  yield all([
    watchEtherLoadInitialData(),
    watchSaveNewBet(),
    watchBetCreated(),
    watchGetActiveBets(),
    watchGetUserActiveBetsCount(),
    watchGetExecutedBets(),
    watchGetBetInfo(),
    watchGetPendingBets(),
    watchCancelBet(),
    watchBetCanceled(),
    watchCallBet(),
    watchBetCalled(),
    watchBetExecuted(),
  ]);
}