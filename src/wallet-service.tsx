import { CasperServiceByJsonRPC } from 'casper-js-sdk';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

let CasperWalletEventTypes;
type CasperWalletState = {
  isLocked: boolean;
  isConnected: boolean;
  activeKey: string | null;
};

let casperWalletInstance;
const getCasperWalletInstance = () => {
  try {
    if (casperWalletInstance == null) {
      casperWalletInstance = (window as any).CasperWalletProvider();
    }
    return casperWalletInstance;
  } catch (err) {}
  throw Error('Please install the Casper Wallet Extension.');
};

const WALLET_STORAGE_KEY = 'cspr-redux-wallet-sync';
type WalletStorageState = {
  publicKey: string | null;
};

const GRPC_URL = 'https://casper-node-proxy.dev.make.services/rpc';
export let casperService = new CasperServiceByJsonRPC(GRPC_URL);

type WalletService = {
  logs: [string, object][];
  log: (msg: string, payload?: any) => void;
  activePublicKey: string | null;
  connect: () => Promise<boolean>;
  switchAccount: () => Promise<boolean>;
  sign: (
    deployJson: string,
    accountPublicKey: string
  ) => Promise<
    { cancelled: true } | { cancelled: false; signature: Uint8Array }
  >;
  signMessage: (
    message: string,
    accountPublicKey: string
  ) => Promise<
    { cancelled: true } | { cancelled: false; signature: Uint8Array }
  >;
  disconnect: () => Promise<boolean>;
  isConnected: () => Promise<boolean>;
  getActivePublicKey: () => Promise<string | undefined>;
  getVersion: () => Promise<string>;
};

export const walletServiceContext = createContext<WalletService>({} as any);

const { Provider: WalletServiceContextProvider } = walletServiceContext;

export const useWalletService = () => {
  return useContext(walletServiceContext);
};

export const WalletServiceProvider = props => {
  const [logs, setLogs] = useState<[string, object][]>([]);
  const log = (msg: string, payload?: any) =>
    setLogs(state => [[msg, payload], ...state]);

  const [counter, setCounter] = useState(0);
  const [extensionLoaded, setExtensionLoaded] = useState(false);

  useEffect(() => {
    let timer;
    if ((window as any).CasperWalletEventTypes != null) {
      CasperWalletEventTypes = (window as any).CasperWalletEventTypes;
      setExtensionLoaded(true);
      clearTimeout(timer);
    } else {
      timer = setTimeout(() => {
        setCounter(i => (i = 1));
      }, 500);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [counter]);

  const [activePublicKey, _setActivePublicKey] = useState<null | string>(() => {
    const state: WalletStorageState | null = JSON.parse(
      localStorage.getItem(WALLET_STORAGE_KEY) || 'null'
    );
    return state?.publicKey || null;
  });

  const setActivePublicKey = useCallback((key: string | null) => {
    _setActivePublicKey(key);
    localStorage.setItem(
      WALLET_STORAGE_KEY,
      JSON.stringify({
        publicKey: key
      } as WalletStorageState)
    );
  }, []);

  // WALLET SUBSCRIPTIONS
  useEffect(() => {
    if (extensionLoaded === false) {
      return;
    }

    const handleConnected = (event: any) => {
      log('event:connected', event.detail);
      try {
        const action: CasperWalletState = JSON.parse(event.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        }
      } catch (err) {
        handleError(err);
      }
    };

    const handleActiveKeyChanged = (event: any) => {
      log('event:activeKeyChanged', event.detail);
      try {
        const state: CasperWalletState = JSON.parse(event.detail);
        if (state.activeKey) {
          setActivePublicKey(state.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        handleError(err);
      }
    };

    const handleDisconnected = (event: any) => {
      log('event:disconnected', event.detail);
      try {
        if (activePublicKey) {
          setActivePublicKey(null);
        }
      } catch (err) {
        handleError(err);
      }
    };

    const handleTabChanged = (event: any) => {
      log('event:tabChanged', event.detail);
      try {
        const action: CasperWalletState = JSON.parse(event.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        handleError(err);
      }
    };

    const handleLocked = (event: any) => {
      log('event:locked', event.detail);
      try {
        // const action: WalletState = JSON.parse(msg.detail);
        // TODO: diplay locked label
      } catch (err) {
        handleError(err);
      }
    };

    const handleUnlocked = (event: any) => {
      log('event:unlocked', event.detail);
      try {
        const action: CasperWalletState = JSON.parse(event.detail);
        if (action.activeKey) {
          setActivePublicKey(action.activeKey);
        } else {
          setActivePublicKey(null);
        }
      } catch (err) {
        handleError(err);
      }
    };

    // subscribe to signer events
    window.addEventListener(CasperWalletEventTypes.Connected, handleConnected);
    window.addEventListener(
      CasperWalletEventTypes.ActiveKeyChanged,
      handleActiveKeyChanged
    );
    window.addEventListener(
      CasperWalletEventTypes.Disconnected,
      handleDisconnected
    );
    window.addEventListener(
      CasperWalletEventTypes.TabChanged,
      handleTabChanged
    );
    window.addEventListener(CasperWalletEventTypes.Locked, handleLocked);
    window.addEventListener(CasperWalletEventTypes.Unlocked, handleUnlocked);

    return () => {
      window.removeEventListener(
        CasperWalletEventTypes.Connected,
        handleConnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.ActiveKeyChanged,
        handleActiveKeyChanged
      );
      window.removeEventListener(
        CasperWalletEventTypes.Disconnected,
        handleDisconnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.TabChanged,
        handleTabChanged
      );
      window.removeEventListener(CasperWalletEventTypes.Locked, handleLocked);
      window.removeEventListener(
        CasperWalletEventTypes.Unlocked,
        handleUnlocked
      );
    };
  }, [activePublicKey, setActivePublicKey, extensionLoaded]);

  const connect = async () => {
    return getCasperWalletInstance()
      .requestConnection()
      .then(res => log(`Connected response: ${res}`));
  };

  const switchAccount = () => {
    return getCasperWalletInstance()
      .requestSwitchAccount()
      .then(res => log(`Switch response: ${res}`));
  };

  const sign = async (deployJson: string, accountPublicKey: string) => {
    return getCasperWalletInstance().sign(deployJson, accountPublicKey);
  };

  const signMessage = async (message: string, accountPublicKey: string) => {
    return getCasperWalletInstance().signMessage(message, accountPublicKey);
  };

  const disconnect = () => {
    setActivePublicKey(null);
    return getCasperWalletInstance()
      .disconnectFromSite()
      .then(res => log(`Disconnected response: ${res}`));
  };

  const isConnected = async () => {
    return getCasperWalletInstance().isConnected();
  };

  const getActivePublicKey = async () => {
    return getCasperWalletInstance().getActivePublicKey();
  };

  const contextProps: WalletService = {
    logs,
    log,
    activePublicKey: activePublicKey,
    connect: connect,
    switchAccount: switchAccount,
    sign: sign,
    signMessage: signMessage,
    disconnect: disconnect,
    isConnected: isConnected,
    getActivePublicKey: getActivePublicKey,
    getVersion: getCasperWalletInstance().getVersion
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};

function handleError(err: unknown) {
  console.log(err);
}
