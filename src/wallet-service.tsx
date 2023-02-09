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
  activePublicKey: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  switchAccount: () => Promise<boolean>;
  isConnected: () => Promise<boolean>;
  getActivePublicKey: () => Promise<string | undefined>;
  getVersion: () => Promise<string>;
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

    // subscribe to signer events
    window.addEventListener(CasperWalletEventTypes.Locked, handleLocked);
    window.addEventListener(CasperWalletEventTypes.Unlocked, handleUnlocked);
    window.addEventListener(
      CasperWalletEventTypes.TabChanged,
      handleTabChanged
    );
    window.addEventListener(CasperWalletEventTypes.Connected, handleConnected);
    window.addEventListener(
      CasperWalletEventTypes.Disconnected,
      handleDisconnected
    );
    window.addEventListener(
      CasperWalletEventTypes.ActiveKeyChanged,
      handleActiveKeyChanged
    );

    return () => {
      window.removeEventListener(CasperWalletEventTypes.Locked, handleLocked);
      window.removeEventListener(
        CasperWalletEventTypes.Unlocked,
        handleUnlocked
      );
      window.removeEventListener(
        CasperWalletEventTypes.TabChanged,
        handleTabChanged
      );
      window.removeEventListener(
        CasperWalletEventTypes.Connected,
        handleConnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.Disconnected,
        handleDisconnected
      );
      window.removeEventListener(
        CasperWalletEventTypes.ActiveKeyChanged,
        handleActiveKeyChanged
      );
    };
  }, [activePublicKey, setActivePublicKey, extensionLoaded]);

  const connect = async () => {
    return getCasperWalletInstance().requestConnection();
  };

  const disconnect = () => {
    setActivePublicKey(null);
    return getCasperWalletInstance().disconnectFromSite();
  };

  const switchAccount = () => {
    return getCasperWalletInstance().requestSwitchAccount();
  };

  const isConnected = async () => {
    return getCasperWalletInstance().isConnected();
  };

  const getActivePublicKey = async () => {
    return getCasperWalletInstance().getActivePublicKey();
  };

  const sign = async (deployJson: string, accountPublicKey: string) => {
    return getCasperWalletInstance().sign(deployJson, accountPublicKey);
  };

  const signMessage = async (message: string, accountPublicKey: string) => {
    return getCasperWalletInstance().signMessage(message, accountPublicKey);
  };

  const contextProps: WalletService = {
    logs,
    activePublicKey: activePublicKey,
    connect: connect,
    disconnect: disconnect,
    switchAccount: switchAccount,
    isConnected: isConnected,
    getActivePublicKey: getActivePublicKey,
    sign: sign,
    signMessage: signMessage,
    getVersion: getCasperWalletInstance().getVersion
  };

  return <WalletServiceContextProvider value={contextProps} {...props} />;
};

function handleError(err: unknown) {
  console.log(err);
}
