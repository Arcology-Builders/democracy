import React, { Component } from "react";
import ReactDOM from "react-dom";
import Input from "./Input";

class FormContainer extends Component {
  constructor() {
    super();
    this.state = {
      title: ""
    };
  }
  render() {
    return (
      <form id="article-form">
      </form>
    );
  }
}
export default FormContainer;
