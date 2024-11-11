import {
  Args,
  CLValue,
  CLValueUInt512,
  ContractHash,
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  PublicKey,
  StoredContractByHash,
  TransferDeployItem
} from 'casper-js-sdk';

const config = {
  network_name: 'casper-test',
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
  switch (entryPoint) {
    case AuctionManagerEntryPoint.delegate:
      return config.delegate_cost;
    case AuctionManagerEntryPoint.undelegate:
      return config.undelegate_cost;
    case AuctionManagerEntryPoint.redelegate:
      return config.redelegate_cost;

    default:
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
  const delegatorPublicKey = PublicKey.fromHex(delegatorPublicKeyHex);
  const validatorPublicKey = PublicKey.fromHex(validatorPublicKeyHex);
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    PublicKey.fromHex(redelegateValidatorPublicKeyHex);
  const executableDeployItem = new ExecutableDeployItem();
  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);
  const payment = ExecutableDeployItem.standardPayment(deployCost);

  const args = Args.fromMap({
    delegator: CLValue.newCLPublicKey(delegatorPublicKey),
    validator: CLValue.newCLPublicKey(validatorPublicKey),
    amount: CLValueUInt512.newCLUInt512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: CLValue.newCLPublicKey(newValidatorPublicKey)
    })
  });

  const deployHeader = new DeployHeader(
    config.network_name,
    undefined,
    undefined,
    undefined,
    undefined,
    delegatorPublicKey,
    undefined
  );

  executableDeployItem.storedContractByHash = new StoredContractByHash(
    ContractHash.newContract(config.auction_manager_contract_hash),
    contractEntryPoint,
    args
  );

  return Deploy.fromHeaderAndItems(deployHeader, payment, executableDeployItem);
};

export const makeNativeTransferDeploy = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  transferIdMemo: string
) => {
  const senderPublicKey = PublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = PublicKey.fromHex(recipientPublicKeyHex);
  const executableDeployItem = new ExecutableDeployItem();

  const deployHeader = new DeployHeader(
    config.network_name,
    undefined,
    undefined,
    undefined,
    undefined,
    senderPublicKey,
    undefined
  );

  executableDeployItem.transfer = TransferDeployItem.newTransfer(
    amountMotes,
    recipientPublicKey,
    undefined,
    transferIdMemo
  );

  const payment = ExecutableDeployItem.standardPayment(config.transfer_cost);

  return Deploy.fromHeaderAndItems(deployHeader, payment, executableDeployItem);
};
