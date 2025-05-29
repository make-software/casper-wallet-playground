import {
  Args, CasperNetworkName,
  CLTypeMap,
  CLTypeString,
  CLTypeUInt512,
  CLValue,
  CLValueMap,
  ContractCallBuilder,
  Key, PublicKey
} from 'casper-js-sdk';

export function truncateKey(key: string): string {
  const beginOfKey = key.slice(0, 5);
  const endOfKey = key.slice(key.length - 5);

  return `${beginOfKey}...${endOfKey}`;
}

export function makeCasperMarketListBuilder(signingKey: string) {
  const tokensClMapValue = new CLValueMap(
    new CLTypeMap(CLTypeString, CLTypeUInt512)
  );

  const tokensClValue = CLValue.newCLMap(CLTypeString, CLTypeUInt512);

  tokensClMapValue.append(
    CLValue.newCLString('123'),
    CLValue.newCLUInt512('567')
  );

  tokensClValue.map = tokensClMapValue;

  const runtimeArgs = Args.fromMap({
    collection: CLValue.newCLKey(Key.newKey(`hash-998af6825d77da15485baf4bb89aeef3f1dfb4a78841d149574b0be694ce4821`)),
    token_type: CLValue.newCLUint8(0),
    token_id_type: CLValue.newCLUint8(0),
    tokens: tokensClValue
  });

  return new ContractCallBuilder()
    .from(PublicKey.fromHex(signingKey))
    .byPackageHash('154ff59b5f9feec42d3a418058d66badcb2121dc3ffb2e3cf92596bf5aafbc88')
    .entryPoint('list_token')
    .runtimeArgs(runtimeArgs)
    .payment(3_000_000_000) // Amount in motes
    .chainName(CasperNetworkName.Testnet)
}
