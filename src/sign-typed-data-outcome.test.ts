import { getSignTypedDataOutcome } from './sign-typed-data-outcome';

describe('getSignTypedDataOutcome', () => {
  it('reports a signed result', () => {
    expect(
      getSignTypedDataOutcome({
        cancelled: false,
        signature: '0xabc',
        digest: '0xdef',
        publicKey: '01aa',
        error: null
      })
    ).toEqual({ kind: 'signed' });
  });

  it('reports a cancellation with its reason', () => {
    expect(
      getSignTypedDataOutcome({
        cancelled: true,
        signature: null,
        digest: null,
        publicKey: null,
        error: 'Too many pending requests',
        errorCode: 'TOO_MANY_PENDING_REQUESTS'
      })
    ).toEqual({
      kind: 'cancelled',
      reason: 'Too many pending requests (TOO_MANY_PENDING_REQUESTS)'
    });
  });

  it('reports a failure when the wallet resolves with an error payload', () => {
    expect(getSignTypedDataOutcome({})).toEqual({
      kind: 'failed',
      reason: 'Wallet returned no signature: {}'
    });
  });

  it('reports a failure carrying the error message when one is present', () => {
    expect(
      getSignTypedDataOutcome({ message: 'Invalid typed data. Unknown field' })
    ).toEqual({ kind: 'failed', reason: 'Invalid typed data. Unknown field' });
  });

  it('reports a failure for a non-object result', () => {
    expect(getSignTypedDataOutcome(undefined)).toEqual({
      kind: 'failed',
      reason: 'Wallet returned no signature: undefined'
    });
  });
});
