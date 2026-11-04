export type SignTypedDataOutcome =
  | { kind: 'signed' }
  | { kind: 'cancelled'; reason?: string }
  | { kind: 'failed'; reason: string };

/**
 * Classifies whatever `signTypedData` resolved with. Only a result carrying a signature counts as
 * signed: the wallet resolves, rather than rejects, with its error payload on invalid typed data.
 */
export function getSignTypedDataOutcome(res: unknown): SignTypedDataOutcome {
  const result =
    typeof res === 'object' && res !== null
      ? (res as Record<string, unknown>)
      : null;

  if (result?.cancelled === true) {
    const reason = [result.error, result.errorCode && `(${result.errorCode})`]
      .filter(Boolean)
      .join(' ');
    return reason ? { kind: 'cancelled', reason } : { kind: 'cancelled' };
  }

  if (typeof result?.signature === 'string' && result.signature) {
    return { kind: 'signed' };
  }

  const message = result?.message ?? result?.error;
  return {
    kind: 'failed',
    reason:
      typeof message === 'string' && message
        ? message
        : `Wallet returned no signature: ${JSON.stringify(res)}`
  };
}
