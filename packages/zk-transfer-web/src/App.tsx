import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Map } from "immutable";
import Homepage from "./views/Home";
import MakeTransaction from "./views/MakeTransaction";
import Democracy from "./components/context/Democracy";
import {
  getScreenName,
  setScreenName,
  generateScreenName,
  getZKTradeSymbol
} from "./util";
import { makeApi } from "./libs/api";
import { Note, TokenAddress } from "./libs/types";
import { makeMint } from "./libs/txHelpers";

type AppProp = {
  demo: any;
};

function App({ demo }: AppProp) {
  const [state, setState]: [any, any] = useState({
    chainId: null,
    screenName: "",
    ZKTokens: Map()
  });

  useEffect(() => {
    if (!state.chainId)
      demo.clientInit().then(async () => {
        console.groupCollapsed("Client Initialized");
        const { zkTokens, thisAddressNotes, bm } = await makeApi(demo);
        const tradeSymbolToNotes = zkTokens.mapEntries(([tokenName, token]) => {
          const tradeSymbol = getZKTradeSymbol(tokenName);
          const tokenAddress: TokenAddress = token.get("deployAddress");
          const getHashNotes = (v: Note) => v;
          const notes = thisAddressNotes.get(tokenAddress)?.map(getHashNotes);
          
          makeMint(demo)({ bm, tradeSymbol: 'AAA', amount: 5 })
            .catch((err) => {
              console.log('Minting failed:', err)
            })

          return [tradeSymbol, notes];
        })

        console.info("Fetched Tokens and Notes");

        let screenName = getScreenName(demo.chainId);
        if (!screenName) {
          const newScreenName = generateScreenName();
          setScreenName(newScreenName, demo.chainId);
          screenName = newScreenName;
        }

        setState({
          ...state,
          ZKTokens: tradeSymbolToNotes,
          chainId: demo.chainId,
          screenName
        });
        console.groupEnd();
      });
  });

  return (
    <Democracy.Provider value={demo}>
      <div className="App">
        <Router>
          <Switch>
            <Route
              exact
              path="/"
              render={() => (
                <MakeTransaction
                  tokens={state.ZKTokens}
                  screenName={state.screenName}
                />
              )}
            />
            <Route exact path="/home" component={Homepage} />
          </Switch>
        </Router>
      </div>
    </Democracy.Provider>
  );
}

export default App;
