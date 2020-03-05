import React, { useState, useEffect } from "react";

// @ts-ignore
// import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Homepage from './views/Home';
import MakeTransaction from './views/MakeTransaction';
import Democracy from './components/context/Democracy';
import { getScreenName, setScreenName, generateScreenName, getZkTokenName } from "./util";
import { makeApi } from "./libs/api";
import { Note } from "./libs/types";

type AppProp = {
  demo: any
};

function App({ demo } : AppProp) {
  const [state, setState] = useState({
    chainId: demo.chainId,
    screenName: "",
    ZKToken: new Map(),
  });

  useEffect(() => {
    const { chainId } = state;

    if (!chainId) {
      demo.clientInit()
        .then(async () => {
          console.groupCollapsed('Client Initialized');
          const api = await makeApi(demo);
          //@ts-ignore
          window.api = api; window.demo = demo;
          api.zkTokens.mapEntries(([tokenName, token]) => {
            const shortTokenName = getZkTokenName(tokenName);
            const tokenAddress: string = token.get("deployAddress");
            const getHashNotes = (v: Note) => v;
            const notes = api.thisAddressNotes
              .get(tokenAddress)
              .map(getHashNotes);

            state.ZKToken.set(shortTokenName, notes);
          });
          console.info(state.ZKToken);
          console.groupEnd();
          console.info("Fetch Tokens and Notes");
          const screenName = getScreenName(demo.chainId);

          if (!screenName) {
            const newScreenName = generateScreenName();
            setScreenName(newScreenName, demo.chainId);
            setState({ ...state, chainId: demo.chainId, screenName: newScreenName });
          } 
          else {
            setState({ ...state, chainId: demo.chainId, screenName: screenName });
          }
        });
    }
  });

  return (
    <Democracy.Provider value={demo}>
      <div className="App">
          <Router>
            <Switch>
              <Route exact path="/" render={() => 
                <MakeTransaction 
                  // @ts-ignore
                  tokens={state.ZKToken}
                  screenName={state.screenName} />} />
              <Route exact path="/home" component={Homepage} />
            </Switch>
          </Router> 
      </div>
    </Democracy.Provider>
  );
}

export default App;
