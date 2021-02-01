import express from 'express';
import { Accounts } from '../models/Account.js';
import advancedOperationsRouter from './advancedOperationsRouter.js';

const router = express.Router();

router.use('/advanced-operations', advancedOperationsRouter);

router.use('/', async (req, res, next) => {
  try {
    // Verifying if the provided account is valid
    const { agencia, conta } = req.body;
    const account = await Accounts.findOne({ agencia, conta });
    if (!account) {
      return res.status(400).send('The provided account could not be found.');
    }
    // Passing the account found to the req body
    req.body.account = account;
    next();
  } catch (error) {
    next(error);
  }
});

router.patch('/deposit', async (req, res, next) => {
  try {
    const { account, depositValue } = req.body;
    const { balance, _id } = account;
    const updatedAccount = await Accounts.findByIdAndUpdate(
      { _id },
      { balance: balance + depositValue },
      { new: true }
    );
    res.status(200).send(updatedAccount);
  } catch (error) {
    next(error);
  }
});

router.patch('/withdrawal', async (req, res, next) => {
  try {
    const { account, withdrawalValue } = req.body;
    const { balance, _id } = account;
    const withdrawalFee = 1;
    const operationCost = withdrawalValue + withdrawalFee;
    if (balance < operationCost) {
      return res
        .status(406)
        .send(
          'Error: You have no sufficient funds to perform this opperation. '
        );
    }
    // Updating values
    const updatedAccount = await Accounts.findByIdAndUpdate(
      { _id },
      { balance: balance - operationCost },
      { new: true }
    );
    res.status(200).send(updatedAccount);
  } catch (error) {
    next(error);
  }
});

router.get('/balance', async (req, res, next) => {
  try {
    const { account } = req.body;
    res.status(200).send(account);
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const { account, agencia } = req.body;
    const { _id } = account;
    await Accounts.findByIdAndDelete({ _id });
    // Sending values
    const agencyAccounts = await Accounts.find({ agencia });
    res
      .status(200)
      .send(
        `Account deleted. Total of remaining accounts on this branch: ${agencyAccounts.length}`
      );
  } catch (error) {
    next(error);
  }
});

router.use((err, req, res, next) => {
  res.status(500).send({ err: err.message });
});

export default router;
