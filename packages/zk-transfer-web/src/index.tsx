import React from "react";
import ReactDOM from "react-dom";
import "./styles/app.css";
import App from "./App";
import Offline from "./components/Offline";
import { Provider } from './hooks/useDemo';
import * as serviceWorker from "./serviceWorker";

document.addEventListener("DOMContentLoaded", async () => {
  const { demo }: any = window;

  const Component = demo ? <Provider value={demo}> <App /> </Provider>: <Offline />;

  ReactDOM.render(Component, document.getElementById("root"));
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
