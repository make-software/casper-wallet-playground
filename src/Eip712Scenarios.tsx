import { Button } from '@mui/material';
import { useWalletService } from './wallet-service';
import {
  buildFloodRequest,
  EIP712_ERROR_SCENARIOS,
  EIP712_SUCCESS_SCENARIOS,
  Eip712Scenario,
  FLOOD_REQUEST_COUNT
} from './eip712-fixtures';
import { getSignTypedDataOutcome } from './sign-typed-data-outcome';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function Eip712Scenarios({ signingKey }: { signingKey: string }) {
  const { signTypedData, log } = useWalletService();

  const run = async (scenario: Eip712Scenario, key = signingKey) => {
    const signWith = scenario.signingKey ?? key;
    try {
      const params = scenario.build(signWith);
      console.info(`signTypedData: ${scenario.label}`, params);
      const res = await signTypedData(params, signWith);
      const outcome = getSignTypedDataOutcome(res);
      log(`signTypedData ${outcome.kind}: ${scenario.label}`, res);
      alert(
        outcome.kind === 'signed'
          ? 'Sign successful, see the log below'
          : outcome.kind === 'cancelled'
          ? `Sign cancelled${outcome.reason ? `: ${outcome.reason}` : ''}`
          : `Error: ${outcome.reason}`
      );
    } catch (e) {
      log(`signTypedData rejected: ${scenario.label}`, { error: errorMessage(e) });
      alert('Error: ' + errorMessage(e));
    }
  };

  const runWithPromptedKey = () => {
    const key = prompt('Enter signing public key hex');
    if (key) {
      void run(EIP712_SUCCESS_SCENARIOS[0], key);
    }
  };

  const flood = async () => {
    const results = await Promise.allSettled(
      Array.from({ length: FLOOD_REQUEST_COUNT }, () =>
        signTypedData(buildFloodRequest(), signingKey)
      )
    );
    const summary = results.map(r =>
      r.status === 'fulfilled'
        ? getSignTypedDataOutcome(r.value)
        : { kind: 'rejected', reason: errorMessage(r.reason) }
    );
    log(`signTypedData: ${FLOOD_REQUEST_COUNT} parallel requests`, summary);
  };

  const renderButton = (scenario: Eip712Scenario) => (
    <Button key={scenario.label} variant='text' onClick={() => run(scenario)}>
      {scenario.label}
    </Button>
  );

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        EIP-712 TYPED DATA SIGNATURE REQUEST SCENARIOS
      </div>
      {EIP712_SUCCESS_SCENARIOS.map(renderButton)}
      <Button variant='text' onClick={runWithPromptedKey}>
        TransferWithAuthorization (specify signing key)
      </Button>
      <div style={{ textAlign: 'center' }}>
        EIP-712 TYPED DATA SIGNATURE REQUEST ERRORS
      </div>
      {EIP712_ERROR_SCENARIOS.map(renderButton)}
      <Button variant='text' onClick={flood}>
        {FLOOD_REQUEST_COUNT} parallel requests (too many pending)
      </Button>
    </div>
  );
}
