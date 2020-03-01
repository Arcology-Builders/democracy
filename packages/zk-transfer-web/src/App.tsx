import React, { useState, useEffect } from "react";

// @ts-ignore
// import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Homepage from './views/Home';
import MakeTransaction from './views/MakeTransaction';
import Democracy from './components/context/Democracy';
import { getScreenName, setScreenName, generateScreenName, getZkTokenName } from "./util";
import { makeApi } from "./libs/api";

type AppProp = {
  demo: any
};

type TokenMap = [string, Map<string, Object>];

const ZKNotes = new Map();
const ZKTokens = new Map();
function App({ demo } : AppProp) {
  const [state, setState] = useState({
    chainId: demo.chainId,
    screenName: '',
  });

  useEffect(() => {
    const { chainId } = state;

    if (!chainId) {
      demo.clientInit()
        .then(async () => {
          console.group('Client Initialized');
          const api = await makeApi(demo);
          //@ts-ignore
          window.api = api; window.demo = demo;
          api.thisAddressNotes
            .mapEntries(([address, map]: TokenMap, k:string) => {
              // not getting any notes here!
              const getHashNotes = (v: any) => v.get('zkNoteHash');
              ZKNotes.set(address, api.thisAddressNotes.get(address).map(getHashNotes));
            });
          api.zkTokens.forEach((v, tokenName) => {
            const shortTokenName = getZkTokenName(tokenName);
            const deployAddress = v.get('deployAddress');
            ZKTokens.set(shortTokenName, deployAddress);
          });
          console.info('ZkTokens', ZKTokens)
          console.info('ZkNotes', ZKNotes)
          console.groupEnd();
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
                  tokens={ZKTokens}
                  notes={ZKNotes}
                  screenName={state.screenName} />} />
              <Route exact path="/home" component={Homepage} />
            </Switch>
          </Router> 
      </div>
    </Democracy.Provider>
  );
}

export default App;
