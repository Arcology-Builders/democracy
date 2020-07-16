import React from "react";
import { Map } from "immutable";
import { useStage } from "./useStage";
import { useScreenName } from './useScreeName';
import { makeApi } from "../libs/api";
import { getZKTradeSymbol } from "../util";
import { recipients, transactions } from '../libs/mocks'
import { Note, TokenAddress, Demo, TransactionLog, ZkToken } from "../libs/types";
// import {
//   FAKE_RECEIVER_ADDRESS,
//   FAKE_RECEIVER_PUBLIC_KEY,
// } from "../libs/constants";
// import { doCX } from "../libs/txHelpers";

type User = {
  name: string;
  image: string;
};
type dispatchProp = { type: string; payload: any }
type DemoCtxStateProps = {
  recipients: User[];
  sending: boolean;
  screenName?: string;
  ZKTokens: Map<string, ZkToken>;
  demo: Demo | null;
  transactions: TransactionLog[];
};

const initial_state: DemoCtxStateProps = {
	demo: null,
	sending: false,
	recipients,
	transactions,
	screenName: "",
	ZKTokens: Map(),
}


const storeCtx = React.createContext(initial_state);
const dispatchCtx = React.createContext((a: dispatchProp) => {});

const reducer = (state: DemoCtxStateProps, action: any) : DemoCtxStateProps => {
	switch (action.type) {
		case "INITIALIZED":
			return { ...state, ...action.payload }

		case 'SENDING':
			return { ...state, sending: action.payload }

		case 'SET_DEMO':
			return { ...state, demo: action.payload }
	}

	return { ...state }
}

export const useDemo = () : {
	sendTo: Function;
} => {
  const dispatch = useDispatch();
  const { setStage } = useStage();
  // const makeCX = doCX(demo);

  const sendTo = (user: User) => () => {
    console.log("Sending to " + user.name);

    dispatch({ type: 'SENDING', payload: true });
    // makeCX({
    //   recipient: Map({
    //     address: FAKE_RECEIVER_ADDRESS,
    //     publicKey: FAKE_RECEIVER_PUBLIC_KEY,
    //   }),
    //   ...state.txData,
    // });

    setTimeout(() => {
      setStage(3);
      dispatch({ type: 'SENDING', payload: false });
    }, 3000);
  };

  return { sendTo };
};

export const useInitDemo = () => {
	const dispatch = useDispatch();
	const { demo } = useStore();
	const [initialized, setInitalized] = React.useState(false);
	const { getScreenNameOrCreateNew } = useScreenName();

	React.useEffect(() => {
		if (!initialized && demo) {
			setInitalized(true)
			demo?.clientInit().then(async () => {
		    console.groupCollapsed("Client Initialization");
		    const { zkTokens, thisAddressNotes, bm } = await makeApi(demo);
		    demo.bm = bm;

		    console.info("Fetching Tokens and Notes");
		    const tradeSymbolToNotes = zkTokens.mapEntries(([tokenName, token]) => {
		      const tradeSymbol = getZKTradeSymbol(tokenName);
		      const tokenAddress: TokenAddress = token.get("deployAddress");
		      const getHashNotes = (v: Note) => v;
		      const notes = thisAddressNotes.get(tokenAddress)?.map(getHashNotes);
		      return [tradeSymbol, notes];
		    });
		    
		    console.info("Fetched Tokens and Notes");
		    dispatch({
		    	type: "INITIALIZED",
			    payload: {
			      ZKTokens: tradeSymbolToNotes,
			      screenName: getScreenNameOrCreateNew(demo.chainId)
			  	}
		    });
		    console.groupEnd();
		  }).catch((err: Error) => console.error('Initialization Failed.', err))
		}
	}, [demo, dispatch, getScreenNameOrCreateNew, initialized])
}

export const Provider = ({ value, children }: { children: any, value: DemoCtxStateProps }) => {
	const [store, dispatch] = React.useReducer(reducer, initial_state);

	React.useEffect(() => {
		dispatch({ type: 'SET_DEMO', payload: value })
	}, [value])

	return (
		<dispatchCtx.Provider value={dispatch}>
			<storeCtx.Provider value={store}>
				{ children }
			</storeCtx.Provider>
		</dispatchCtx.Provider>
	)
}

export const useDispatch = () => React.useContext(dispatchCtx)

export const useStore = () => React.useContext(storeCtx)

