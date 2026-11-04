import { PublicKey } from 'casper-js-sdk';
import type { SignTypedDataParams } from './wallet-service';

type TypedDataField = { name: string; type: string };

type Types = Record<string, TypedDataField[]>;
type Message = Record<string, unknown>;

export type Eip712Scenario = {
  label: string;
  /** Called on click, so nonces and deadlines are fresh for every request. */
  build: (signingKey: string) => SignTypedDataParams;
  /** Signs with this key instead of the active one. */
  signingKey?: string;
};

const CHAIN_NAME = 'casper:casper-test';
const PERMIT2_PACKAGE_HASH =
  '8058e3c16943bd9eadefbd2b4d4fb1e32ce118e492e179c42e14ed3f71d5601d';
const WCSPR_PACKAGE_HASH =
  '3d80df21ba4ee4d66a2a1f60c32570dd5685e4b279f6538162a5fd1314847c1e';
const CEP18_PACKAGE_HASH =
  '7fd113f60890c8ea77daf90880852f544b618c62315bcfd2dd93304c389fa19d';
const SPENDER =
  '0081d557c9dcaadea97c34d79bf7b6af07aa9d760e5dd1aabf78a45fb39e072c3a';
const RECIPIENT_PUBLIC_KEY =
  '020329169b6c9e632fbeca5677fcad1bb48b87cd80500202911b933c16fa1d107e2e';
const NOT_CONNECTED_PUBLIC_KEY =
  '01ebf429a18b232b71df5759fe4e77dd05bf8ab3f2ccdcca50d0baa47d6ff27e02';

const MAX_UINT48 = '0x' + 'ff'.repeat(6);
const MAX_UINT160 = '0x' + 'ff'.repeat(20);
const MAX_UINT256 = '0x' + 'ff'.repeat(32);
const MAX_ARRAY_LENGTH = 64;

const CASPER_DOMAIN_TYPES: TypedDataField[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chain_name', type: 'string' },
  { name: 'contract_package_hash', type: 'bytes32' }
];

/** Casper address encoding: `00` + account hash, `01` + package hash. */
function accountAddress(publicKeyHex: string): string {
  const hash = PublicKey.fromHex(publicKeyHex).accountHash().toHex();
  return '00' + hash.replace('account-hash-', '');
}

const packageAddress = (packageHash: string) => '01' + packageHash;

function randomBytes32(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const inOneHour = () => String(nowSeconds() + 60 * 60);

function domain(
  name: string,
  version: string,
  packageHash: string
): Record<string, unknown> {
  return {
    name,
    version,
    chain_name: CHAIN_NAME,
    contract_package_hash: packageHash
  };
}

const permit2Domain = () => domain('Permit2', '1', PERMIT2_PACKAGE_HASH);
const wcsprDomain = () => domain('Wrapped CSPR', '1', WCSPR_PACKAGE_HASH);

function request(
  typedDomain: Record<string, unknown>,
  types: Types,
  primaryType: string,
  message: Message,
  options: SignTypedDataParams['options'] = {}
): SignTypedDataParams {
  return {
    typedData: { domain: typedDomain, types, primaryType, message },
    options: { returnHashArtifacts: true, ...options }
  };
}

// CEP-3009 / CEP-2612 token authorizations, signed against the token's own domain.

const AUTHORIZATION_FIELDS: TypedDataField[] = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' },
  { name: 'validBefore', type: 'uint256' },
  { name: 'nonce', type: 'bytes32' }
];

const PERMIT_FIELDS: TypedDataField[] = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }
];

function authorization(
  primaryType: 'TransferWithAuthorization' | 'ReceiveWithAuthorization',
  signingKey: string,
  validAfter = String(nowSeconds()),
  validBefore = inOneHour()
) {
  return request(
    wcsprDomain(),
    { [primaryType]: AUTHORIZATION_FIELDS },
    primaryType,
    {
      from: accountAddress(signingKey),
      to: SPENDER,
      value: '7500000000',
      validAfter,
      validBefore,
      nonce: randomBytes32()
    }
  );
}

// Permit2, mirroring CasperWalletCore's `src/__test-utils__/permit2.ts`.

const PERMIT2_TYPES: Types = {
  PermitTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ],
  PermitBatchTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions[]' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ],
  PermitWitnessTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'witness', type: 'ExampleWitness' }
  ],
  PermitBatchWitnessTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions[]' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'witness', type: 'ExampleWitness' }
  ],
  PermitSingle: [
    { name: 'details', type: 'PermitDetails' },
    { name: 'spender', type: 'address' },
    { name: 'sigDeadline', type: 'uint256' }
  ],
  PermitBatch: [
    { name: 'details', type: 'PermitDetails[]' },
    { name: 'spender', type: 'address' },
    { name: 'sigDeadline', type: 'uint256' }
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  PermitDetails: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint160' },
    { name: 'expiration', type: 'uint48' },
    { name: 'nonce', type: 'uint48' }
  ],
  ExampleWitness: [
    { name: 'recipient', type: 'address' },
    { name: 'orderId', type: 'bytes32' }
  ]
};

const PERMIT2_PRIMARY_TYPES = [
  'PermitTransferFrom',
  'PermitBatchTransferFrom',
  'PermitWitnessTransferFrom',
  'PermitBatchWitnessTransferFrom',
  'PermitSingle',
  'PermitBatch'
] as const;

type Permit2PrimaryType = typeof PERMIT2_PRIMARY_TYPES[number];

type Permit2Addresses = {
  tokenA: string;
  tokenB: string;
  spender: string;
  recipient: string;
};

const casperAddresses = (): Permit2Addresses => ({
  tokenA: packageAddress(WCSPR_PACKAGE_HASH),
  tokenB: packageAddress(CEP18_PACKAGE_HASH),
  spender: SPENDER,
  recipient: accountAddress(RECIPIENT_PUBLIC_KEY)
});

const evmStyleAddresses = (): Permit2Addresses => ({
  tokenA: '0x' + '01'.repeat(20),
  tokenB: '0x' + '03'.repeat(20),
  spender: '0x' + '02'.repeat(20),
  recipient: '0x' + '0a'.repeat(20)
});

function reachableTypes(primaryType: string, types: Types = PERMIT2_TYPES) {
  const out: Types = {};
  const visit = (name: string) => {
    if (out[name] || !types[name]) {
      return;
    }
    out[name] = types[name];
    types[name].forEach(({ type }) => visit(type.replace(/\[\d*\]$/, '')));
  };
  visit(primaryType);
  return out;
}

function permit2Message(
  primaryType: Permit2PrimaryType,
  addresses: Permit2Addresses = casperAddresses()
): Message {
  const deadline = inOneHour();
  const permission = (token: string, amount: string) => ({ token, amount });
  const detail = (token: string, amount: string, nonce: string) => ({
    token,
    amount,
    expiration: deadline,
    nonce
  });
  const permissions = [
    permission(addresses.tokenA, '1000'),
    permission(addresses.tokenB, '0x03e9')
  ];
  const witness = { recipient: addresses.recipient, orderId: randomBytes32() };
  const common = { spender: addresses.spender, nonce: randomBytes32(), deadline };

  switch (primaryType) {
    case 'PermitTransferFrom':
      return { permitted: permissions[0], ...common };
    case 'PermitBatchTransferFrom':
      return { permitted: permissions, ...common };
    case 'PermitWitnessTransferFrom':
      return { permitted: permissions[0], ...common, witness };
    case 'PermitBatchWitnessTransferFrom':
      return { permitted: permissions, ...common, witness };
    case 'PermitSingle':
      return {
        details: detail(addresses.tokenA, '1000', '0'),
        spender: addresses.spender,
        sigDeadline: deadline
      };
    case 'PermitBatch':
      return {
        details: [
          detail(addresses.tokenA, '1000', '0'),
          detail(addresses.tokenB, '0x03e9', '1')
        ],
        spender: addresses.spender,
        sigDeadline: deadline
      };
  }
}

function permit2(
  primaryType: Permit2PrimaryType,
  message: Message = permit2Message(primaryType),
  types: Types = reachableTypes(primaryType),
  options?: SignTypedDataParams['options']
) {
  return request(permit2Domain(), types, primaryType, message, options);
}

function permit2Scenario(primaryType: Permit2PrimaryType): Eip712Scenario {
  return { label: primaryType, build: () => permit2(primaryType) };
}

const tokenPermissions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    token: packageAddress(WCSPR_PACKAGE_HASH),
    amount: String(1000 + i)
  }));

const permitDetails = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    token: packageAddress(WCSPR_PACKAGE_HASH),
    amount: String(1000 + i),
    expiration: inOneHour(),
    nonce: String(i)
  }));

/** `Level0` → … → `Level{depth}`, a chain of `depth` struct edges. */
function nestedTypes(depth: number): { types: Types; message: Message } {
  const types: Types = { [`Level${depth}`]: [{ name: 'value', type: 'uint256' }] };
  let message: Message = { value: '1' };
  for (let level = depth - 1; level >= 0; level--) {
    types[`Level${level}`] = [
      { name: 'label', type: 'string' },
      { name: 'child', type: `Level${level + 1}` }
    ];
    message = { label: `level ${level}`, child: message };
  }
  return { types, message };
}

const CUSTOM_ORDER_TYPES: Types = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'isBuy', type: 'bool' },
    { name: 'price', type: 'int256' },
    { name: 'quantity', type: 'uint64' },
    { name: 'memo', type: 'string' },
    { name: 'payload', type: 'bytes' },
    { name: 'tags', type: 'string[]' },
    { name: 'fill', type: 'Fill' }
  ],
  Fill: [
    { name: 'taker', type: 'address' },
    { name: 'deadline', type: 'uint256' }
  ]
};

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';

export const EIP712_SUCCESS_SCENARIOS: Eip712Scenario[] = [
  {
    label: 'TransferWithAuthorization (CEP-3009, x402)',
    build: key => authorization('TransferWithAuthorization', key)
  },
  {
    label: 'ReceiveWithAuthorization',
    build: key => authorization('ReceiveWithAuthorization', key)
  },
  {
    label: 'Permit (CEP-2612)',
    build: key =>
      request(wcsprDomain(), { Permit: PERMIT_FIELDS }, 'Permit', {
        owner: accountAddress(key),
        spender: SPENDER,
        value: '2500000000',
        nonce: '0',
        deadline: inOneHour()
      })
  },
  ...PERMIT2_PRIMARY_TYPES.map(permit2Scenario),
  {
    label: 'PermitSingle: unlimited, never expires',
    build: () =>
      permit2('PermitSingle', {
        details: {
          token: packageAddress(WCSPR_PACKAGE_HASH),
          amount: MAX_UINT160,
          expiration: MAX_UINT48,
          nonce: '0'
        },
        spender: SPENDER,
        sigDeadline: MAX_UINT256
      })
  },
  {
    label: 'PermitSingle: expiration 0',
    build: () => {
      const message = permit2Message('PermitSingle');
      return permit2('PermitSingle', {
        ...message,
        details: { ...(message.details as Message), expiration: '0' }
      });
    }
  },
  {
    label: 'PermitTransferFrom: expired deadline',
    build: () =>
      permit2('PermitTransferFrom', {
        ...permit2Message('PermitTransferFrom'),
        deadline: String(nowSeconds() - 24 * 60 * 60)
      })
  },
  {
    label: 'PermitWitnessTransferFrom: 20-byte addresses',
    build: () =>
      permit2(
        'PermitWitnessTransferFrom',
        permit2Message('PermitWitnessTransferFrom', evmStyleAddresses())
      )
  },
  {
    label: `PermitBatchTransferFrom: ${MAX_ARRAY_LENGTH} tokens (max array)`,
    build: () =>
      permit2('PermitBatchTransferFrom', {
        ...permit2Message('PermitBatchTransferFrom'),
        permitted: tokenPermissions(MAX_ARRAY_LENGTH)
      })
  },
  {
    label: 'PermitBatchTransferFrom: empty array',
    build: () =>
      permit2('PermitBatchTransferFrom', {
        ...permit2Message('PermitBatchTransferFrom'),
        permitted: []
      })
  },
  {
    label: 'TransferWithAuthorization: timestamps in ms',
    build: key =>
      authorization(
        'TransferWithAuthorization',
        key,
        String(Date.now()),
        String(Date.now() + 60 * 60 * 1000)
      )
  },
  {
    label: 'Custom type (generic rendering)',
    build: key =>
      request(
        domain('Example DEX', '2', CEP18_PACKAGE_HASH),
        CUSTOM_ORDER_TYPES,
        'Order',
        {
          maker: accountAddress(key),
          isBuy: true,
          price: '123456789',
          quantity: '42',
          memo: 'Limit order',
          payload: '0xdeadbeef',
          tags: ['limit', 'gtc'],
          fill: { taker: SPENDER, deadline: inOneHour() }
        }
      )
  },
  {
    label: 'Long string and bytes values',
    build: key =>
      request(
        domain('Mail', '1', CEP18_PACKAGE_HASH),
        {
          Mail: [
            { name: 'to', type: 'address' },
            { name: 'subject', type: 'string' },
            { name: 'body', type: 'string' },
            { name: 'attachment', type: 'bytes' }
          ]
        },
        'Mail',
        {
          to: accountAddress(key),
          subject: 'A_subject_without_spaces_'.repeat(8),
          body: LOREM.repeat(12),
          attachment: '0x' + 'ab'.repeat(512)
        }
      )
  },
  {
    label: 'Struct nesting depth 4 (max)',
    build: () => {
      const { types, message } = nestedTypes(4);
      return request(
        domain('Nested', '1', CEP18_PACKAGE_HASH),
        types,
        'Level0',
        message
      );
    }
  },
  {
    label: 'types.EIP712Domain included',
    build: () =>
      permit2('PermitTransferFrom', undefined, {
        EIP712Domain: CASPER_DOMAIN_TYPES,
        ...reachableTypes('PermitTransferFrom')
      })
  },
  {
    label: 'options.domainTypes set',
    build: () =>
      permit2('PermitTransferFrom', undefined, undefined, {
        domainTypes: CASPER_DOMAIN_TYPES
      })
  },
  {
    label: 'Without hash artifacts',
    build: () =>
      permit2('PermitTransferFrom', undefined, undefined, {
        returnHashArtifacts: false
      })
  }
];

/** Each one breaks a single rule; the wallet should reject it without a signature. */
export const EIP712_ERROR_SCENARIOS: Eip712Scenario[] = [
  {
    label: 'Unknown top-level field',
    build: () =>
      permit2('PermitTransferFrom', {
        ...permit2Message('PermitTransferFrom'),
        extra: 'not declared'
      })
  },
  {
    label: 'Unknown nested field',
    build: () => {
      const message = permit2Message('PermitTransferFrom');
      return permit2('PermitTransferFrom', {
        ...message,
        permitted: { ...(message.permitted as Message), extra: 'not declared' }
      });
    }
  },
  {
    label: 'Missing field',
    build: () => {
      const { deadline, ...message } = permit2Message('PermitTransferFrom');
      return permit2('PermitTransferFrom', message);
    }
  },
  {
    label: 'uint48 out of range',
    build: () => {
      const message = permit2Message('PermitSingle');
      return permit2('PermitSingle', {
        ...message,
        details: {
          ...(message.details as Message),
          expiration: '0x01000000000000'
        }
      });
    }
  },
  {
    label: 'Negative uint',
    build: () =>
      permit2('PermitTransferFrom', {
        ...permit2Message('PermitTransferFrom'),
        deadline: '-1'
      })
  },
  {
    label: 'Odd-length hex address',
    build: () =>
      permit2('PermitTransferFrom', {
        ...permit2Message('PermitTransferFrom'),
        spender: '0x123'
      })
  },
  {
    label: 'Address of 21 bytes',
    build: () =>
      permit2('PermitTransferFrom', {
        ...permit2Message('PermitTransferFrom'),
        spender: '0x' + '02'.repeat(21)
      })
  },
  {
    label: 'bytes16 type',
    build: () =>
      request(
        domain('Unsupported', '1', CEP18_PACKAGE_HASH),
        { Data: [{ name: 'id', type: 'bytes16' }] },
        'Data',
        { id: '0x' + 'ab'.repeat(16) }
      )
  },
  {
    label: 'Unknown field type',
    build: () =>
      request(
        domain('Unsupported', '1', CEP18_PACKAGE_HASH),
        { Data: [{ name: 'ratio', type: 'float' }] },
        'Data',
        { ratio: '1.5' }
      )
  },
  {
    label: 'Recursive type',
    build: () =>
      request(
        domain('Recursive', '1', CEP18_PACKAGE_HASH),
        {
          Node: [
            { name: 'value', type: 'uint256' },
            { name: 'next', type: 'Node' }
          ]
        },
        'Node',
        { value: '1', next: { value: '2', next: { value: '3' } } }
      )
  },
  {
    label: 'Struct nesting depth 5',
    build: () => {
      const { types, message } = nestedTypes(5);
      return request(
        domain('Nested', '1', CEP18_PACKAGE_HASH),
        types,
        'Level0',
        message
      );
    }
  },
  {
    label: `Array of ${MAX_ARRAY_LENGTH + 1} entries`,
    build: () =>
      permit2('PermitBatchTransferFrom', {
        ...permit2Message('PermitBatchTransferFrom'),
        permitted: tokenPermissions(MAX_ARRAY_LENGTH + 1)
      })
  },
  {
    label: 'More than 256 displayed rows',
    build: () =>
      permit2('PermitBatch', {
        ...permit2Message('PermitBatch'),
        details: permitDetails(MAX_ARRAY_LENGTH)
      })
  },
  {
    label: 'Fixed-size array length mismatch',
    build: () =>
      permit2(
        'PermitBatchTransferFrom',
        {
          ...permit2Message('PermitBatchTransferFrom'),
          permitted: tokenPermissions(3)
        },
        {
          ...reachableTypes('PermitBatchTransferFrom'),
          PermitBatchTransferFrom: PERMIT2_TYPES.PermitBatchTransferFrom.map(
            field =>
              field.name === 'permitted'
                ? { ...field, type: 'TokenPermissions[2]' }
                : field
          )
        }
      )
  },
  {
    label: 'Primary type not in types',
    build: () =>
      request(
        permit2Domain(),
        reachableTypes('PermitTransferFrom'),
        'PermitSomething',
        permit2Message('PermitTransferFrom')
      )
  },
  {
    label: 'Non-Casper domain field',
    build: () =>
      request(
        { ...permit2Domain(), verifyingContract: '0x' + '01'.repeat(20) },
        reachableTypes('PermitTransferFrom'),
        'PermitTransferFrom',
        permit2Message('PermitTransferFrom')
      )
  },
  {
    label: 'Missing domain field',
    build: () => {
      const { contract_package_hash, ...partialDomain } = permit2Domain();
      return request(
        partialDomain,
        reachableTypes('PermitTransferFrom'),
        'PermitTransferFrom',
        permit2Message('PermitTransferFrom')
      );
    }
  },
  {
    label: 'Unknown chain_name',
    build: () =>
      request(
        { ...permit2Domain(), chain_name: 'eip155:1' },
        reachableTypes('PermitTransferFrom'),
        'PermitTransferFrom',
        permit2Message('PermitTransferFrom')
      )
  },
  {
    label: 'Mismatched options.domainTypes',
    build: () =>
      permit2('PermitTransferFrom', undefined, undefined, {
        domainTypes: CASPER_DOMAIN_TYPES.slice(0, 3)
      })
  },
  {
    label: 'Signing key not connected',
    signingKey: NOT_CONNECTED_PUBLIC_KEY,
    build: () => permit2('PermitTransferFrom')
  }
];

/** Above the wallet's pending-payload cap, so the surplus is refused with `TOO_MANY_PENDING_REQUESTS`. */
export const FLOOD_REQUEST_COUNT = 12;

export const buildFloodRequest = () => permit2('PermitTransferFrom');
