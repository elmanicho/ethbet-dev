const _ = require('lodash');

let etherBetService = require('../lib/etherBetService');
let errorService = require('../lib/errorService');


module.exports = {

  getActiveBets: async function getActiveBets(req, res) {
    let opts = {
      orderField: req.query.orderField,
      orderDirection: req.query.orderDirection,
      offset: parseInt(req.query.offset, 10),
    };
    try {
      let results = await etherBetService.getActiveBets(opts);
      res.status(200).json({ results });
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  getExecutedBets: async function getExecutedBets(req, res) {
    try {
      let etherBets = await etherBetService.getExecutedBets();
      res.status(200).json({ etherBets });
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
        user: req.body.address,
      };

      let bet = await etherBetService.createBet(betData);

      res.status(200).json({ bet });
    }
    catch (err) {
      res.status(500).json({ message: errorService.sanitize(err).message });
    }
  },

  cancelBet: async function cancelBet(req, res) {
    try {
      let id = req.objectData.id;

      await etherBetService.cancelBet(id, req.body.address);

      res.status(200).json({});
    }
    catch (err) {
      res.status(500).json({message: errorService.sanitize(err).message});
    }
  },

  callBet: async function callBet(req, res) {
    try {
      let id = req.objectData.id;

      let results = await etherBetService.callBet(id, req.body.address);

      res.status(200).json(results);
    }
    catch (err) {
      res.status(500).json({message: errorService.sanitize(err).message});
    }
  },

};
