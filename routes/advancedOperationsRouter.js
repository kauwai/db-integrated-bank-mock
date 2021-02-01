import express from 'express';
import { Accounts } from '../models/Account.js';

const router = express.Router();

router.patch('/transfer', async (req, res, next) => {
  try {
    // Verifying information
    const { origin, destination, transferValue } = req.body;
    const originAccount = await Accounts.findOne({ conta: origin });
    const destinationAccount = await Accounts.findOne({ conta: destination });
    if (!originAccount || !destinationAccount) {
      return res.status(400).send('The accounts provided are not valid');
    }
    if (originAccount.conta === destinationAccount.conta) {
      return res
        .status(400)
        .send("You can't perform a transfer to your own account");
    }
    // Performing updates
    const transferFee =
      originAccount.agencia === destinationAccount.agencia ? 0 : 8;
    const operationCost = transferFee + transferValue;
    if (originAccount.balance < operationCost) {
      return res
        .status(400)
        .send("You don't have the required ammount of balance available");
    }
    const updatedOriginAccount = await Accounts.findByIdAndUpdate(
      {
        _id: originAccount._id,
      },
      { balance: originAccount.balance - operationCost },
      { new: true }
    );
    await Accounts.findByIdAndUpdate(
      { _id: destinationAccount._id },
      { balance: destinationAccount.balance + transferValue },
      { new: true }
    );
    res.status(200).send(updatedOriginAccount);
  } catch (error) {
    next(error);
  }
});

router.get('/median-balance', async (req, res, next) => {
  try {
    const { agencia } = req.body;
    const clients = await Accounts.find({ agencia });
    const clientsQuantity = clients.length;
    const totalBalance = clients.reduce((acc, current) => {
      return acc + current.balance;
    }, 0);
    const medianBalance = totalBalance / clientsQuantity;
    res
      .status(200)
      .send(
        `The median balance of clients in this branch is ${medianBalance}.`
      );
  } catch (error) {
    next(error);
  }
});

router.get('/lowest-balances', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const lowestBalanceClients = await Accounts.find()
      .sort({ balance: 1 })
      .limit(quantity);
    res.send(lowestBalanceClients);
  } catch (error) {
    next(error);
  }
});

router.get('/highest-balances', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const highestBalanceClients = await Accounts.find()
      .sort({ balance: -1, name: 1 })
      .limit(quantity);
    res.send(highestBalanceClients);
  } catch (error) {
    next(error);
  }
});

router.patch('/vip-clients', async (req, res, next) => {
  try {
    const allClients = await Accounts.find().sort({ balance: -1 });
    const allBranches = await Accounts.distinct('agencia');

    // Reseting the 99 branch so it doesnt count when looking for richest
    if (allBranches.includes(99)) {
      allBranches.pop();
    }

    const richestClientsPerBranch = allBranches.map((branch) => {
      const clientPerBranch = allClients.filter(
        (client) => client.agencia === branch
      );
      return clientPerBranch[0];
    });

    for (let richestClient of richestClientsPerBranch) {
      const { _id } = richestClient;
      await Accounts.findByIdAndUpdate({ _id }, { agencia: 99 });
    }
    const privateBranchClients = await Accounts.find({ agencia: 99 }).sort({
      balance: -1,
    });
    res.send(privateBranchClients);
  } catch (error) {
    next(error);
  }
});

router.use((err, req, res, next) => {
  res.status(500).send({ err: err.message });
});

export default router;
