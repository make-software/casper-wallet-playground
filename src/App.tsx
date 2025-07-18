import React from 'react';
import logo from './logo.svg';
import { Button } from '@mui/material';
import styled from '@emotion/styled';
import { useWalletService } from './wallet-service';
import {
  makeCasperMarketListBuilder,
  makeContractWithListsBuilder,
  makeContractWithLongNameBuilder,
  makeNativeTransferWithMultiSigTx,
  makeOdraWasmProxyBuilder,
  makeUnknownContractBuilder,
  makeWasmBuilder,
  makeWasmProxyBuilder,
  truncateKey
} from './utils';
import {
  Args,
  AuctionManagerEntryPoint, CLTypeUInt256, CLValue,
  ContractCallBuilder,
  Deploy,
  makeAuctionManagerDeploy,
  makeCep18TransferDeploy,
  makeCep18TransferTransaction,
  makeCsprTransferDeploy,
  NativeDelegateBuilder,
  NativeRedelegateBuilder,
  NativeTransferBuilder,
  NativeUndelegateBuilder,
  PublicKey,
  Transaction,
  CasperNetworkName, HexBytes
} from 'casper-js-sdk';

const Container = styled('div')({
  backgroundColor: '#282c34',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'center'
});

const LogoTitleContainer = styled(Container)({
  marginTop: '24px',
  flexDirection: 'row'
});

const Row = styled(Container)({
  flexDirection: 'row'
});

const RowWrap = styled(Row)({
  flexWrap: 'wrap'
});

function App() {
  const {
    logs,
    activePublicKey,
    connect,
    disconnect,
    sign,
    signMessage,
    switchAccount,
    getVersion,
    isSiteConnected,
    getActivePublicKey,
    getActiveKeySupports
  } = useWalletService();

  // const isConnected = Boolean(activePublicKey);

  const handleSignDeploy = (
    accountPublicKey: string,
    deploy: Deploy
  ) => {
    if (accountPublicKey) {
      const deployJson = Deploy.toJSON(deploy);
      // console.log('deployJson', JSON.stringify(deployJson));
      sign(JSON.stringify(deployJson), accountPublicKey)
        .then(res => {
          if (res.cancelled) {
            alert('Sign cancelled');
          } else {
            const signedDeploy = Deploy.setSignature(
              deploy,
              res.signature,
              PublicKey.fromHex(accountPublicKey)
            );
            alert('Sign successful: ' + JSON.stringify(signedDeploy, null, 2));
          }
        })
        .catch(err => {
          alert('Error: ' + err);
          throw err;
        });
    }
  };

  const handleSignTx = (
    accountPublicKey: string,
    tx: Transaction
  ) => {
    if (accountPublicKey) {
      const txJson = tx.toJSON();
      // console.log('deployJson', JSON.stringify(deployJson));
      sign(JSON.stringify(txJson), accountPublicKey)
        .then(res => {
          if (res.cancelled) {
            alert('Sign cancelled');
          } else {
            tx.setSignature(res.signature, PublicKey.fromHex(accountPublicKey));
            alert('Sign successful: ' + JSON.stringify(tx.toJSON(), null, 2));
          }
        })
        .catch(err => {
          alert('Error: ' + err);
          throw err;
        });
    }
  };

  const handleMultiSignDeploy = async (
    accountPublicKey: string,
    deploy: Deploy
  ) => {
    if (accountPublicKey) {
      const deployJson = Deploy.toJSON(deploy);
      // console.log('deployJson', JSON.stringify(deployJson));

      sign(JSON.stringify(deployJson), accountPublicKey)
        .then(res => {
          if (res.cancelled) {
            alert('Sign cancelled');
          } else {
            const signedDeploy = Deploy.setSignature(
              deploy,
              Uint8Array.from([...Uint8Array.of(Number(accountPublicKey.substring(0, 2))), ...res.signature]),
              PublicKey.fromHex(accountPublicKey)
            );

            const deployJson = Deploy.toJSON(signedDeploy);

            sign(JSON.stringify(deployJson), accountPublicKey).then(res => {
              if (res.cancelled) {
                alert(res.message);
              }
            })
              .catch(err => {
                alert('Error: ' + err);
                throw err;
              });
          }
        })
        .catch(err => {
          alert('Error: ' + err);
          throw err;
        });
    }
  };

  const handleMultiSignTx = async (
    accountPublicKey: string,
    tx: Transaction
  ) => {
    if (accountPublicKey) {
      const txJson = tx.toJSON();

      sign(JSON.stringify(txJson), accountPublicKey)
        .then(res => {
          if (res.cancelled) {
            alert('Sign cancelled');
          } else {
            tx.setSignature(Uint8Array.from([...Uint8Array.of(Number(accountPublicKey.substring(0, 2))), ...res.signature]), PublicKey.fromHex(accountPublicKey));

            const json = tx.toJSON();

            sign(JSON.stringify(json), accountPublicKey).then(res => {
              if (res.cancelled) {
                alert(res.message);
              }
            })
              .catch(err => {
                alert('Error: ' + err);
                throw err;
              });
          }
        })
        .catch(err => {
          alert('Error: ' + err);
          throw err;
        });
    }
  };

  const handleSignMessage = (message: string, accountPublicKey: string) => {
    signMessage(message, accountPublicKey)
      .then(res => {
        if (res.cancelled) {
          alert('Sign cancelled');
        } else {
          alert('Sign successful: ' + JSON.stringify(res.signature, null, 2));
        }
      })
      .catch(err => {
        alert('Error: ' + err);
        throw err;
      });
  };

  const handleConnect = () => connect();
  const handleDisconnect = () => disconnect();

  const statusText = activePublicKey
    ? `${truncateKey(activePublicKey)}`
    : 'Disconnected';

  const signingKey =
    activePublicKey ||
    '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca';

  return (
    <Container>
      <LogoTitleContainer style={{ fontSize: '2rem' }}>
        <img src={logo} alt='logo' />
        Casper Wallet Playground
      </LogoTitleContainer>

      <RowWrap>
        Connected Account: {statusText}{' '}
        <Button variant='contained' onClick={handleConnect}>
          Connect
        </Button>
        <Button variant='contained' onClick={handleDisconnect}>
          Disconnect
        </Button>
        <Button variant='contained' onClick={switchAccount}>
          Switch
        </Button>
        <Button
          variant='contained'
          onClick={async () => {
            const ver = await getVersion();
            alert(ver);
          }}
        >
          Show Version
        </Button>
        <Button
          variant='contained'
          onClick={async () => {
            isSiteConnected()
              .then(res => {
                alert(res);
              })
              .catch(err => {
                alert(err.message);
              });
          }}
        >
          Is Connected
        </Button>
        <Button
          variant='contained'
          onClick={async () => {
            getActivePublicKey()
              .then((res: any) => {
                alert(res);
              })
              .catch(err => {
                alert(err.message);
              });
          }}
        >
          Get Active Key
        </Button>
        <Button
          variant='contained'
          onClick={async () => {
            getActiveKeySupports()
              .then((res: any) => {
                alert(res);
              })
              .catch(err => {
                alert(err.message);
              });
          }}
        >
          Get Active Key Supports
        </Button>
      </RowWrap>
      <Row>
        {
          <div>
            <div style={{ textAlign: 'center' }}>
              DEPLOY SIGNATURE REQUEST SCENARIOS
            </div>
            <Button
              variant='text'
              onClick={() => {
                const deploy = makeCsprTransferDeploy({
                  chainName: CasperNetworkName.Testnet,
                  recipientPublicKeyHex: '020329169b6c9e632fbeca5677fcad1bb48b87cd80500202911b933c16fa1d107e2e',
                  senderPublicKeyHex: signingKey,
                  transferAmount: '2500000000',
                  memo: '1234'
                });
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Transfer
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const deploy = makeAuctionManagerDeploy({
                  chainName: CasperNetworkName.Testnet,
                  contractEntryPoint: AuctionManagerEntryPoint.delegate,
                  amount: '2500000000',
                  delegatorPublicKeyHex: signingKey,
                  validatorPublicKeyHex: `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`
                });
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Delegate
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const deploy = makeAuctionManagerDeploy({
                  chainName: CasperNetworkName.Testnet,
                  contractEntryPoint: AuctionManagerEntryPoint.undelegate,
                  amount: '2500000000',
                  delegatorPublicKeyHex: signingKey,
                  validatorPublicKeyHex: `017d96b9a63abcb61c870a4f55187a0a7ac24096bdb5fc585c12a686a4d892009e`
                });
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Undelegate
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const deploy = makeAuctionManagerDeploy({
                  chainName: CasperNetworkName.Testnet,
                  contractEntryPoint: AuctionManagerEntryPoint.redelegate,
                  amount: '2500000000',
                  delegatorPublicKeyHex: signingKey,
                  validatorPublicKeyHex: `017d9aa0b86413d7ff9a9169182c53f0bacaa80d34c211adab007ed4876af17077`,
                  newValidatorPublicKeyHex: '01c8be540a643e6c9df283dd2d2d6be67748f69a3c7bb6cf34471c899b8e858c9a'
                });
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Redelegate
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = new ContractCallBuilder()
                    .from(PublicKey.fromHex(signingKey))
                    .byPackageHash('6ca070c78d4eb468b4db4cbc5cadd815c35e15019a841c137372a88d7e247d1d')
                    .entryPoint('burn')
                    .runtimeArgs(Args.fromMap({
                      owner: CLValue.newCLPublicKey(PublicKey.fromHex('0111BC2070A9aF0F26F94B8549BfFA5643eAD0bc68EBa3b1833039Cfa2a9a8205d')),
                      token_ids: CLValue.newCLList(CLTypeUInt256, [CLValue.newCLUInt256(101)])
                    }))
                    .payment(3_000_000_000) // Amount in motes
                    .chainName(CasperNetworkName.Testnet)
                    .buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (deploy) {
                    handleSignDeploy(signingKey, deploy);
                  } else {
                    throw new Error('Deploy is null');
                  }
                } catch (e) {
                  alert(e);
                }
              }}
            >
              NFT
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const deploy = makeCep18TransferDeploy({
                    chainName: CasperNetworkName.Testnet,
                    recipientPublicKeyHex: '020329169b6c9e632fbeca5677fcad1bb48b87cd80500202911b933c16fa1d107e2e',
                    senderPublicKeyHex: signingKey,
                    transferAmount: (0.1 * 10 ** 18).toString(),
                    paymentAmount: (3 * 10 ** 9).toString(),
                    contractPackageHash: '7fd113f60890c8ea77daf90880852f544b618c62315bcfd2dd93304c389fa19d'
                  });

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              CEP18
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeCasperMarketListBuilder(signingKey).buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (!deploy) {
                    throw new Error('Deploy is null');
                  }

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              CSPR Market
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = new ContractCallBuilder()
                    .from(PublicKey.fromHex(signingKey))
                    .byPackageHash('ff9c3c0c447d2e3a79c02e13d048c03f6fac8a911fdc04118cc754c84ef6259e')
                    .entryPoint('set_associated_keys')
                    .runtimeArgs(Args.fromMap({}))
                    .payment(3_000_000_000) // Amount in motes
                    .chainName(CasperNetworkName.Testnet)
                    .buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (!deploy) {
                    throw new Error('Deploy is null');
                  }

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Associated keys
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeUnknownContractBuilder(signingKey).buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (!deploy) {
                    throw new Error('Deploy is null');
                  }

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Unknown Contract
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeWasmProxyBuilder(signingKey).buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (!deploy) {
                    throw new Error('Deploy is null');
                  }

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              WASM PROXY
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeWasmBuilder(signingKey).buildFor1_5();

                  const deploy = tx.getDeploy();

                  if (!deploy) {
                    throw new Error('Deploy is null');
                  }

                  handleSignDeploy(signingKey, deploy);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              WASM
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const message =
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
                handleSignMessage(message, signingKey);
              }}
            >
              Message
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const deploy = makeCsprTransferDeploy({
                  chainName: CasperNetworkName.Testnet,
                  recipientPublicKeyHex: '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  senderPublicKeyHex: signingKey,
                  transferAmount: '2500000000',
                  memo: '1234'
                });
                handleMultiSignDeploy(signingKey, deploy);
              }}
            >
              Sign already signed deploy
            </Button>

            <div style={{ textAlign: 'center' }}>DEPLOY SIGNATURE REQUEST ERRORS</div>
            <Button
              variant='text'
              onClick={() => {
                const pk =
                  '01ebf429a18b232b71df5759fe4e77dd05bf8ab3f2ccdcca50d0baa47d6ff27e02';
                const deploy = makeCsprTransferDeploy({
                  chainName: CasperNetworkName.Testnet,
                  recipientPublicKeyHex: '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  senderPublicKeyHex: pk,
                  transferAmount: '2500000000',
                  memo: '1234'
                });
                handleSignDeploy(pk, deploy);
              }}
            >
              Not approved
            </Button>
          </div>
        }
      </Row>

      <Row>
        {
          <div>
            <div style={{ textAlign: 'center' }}>
              TRANSACTION_V1 SIGNATURE REQUEST SCENARIOS
            </div>
            <Button
              variant='text'
              onClick={() => {
                const transaction = new NativeTransferBuilder()
                  .from(PublicKey.fromHex(signingKey))
                  .target(PublicKey.fromHex('020329169b6c9e632fbeca5677fcad1bb48b87cd80500202911b933c16fa1d107e2e'))
                  .amount('25000000000') // Amount in motes
                  .id(Date.now())
                  .chainName(CasperNetworkName.Testnet)
                  .payment(100_000_000)
                  .build();

                handleSignTx(signingKey, transaction);
              }}
            >
              Transfer
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const tx = new NativeDelegateBuilder()
                  .from(PublicKey.fromHex(signingKey))
                  .validator(PublicKey.fromHex('0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca'))
                  .amount('2500000000')
                  .payment(1_000_000_000)
                  .chainName(CasperNetworkName.Testnet)
                  .build();

                handleSignTx(signingKey, tx);
              }}
            >
              Delegate native
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const tx = new NativeUndelegateBuilder()
                  .from(PublicKey.fromHex(signingKey))
                  .validator(PublicKey.fromHex('017d96b9a63abcb61c870a4f55187a0a7ac24096bdb5fc585c12a686a4d892009e'))
                  .amount('2500000000')
                  .payment(1_000_000_000)
                  .chainName(CasperNetworkName.Testnet)
                  .build();
                handleSignTx(signingKey, tx);
              }}
            >
              Undelegate native
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const tx = new NativeRedelegateBuilder()
                  .from(PublicKey.fromHex(signingKey))
                  .validator(PublicKey.fromHex('017d9aa0b86413d7ff9a9169182c53f0bacaa80d34c211adab007ed4876af17077'))
                  .newValidator(PublicKey.fromHex('01c8be540a643e6c9df283dd2d2d6be67748f69a3c7bb6cf34471c899b8e858c9a'))
                  .amount('2500000000')
                  .payment(1_000_000_000)
                  .chainName(CasperNetworkName.Testnet)
                  .build();
                handleSignTx(signingKey, tx);
              }}
            >
              Redelegate native
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = new ContractCallBuilder()
                    .from(PublicKey.fromHex(signingKey))
                    .byPackageHash('6ca070c78d4eb468b4db4cbc5cadd815c35e15019a841c137372a88d7e247d1d')
                    .entryPoint('burn')
                    .runtimeArgs(Args.fromMap({
                      owner: CLValue.newCLPublicKey(PublicKey.fromHex('0111BC2070A9aF0F26F94B8549BfFA5643eAD0bc68EBa3b1833039Cfa2a9a8205d')),
                      token_ids: CLValue.newCLList(CLTypeUInt256, [CLValue.newCLUInt256(101)])
                    }))
                    .payment(3_000_000_000) // Amount in motes
                    .chainName(CasperNetworkName.Testnet)
                    .build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              NFT
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeCep18TransferTransaction({
                    chainName: CasperNetworkName.Testnet,
                    recipientPublicKeyHex: '020329169b6c9e632fbeca5677fcad1bb48b87cd80500202911b933c16fa1d107e2e',
                    senderPublicKeyHex: signingKey,
                    transferAmount: (0.1 * 10 ** 18).toString(),
                    paymentAmount: (3 * 10 ** 9).toString(),
                    contractPackageHash: '7fd113f60890c8ea77daf90880852f544b618c62315bcfd2dd93304c389fa19d',
                    casperNetworkApiVersion: '2.0'
                  });

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              CEP18
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeCasperMarketListBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              CSPR Market
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = new ContractCallBuilder()
                    .from(PublicKey.fromHex(signingKey))
                    .byPackageHash('ff9c3c0c447d2e3a79c02e13d048c03f6fac8a911fdc04118cc754c84ef6259e')
                    .entryPoint('set_associated_keys')
                    .runtimeArgs(Args.fromMap({}))
                    .payment(3_000_000_000) // Amount in motes
                    .chainName(CasperNetworkName.Testnet)
                    .build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Associated keys
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeUnknownContractBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Unknown contract
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeContractWithListsBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Unknown contract with lists
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeContractWithLongNameBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              Contract with long name
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeWasmProxyBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              WASM Proxy
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeOdraWasmProxyBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
             ODRA WASM Proxy
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeWasmBuilder(signingKey).build();

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              WASM
            </Button>
            <Button
              variant='text'
              onClick={() => {
                try {
                  const tx = makeNativeTransferWithMultiSigTx(signingKey);

                  handleSignTx(signingKey, tx);

                } catch (e) {
                  alert(e);
                }
              }}
            >
              With multisig
            </Button>
            <Button
              variant='text'
              onClick={() => {
                const transaction = new NativeTransferBuilder()
                  .from(PublicKey.fromHex(signingKey))
                  .target(PublicKey.fromHex('0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca'))
                  .amount('25000000000') // Amount in motes
                  .id(Date.now())
                  .chainName(CasperNetworkName.Testnet)
                  .payment(100_000_000)
                  .build();

                handleMultiSignTx(signingKey, transaction);
              }}
            >
              Sign already signed
            </Button>

          </div>
        }
      </Row>

      <div>
        {logs.map(([log, payload], index) => (
          <div key={index}>
            {log} {JSON.stringify(payload, null, 2)}]
          </div>
        ))}
      </div>
    </Container>
  );
}

export default App;
