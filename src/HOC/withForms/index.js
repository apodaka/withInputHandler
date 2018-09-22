import React, { Component } from "react";
import { withHandlers, withStateHandlers, compose } from "recompose";

const form = {
  text: ["nombre", { required: true }]
};
export const withForms = (params = form) => WrappedComponent => {
  /*const handlers = (prm) => {
    return {
      registerInput: (state, props) => {
        return undefined;
      },
    };
  };*/

  /*
  const initState = (props) => {
    console.log('props initState', props);
    return {
      state: {
        textInputs: {},
        selectInputs: {},
        radioInputs: {},
      },
    };
  };
  */

  /*
  class WithForms extends Component {
    state = {
      forms: {
        text: {}
      }
    }
    inputText = (name) => {

    }
    render() {
      return <WrappedComponent {...this.props} />
    }
  }
  */
  const EnhancedComponent = compose(
    withStateHandlers(initState, stateHandlers(params))
  )();
};
