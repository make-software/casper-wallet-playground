import {
  CLPublicKey,
  CLU64,
  CLU64Type,
  CLValueBuilder,
  decodeBase16,
  DeployUtil,
  InitiatorAddr,
  RuntimeArgs,
  TransactionEntryPoint,
  TransactionScheduling,
  TransactionTarget,
  TransactionUtil
} from 'casper-js-sdk';
import { Some } from 'ts-results';

const config = {
  network_name: 'casper-test',
  condor_network_name: 'dev-net',
  auction_manager_contract_hash:
    '93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2',
  delegate_cost: '2500000000', // in motes
  undelegate_cost: '10000', // in motes
  redelegate_cost: '10000', // in motes
  transfer_cost: '100000000' // in motes
};

export enum AuctionManagerEntryPoint {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate'
}

const getAuctionManagerDeployCost = (entryPoint: AuctionManagerEntryPoint) => {
  if (entryPoint === AuctionManagerEntryPoint.delegate) {
    return config.delegate_cost;
  } else if (entryPoint === AuctionManagerEntryPoint.undelegate) {
    return config.undelegate_cost;
  } else if (entryPoint === AuctionManagerEntryPoint.redelegate) {
    return config.redelegate_cost;
  } else {
    throw Error('getAuctionManagerDeployCost: unknown entry point');
  }
};

export const makeAuctionManagerDeploy = (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string
) => {
  const delegatorPublicKey = CLPublicKey.fromFormattedString(
    delegatorPublicKeyHex
  );
  const validatorPublicKey = CLPublicKey.fromFormattedString(
    validatorPublicKeyHex
  );
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    CLPublicKey.fromFormattedString(redelegateValidatorPublicKeyHex);

  const deployParams = new DeployUtil.DeployParams(
    delegatorPublicKey,
    config.network_name
  );

  const args = RuntimeArgs.fromMap({
    delegator: delegatorPublicKey,
    validator: validatorPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: newValidatorPublicKey
    })
  });

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    decodeBase16(config.auction_manager_contract_hash),
    contractEntryPoint,
    args
  );

  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);

  const payment = DeployUtil.standardPayment(deployCost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const makeNativeTransferDeploy = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  transferIdMemo: string
) => {
  const senderPublicKey = CLPublicKey.fromFormattedString(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromFormattedString(
    recipientPublicKeyHex
  );

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    config.network_name
  );

  const session = DeployUtil.ExecutableDeployItem.newTransfer(
    amountMotes,
    recipientPublicKey,
    undefined,
    transferIdMemo
  );

  const payment = DeployUtil.standardPayment(config.transfer_cost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

/**
 * CONDOR
 */
export const makeNativeTranferTransaction = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  transferIdMemo: string
) => {
  const senderPublicKey = CLPublicKey.fromFormattedString(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromFormattedString(
    recipientPublicKeyHex
  );
  const ttl = 1000000;
  const id = Date.now();

  const transactionParams = new TransactionUtil.Version1Params(
    InitiatorAddr.InitiatorAddr.fromPublicKey(senderPublicKey),
    id,
    ttl,
    config.condor_network_name,
    TransactionUtil.PricingMode.buildFixed(100)
  );

  const runtimeArgs = RuntimeArgs.fromMap({
    target: recipientPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    id: CLValueBuilder.option(Some(new CLU64(transferIdMemo)), new CLU64Type()) // Transfer memo
  });

  const transactionTarget = new TransactionTarget.Native();
  const transactionEntryPoint = new TransactionEntryPoint.Transfer();
  const transactionScheduling = new TransactionScheduling.Standard();

  return TransactionUtil.makeV1Transaction(
    transactionParams,
    runtimeArgs,
    transactionTarget,
    transactionEntryPoint,
    transactionScheduling,
    TransactionUtil.TransactionCategoryMint
  );
};

export const makeAuctionManagerTransaction = (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string
) => {
  const delegatorPublicKey = CLPublicKey.fromFormattedString(
    delegatorPublicKeyHex
  );
  const validatorPublicKey = CLPublicKey.fromFormattedString(
    validatorPublicKeyHex
  );
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    CLPublicKey.fromFormattedString(redelegateValidatorPublicKeyHex);

  const runEndpointParams = new TransactionUtil.Version1Params(
    InitiatorAddr.InitiatorAddr.fromPublicKey(delegatorPublicKey),
    Date.now(),
    1000000,
    config.condor_network_name,
    TransactionUtil.PricingMode.buildFixed(3) // TODO: Consider to use paymentAmount here
  );

  const runtimeArgs = RuntimeArgs.fromMap({
    validator: validatorPublicKey,
    delegator: delegatorPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: newValidatorPublicKey
    })
  });

  const transactionTarget = new TransactionTarget.Native();
  let transactionEntryPoint;
  const transactionScheduling = new TransactionScheduling.Standard();

  if (contractEntryPoint === 'delegate') {
    transactionEntryPoint = new TransactionEntryPoint.Delegate();
  } else if (contractEntryPoint === 'redelegate') {
    transactionEntryPoint = new TransactionEntryPoint.Redelegate();
  } else if (contractEntryPoint === 'undelegate') {
    transactionEntryPoint = new TransactionEntryPoint.Undelegate();
  }

  return TransactionUtil.makeV1Transaction(
    runEndpointParams,
    runtimeArgs,
    transactionTarget,
    transactionEntryPoint as TransactionEntryPoint.TransactionEntryPoint,
    transactionScheduling,
    TransactionUtil.TransactionCategoryAuction
  );
};
