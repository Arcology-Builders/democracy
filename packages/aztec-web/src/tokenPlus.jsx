import React, { Component, Suspense, Fragment } from 'react'
import { List, Map } from 'immutable'
import { assert } from 'chai'
import BN from 'bn.js'
import { Token } from './token'

export class TokenPlus extends Token {
  
  constructor(props) {
    super(props)
    this.state.plus = 'plus'
  }

  render() {
    const parentRender = super.render()  

    return (
      <div>
        {parentRender}
        <button>
          New Button
        </button>
      </div>
    )
  }
}
