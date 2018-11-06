let _ = require('lodash');
const BlueBirdPromise = require("bluebird");

let socketService = require('./socketService');
let ethbetOraclizeService = require('./blockchain/ethbetOraclizeService');
let userService = require('./userService');
let lockService = require('./lockService');
let logService = require('./etherLogService');

let EBET_FEE = 200;

async function createBet(etherBetData) {
  let userEbetBalance = await ethbetOraclizeService.balanceOf(etherBetData.user);
  if (userEbetBalance < EBET_FEE) {
    throw new Error("Insufficient EBET Balance for bet");
  }

  let createFee = (await ethbetOraclizeService.createFee(etherBetData.gasPriceType)) / (10 ** 18);

  let userEtherBalance = await ethbetOraclizeService.ethBalanceOf(etherBetData.user);
  if (userEtherBalance < (etherBetData.amount + createFee)) {
    throw new Error("Insufficient ETH Balance for bet + fees, fees currently estimated at: " + (createFee) + " ETH");
  }

  logService.logger.info("createBet: locking balance", {
    user: etherBetData.user,
    amount: etherBetData.amount,
  });

  ethbetOraclizeService.chargeFeeAndLockEthBalance(etherBetData.user, etherBetData.amount, etherBetData.gasPriceType).then(async (results) => {
    logService.logger.info("createBet: balance locked", {
      tx: results.tx,
      user: etherBetData.user,
      amount: etherBetData.amount,
    });

    let etherBet = await db.EtherBet.create(etherBetData);

    logService.logger.info("createBet: db updated", etherBet.toJSON());

    etherBet.dataValues.username = await userService.getUsername(etherBet.user);
    socketService.emit("etherBetCreated", etherBet);
  }).catch((err) => {
    logService.logger.info("createBet: error", {
      user: etherBetData.user,
      amount: etherBetData.amount,
      err: err.message,
    });
  });
}

async function getActiveBets(opts = { orderField: 'createdAt', orderDirection: 'DESC', offset: 0 }) {
  let result = await db.EtherBet.findAndCountAll({
    where: {
      cancelledAt: null,
      initializedAt: null,
    },
    order: [
      [opts.orderField, opts.orderDirection]
    ],
    offset: opts.offset,
    limit: 50
  });

  let populatedEtherBets = await userService.populateUserNames(result.rows);

  return { bets: populatedEtherBets, count: result.count };
}

async function getUserActiveBetsCount(userAddress) {
  let count = await db.EtherBet.count({
    where: {
      user: userAddress,
      cancelledAt: null,
      executedAt: null,
    },
  });

  return count;
}

async function getExecutedBets() {
  let bets = await db.EtherBet.findAll({
    where: {
      executedAt: {
        [db.Sequelize.Op.ne]: null
      },
    },
    order: [
      ['executedAt', 'DESC']
    ],
    limit: 20
  });

  let populatedEtherBets = await userService.populateUserNames(bets);

  return populatedEtherBets;
}

async function getBetInfo(betId) {
  let bet = await db.EtherBet.findById(betId);

  let populatedBets = await userService.populateUserNames([bet]);
  return populatedBets[0];
}


async function getPendingBets() {
  let bets = await db.EtherBet.findAll({
    where: {
      cancelledAt: null,
      executedAt: null,
      initializedAt: {
        [db.Sequelize.Op.ne]: null
      },
    },
    order: [
      ['initializedAt', 'DESC']
    ],
    limit: 20
  });

  let populatedEtherBets = await userService.populateUserNames(bets);

  return populatedEtherBets;
}


function getEtherBetLockId(etherBetId) {
  return `ether-bet-${etherBetId}`;
}

async function cancelBet(etherBetId, user, gasPriceType) {
  let etherBet = await db.EtherBet.findById(etherBetId);
  if (!etherBet) {
    throw new Error("Ether Bet not found");
  }
  if (etherBet.cancelledAt) {
    throw new Error("Ether Bet already cancelled");
  }
  if (etherBet.initializedAt) {
    throw new Error("Ether Bet already called, execution in progress");
  }
  if (etherBet.executedAt) {
    throw new Error("Ether Bet already executed");
  }
  if (etherBet.user !== user) {
    throw new Error("You can't cancel someone else's bet");
  }

  let userLockedEthBalance = await ethbetOraclizeService.lockedEthBalanceOf(user);
  if (userLockedEthBalance < etherBet.amount) {
    throw new Error("Locked Eth Balance is less than bet amount");
  }

  let cancelFee = await ethbetOraclizeService.cancelFee(gasPriceType) / (10 ** 18);
  let userEthBalance = await ethbetOraclizeService.ethBalanceOf(user);
  if (userEthBalance < cancelFee) {
    throw new Error("Insufficient ETH Balance for fees, currently estimated at: " + (cancelFee) + " ETH");
  }

  try {
    await lockService.lock(getEtherBetLockId(etherBetId));
  }
  catch (err) {
    if (err.code === 'EEXIST') {
      throw new Error("Somebody else is currently calling or cancelling this ether bet ...");
    }
  }

  logService.logger.info("cancelBet: unlocking balance", {
    betId: etherBet.id,
    user: etherBet.user,
    amount: etherBet.amount
  });

  ethbetOraclizeService.unlockEthBalance(etherBet.user, etherBet.amount, gasPriceType).then(async (results) => {
    logService.logger.info("cancelBet: balance unlocked", {
      tx: results.tx,
      betId: etherBet.id,
      user: etherBet.user,
      amount: etherBet.amount
    });

    let cancelledAt = new Date();
    await etherBet.update({ cancelledAt });
    logService.logger.info("cancelBet: db updated", { betId: etherBet.id, cancelledAt });

    await lockService.unlock(getEtherBetLockId(etherBetId));

    socketService.emit("etherBetCanceled", etherBet);
  }).catch((err) => {
    logService.logger.info("cancelBet: error", {
      betId: etherBet.id,
      user: etherBet.user,
      amount: etherBet.amount,
      err: err.message
    });
  });
}

async function callBet(betId, callerUser, gasPriceType) {
  let etherBet = await db.EtherBet.findById(betId);

  if (!etherBet) {
    throw new Error("Ether Bet not found");
  }
  if (etherBet.cancelledAt) {
    throw new Error("Ether Bet cancelled");
  }
  if (etherBet.initializedAt) {
    throw new Error("Ether Bet already called, execution in progress");
  }
  if (etherBet.executedAt) {
    throw new Error("Ether Bet already executed");
  }
  if (etherBet.user === callerUser) {
    throw new Error("You can't call your own bet");
  }

  let isBetInitialized = await ethbetOraclizeService.isBetInitialized(etherBet.id);
  if (isBetInitialized) {
    throw new Error("Ether Bet already marked as called");
  }

  let callerEtherBalance = await ethbetOraclizeService.ethBalanceOf(callerUser);
  let callFee = await ethbetOraclizeService.callFee(gasPriceType) / (10 ** 18);
  if (callerEtherBalance < etherBet.amount + callFee) {
    throw new Error("Insufficient ETH Balance for bet + fees. fees currently estimated at: " + (callFee) + " ETH");
  }

  let callerEbetBalance = await ethbetOraclizeService.balanceOf(callerUser);
  if (callerEbetBalance < EBET_FEE) {
    throw new Error("Insufficient EBET Balance for bet");
  }

  let makerLockedEthBalance = await ethbetOraclizeService.lockedEthBalanceOf(etherBet.user);
  if (makerLockedEthBalance < etherBet.amount) {
    throw new Error("Maker user Locked ETH Balance is less than bet amount");
  }

  try {
    await lockService.lock(getEtherBetLockId(etherBet.id));
  }
  catch (err) {
    if (err.code === 'EEXIST') {
      throw new Error("Somebody else is currently calling or cancelling this bet ...");
    }
  }

  logService.logger.info("callBet, calling initBet :", {
    betId: etherBet.id,
    callerUser: callerUser,
    amount: etherBet.amount
  });


  let rollUnder = 50 + etherBet.edge / 2;


  ethbetOraclizeService.initBet(etherBet.id, etherBet.user, callerUser, etherBet.amount, rollUnder, gasPriceType).then(async (txResults) => {
    let log = txResults.logs[1];
    let loggedQueryId = log.args.queryId;

    logService.logger.info("callBet, initBet executed : ", {
      tx: txResults.tx,
      betId: etherBet.id,
      makerUser: etherBet.user,
      callerUser,
      amount: etherBet.amount,
      rollUnder,
      oraclizeQueryId: loggedQueryId
    });

    let dbUpdateAttrs = {
      initializedAt: new Date(),
      callerUser: callerUser,
      queryId: loggedQueryId
    };
    await etherBet.update(dbUpdateAttrs);
    logService.logger.info("callBet, db updated : ", Object.assign({}, etherBet.toJSON(), dbUpdateAttrs));

    await lockService.unlock(getEtherBetLockId(etherBet.id));

    etherBet.dataValues.username = await userService.getUsername(etherBet.user);
    etherBet.dataValues.callerUsername = await userService.getUsername(etherBet.callerUser);
    socketService.emit("etherBetCalled", etherBet);

    // watch bet execution in background
    ethbetOraclizeService.watchBetExecutionEvent(etherBet.id).then(() => {
      // update db upon execution
      this.checkBetExecution(etherBet.id);
    });
  }).catch((err) => {
    logService.logger.info("callBet: error", {
      betId: etherBet.id,
      user: etherBet.user,
      amount: etherBet.amount,
      err: err.message
    });
  });
}

async function checkBetExecution(betId) {
  let etherBet = await db.EtherBet.findById(betId);

  if (!etherBet) {
    throw new Error("Ether Bet not found");
  }
  if (etherBet.cancelledAt) {
    throw new Error("Ether Bet cancelled");
  }
  if (!etherBet.initializedAt) {
    throw new Error("Ether Bet not initialized");
  }
  if (etherBet.executedAt) {
    // Bet execution data already saved in db
    return;
  }

  let isBetInitialized = await ethbetOraclizeService.isBetInitialized(etherBet.id);
  if (!isBetInitialized) {
    throw new Error("Ether Bet not initialized on blockchain");
  }

  let contractEtherBet = await ethbetOraclizeService.getBetById(etherBet.id);

  if (!contractEtherBet.executedAt) {
    // Bet not executed yet
    return;
  }

  let dbUpdateAttrs = {
    executedAt: contractEtherBet.executedAt,
    randomBytes: contractEtherBet.rawResult,
    roll: contractEtherBet.roll,
    makerWon: contractEtherBet.makerWon,
  };
  await etherBet.update(dbUpdateAttrs);
  logService.logger.info("Ether Bet Executed, db updated : ", Object.assign({}, etherBet.toJSON(), dbUpdateAttrs));

  etherBet.dataValues.username = await userService.getUsername(etherBet.user);
  etherBet.dataValues.callerUsername = await userService.getUsername(etherBet.callerUser);
  socketService.emit("etherBetExecuted", etherBet);
}

async function checkPendingBets() {
  let pendingEtherBets = await this.getPendingBets();

  await BlueBirdPromise.map(pendingEtherBets, (etherBet) => this.checkBetExecution(etherBet.id), { concurrency: 5 });
}

module.exports = {
  createBet,
  getActiveBets,
  getUserActiveBetsCount,
  getExecutedBets,
  getPendingBets,
  cancelBet,
  callBet,
  checkBetExecution,
  checkPendingBets,
  getBetInfo,
};