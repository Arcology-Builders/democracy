import React from "react";
import ReactDOM from "react-dom";
import "./styles/app.css";
import "./styles/tailwind.min.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

document.addEventListener('DOMContentLoaded', async () => {
    const { demo } : any = window;

    await demo.initFS({})
    await demo.init({ unlockSeconds: 100000 }) // keep unlocked as long as we cache password
    await demo.prepareCachedWallet({})
    await demo.prepareErasePassword({
        erasePasswordSeconds: 100000, // 100,000 seconds is 27.77 hours
        erasePasswordCallback: () => { console.log("Erasing password") },
    })
    await demo.prepareUpdateWhileCached({
        updateSeconds: 10,
        updateCallback: (secondsLeft: number) => { console.log(`${secondsLeft} seconds left`) },
    })
    console.log('Before rendering', demo);

    ReactDOM.render(<App demo={demo}/>, document.getElementById("root"));
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
