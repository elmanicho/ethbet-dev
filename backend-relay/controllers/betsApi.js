const _ = require('lodash');

let betService = require('../lib/betService');
let errorService = require('../lib/errorService');


module.exports = {
  getActiveBets: async function getActiveBets(req, res) {
    let opts = {
      orderField: req.query.orderField,
      orderDirection: req.query.orderDirection,
      offset: parseInt(req.query.offset, 10),
    };
    try {
      let results = await betService.getActiveBets(opts);
      res.status(200).json({ results });
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  getUserActiveBetsCount: async function getUserActiveBetsCount(req, res) {
    try {
      let count = await betService.getUserActiveBetsCount(req.query.userAddress);
      res.status(200).json({ count });
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  getExecutedBets: async function getExecutedBets(req, res) {
    try {
      let bets = await betService.getExecutedBets();
      res.status(200).json({ bets });
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  getBetInfo: async function getBetInfo(req, res) {
    try {
      let bet = await betService.getBetInfo(req.params.id);
      res.status(200).json(bet);
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  createBet: async function createBet(req, res) {
    try {
      let betData = {
        amount: req.objectData.amount,
        edge: req.objectData.edge,
        seed: req.objectData.seed,
        gasPriceType: req.objectData.gasPriceType,
        user: req.body.address,
      };

      await betService.createBet(betData);

      res.status(200).json({});
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  cancelBet: async function cancelBet(req, res) {
    try {
      let id = req.objectData.id;
      let gasPriceType = req.objectData.gasPriceType;

      await betService.cancelBet(id, req.body.address, gasPriceType);

      res.status(200).json({});
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  callBet: async function callBet(req, res) {
    try {
      let id = req.objectData.id;
      let seed = req.objectData.seed;
      let gasPriceType = req.objectData.gasPriceType;

      await betService.callBet(id, seed, req.body.address, gasPriceType);

      res.status(200).json({});
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

};
