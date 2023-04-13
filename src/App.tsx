import React from 'react';
import logo from './logo.svg';
import { Button } from '@mui/material';
import styled from '@emotion/styled';
import { useWalletService } from './wallet-service';
import { truncateKey } from './utils';
import {
  AuctionManagerEntryPoint,
  makeAuctionManagerDeploy,
  makeNativeTransferDeploy
} from './deploy-utils';
import { CLPublicKey, DeployUtil } from 'casper-js-sdk';

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
    getActivePublicKey
  } = useWalletService();

  const isConnected = Boolean(activePublicKey);

  const handleSignDeploy = (
    accountPublicKey: string,
    deploy: DeployUtil.Deploy
  ) => {
    if (accountPublicKey) {
      const deployJson = DeployUtil.deployToJson(deploy);
      // console.log('deployJson', JSON.stringify(deployJson));
      sign(JSON.stringify(deployJson), accountPublicKey)
        .then(res => {
          if (res.cancelled) {
            alert('Sign cancelled');
          } else {
            const signedDeploy = DeployUtil.setSignature(
              deploy,
              res.signature,
              CLPublicKey.fromHex(accountPublicKey)
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
        <img src={logo} alt="logo" />
        Casper Wallet Playground
      </LogoTitleContainer>

      <Row>
        Connected Account: {statusText}{' '}
        <Button variant="contained" onClick={handleConnect}>
          Connect
        </Button>
        <Button variant="contained" onClick={handleDisconnect}>
          Disconnect
        </Button>
        <Button variant="contained" onClick={switchAccount}>
          Switch
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            const ver = await getVersion();
            alert(ver);
          }}
        >
          Show Version
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            const result = await isSiteConnected();
            alert(result);
          }}
        >
          Is Connected
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            const result = await getActivePublicKey();
            alert(result);
          }}
        >
          Get Active Key
        </Button>
      </Row>
      <Row>
        {
          <div>
            <div style={{ textAlign: 'center' }}>
              SIGNATURE REQUEST SCENARIOS
            </div>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeNativeTransferDeploy(
                  signingKey,
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Transfer
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.delegate,
                  signingKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  null,
                  '2500000000'
                );
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Delegate
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.undelegate,
                  signingKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  null,
                  '2500000000'
                );
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Undelegate
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeAuctionManagerDeploy(
                  AuctionManagerEntryPoint.redelegate,
                  signingKey,
                  `0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca`, // MAKE Stake 10% [testnet],
                  '017d96b9a63abcb61c870a4f55187a0a7ac24096bdb5fc585c12a686a4d892009e', // MAKE Stake 2
                  '2500000000'
                );
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Redelegate
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const deployJson = JSON.parse(
                  '{"deploy":{"approvals":[],"hash":"97035958Ab5E2a1EB187B8239491EaEe7FBB97340684d5442D8F84aCB630aeae","header":{"account":"0111BC2070A9aF0F26F94B8549BfFA5643eAD0bc68EBa3b1833039Cfa2a9a8205d","timestamp":"2022-12-06T21:35:31.194Z","ttl":"30m","dependencies":[],"gas_price":1,"body_hash":"01863FC06867f1E007a3236758a8e9D301dc89662Dc2A9bC042C36561d610ae6","chain_name":"casper-test"},"payment":{"ModuleBytes":{"module_bytes":"","args":[["amount",{"cl_type":"U512","bytes":"0400ca9A3B","parsed":"1000000000"}]]}},"session":{"StoredVersionedContractByHash":{"hash":"6ca070C78D4Eb468b4db4CBC5CaDd815c35E15019a841c137372A88D7e247d1D","version":null,"entry_point":"burn","args":[["owner",{"cl_type":"Key","bytes":"00989ca079a5E446071866331468AB949483162588D57ec13ba6BB051f1E15f8b7","parsed":{"Account":"account-hash-989Ca079A5E446071866331468Ab949483162588d57EC13BA6Bb051f1E15f8b7"}}],["token_ids",{"cl_type":{"List":"U256"},"bytes":"010000000168","parsed":""}]]}}}}'
                );
                const deploy = DeployUtil.deployFromJson(deployJson);
                if (deploy.ok) {
                  handleSignDeploy(signingKey, deploy.val);
                } else {
                  alert(deploy.val);
                }
              }}
            >
              Casper Studio
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const message =
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
                handleSignMessage(message, signingKey);
              }}
            >
              Message
            </Button>

            <div style={{ textAlign: 'center' }}>SIGNATURE REQUEST ERRORS</div>
            <Button
              variant="text"
              onClick={() => {
                const deploy = makeNativeTransferDeploy(
                  signingKey,
                  // recipientPublicKey was corrupted by changing last `c` char to `C`
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2Ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(signingKey, deploy);
              }}
            >
              Invalid Checksum
            </Button>
            <Button
              variant="text"
              onClick={() => {
                const pk =
                  '01ebf429a18b232b71df5759fe4e77dd05bf8ab3f2ccdcca50d0baa47d6ff27e02';
                const deploy = makeNativeTransferDeploy(
                  pk,
                  '0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca',
                  '2500000000',
                  '1234'
                );
                handleSignDeploy(pk, deploy);
              }}
            >
              Not approved
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
