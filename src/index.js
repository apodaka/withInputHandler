/*
  {
    DESCRIPCION: {
      mx: 'HOC de administración de los estados y manejadores de cambios para los inputs de tipo texto',
      en: 'HOC with automated state handler and onChange '
    }
    PROGRAMADOR: {
      nombre: 'Erubiel Apodaca'
      edad: 28
    },
    SOCIALES: {
      linkedIn: 'https://www.linkedin.com/in/erubiel-apodaca/'
    }
  }
*/

import React, { Component } from "react";
import T from "prop-types";
import ReactDOM from "react-dom";
import { compose, withStateHandlers } from "recompose";
import isf from "lodash.isfunction";
import isEmpty from 'lodash.isempty';
import isNumber from 'lodash.isnumber';
import isString from 'lodash.isstring';
// import isPlainObject from 'lodash.isplainobject';
// import size from 'lodash.size';
// import keys from 'lodash.keys';
import every from 'lodash.every';
import { fromJS, Map as Mp, isImmutable, List } from "immutable";
import {
  Container,
  Header,
  Label,
  Icon,
  } from 'semantic-ui-react';
// import 'semantic-ui-css/semantic.min.css';
// CONSTANTS 

const VALIDATE_RULES = {
  VALID_NUMS_WITH_SPACES: /^\d*$/,
  VALID_NUMS_WITHOUT_SPACES: /^\d+$/,
  VALID_ALPHA_WITH_SPACES: /^[a-zA-Z0-9]*$/i,
  VALID_ALPHA_WITHOUT_SPACES: /^[a-zA-Z0-9]+$/i,
  VALID_REQUIRED_WITHOUT_SPACES: /([^\s])/,
  VALID_REQUIRED_WITH_SPACES: /([^\s]*)/,
  VALID_FLOAT: /^[0-9]*[.][0-9]+$/,
};

const applyRules = (rulesCollections, val, options) => {
  if (rulesCollections.length) {
    return rulesCollections.map((rl, index) => {
      const rule = VALIDATE_RULES[rl];
      if (rule || isf(rule)) {
        const testedValue = isf(rule) ?
          rule(val) : rule.test(val);
        return {
          rule: rl,
          passed: testedValue,
        };
      }
      return {
        rule: rl,
        passed: undefined,
      };
    });
  }
};

const VALIDATOR = {
  number: (val, { useSpc = false }) => {
    const withSpaces = useSpc ? '' : 'OUT';
    const testResult = applyRules([
      `VALID_NUMS_WITH${withSpaces}_SPACES`,
    ], val)
    return every(testResult, ['passed', true]);
  },
  alphanumeric: (val, { useSpc = false }) => {
    const withSpaces = useSpc ? '' : 'OUT';
    const testResult = applyRules([
      `VALID_ALPHA_WITH${withSpaces}_SPACES`,
    ], val);
    return every(testResult, ['passed', true]);
  },
  required: (val, { useSpc = false }) => {
    const withSpaces = useSpc ? '' : 'OUT';
    const testResult = applyRules([
      `VALID_REQUIRED_WITH${withSpaces}_SPACES`,
    ], val);
    return every(testResult, ['passed', true]);
  },
  ranges: (val, { min = 0, max = null}) => {
    if (min || max) {
      const range = new RegExp(`^([^\\s]){${min}${isNumber(max) && (max > min) ? `,${max}` : ''}}$`);
      return range.test(val)
    }
    return true;
  }
};

const noop = () => {};

const logImm = (elem, rawObj = false) => {
  console.log('isImmutable', isImmutable)
  console.log('elem in logImm', elem)
  if (isImmutable(elem)) {
    console.log('-- [TRANSFORMED FROM IMMUTABLE] --');
    console.log(elem.toJS());
    console.log('-- [/TRANSFORMED FROM IMMUTABLE] --');
    if (rawObj) {
      console.log('-- [RAW IMMUTABLE] --');
      console.log(elem);
      console.log('-- [/RAW IMMUTABLE] --');
    }
  } else {
    console.log('El parámetro no es de tipo Immutable');
  }
} 

const capitalizeFirstLetter = string =>
  string.charAt(0).toUpperCase() + string.slice(1);

const buildMap = obj => {
  let map = new Map();
  Object.keys(obj).forEach(key => {
    map.set(key, obj[key]);
  });
  return map;
};

const mapToObj = aMap => {
  const obj = {};
  aMap.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
};

const toLower = (string = "") => string.toLowerCase(); 

const withInputHandler = params => WrappedComponent => {
  const mapParams = buildMap(params);
  const typ = new Set(["text", "select", "radio"]);
  const inputsNames = new Set();
  mapParams.forEach((val, key) => {
    inputsNames.add(key);
  });

  const validateRules = (value, options) => {
    /*
    type: "text",
      required: true,
      maxLength: 10,
      minLength: 1,
      rules: [{
        alpthanumeric: {
          message: 'formato no valido',
        }
      },
       'numeric',
       {
         custom: {
           regEx: // REG EX HERE
         }
       }
      }],
      messages: {
        required: "El nombre del usuario es requerido"
      }
    */
    const optRequired = options.get('required', false);
    const optMinLength = options.get('minLength', 0);
    const optMaxLength = options.get('maxLength', -1);
    const rules = options.get('rules');
    let errors = new List(); 
    let isValid = true;
    if (optRequired) {
      isValid = !isEmpty(value);
    }
    if (isNumber(optMaxLength) && optMaxLength > optMinLength) {
      const maxLength = optMaxLength;
      isValid = value.length <= maxLength;
    }
    if (isNumber(optMinLength) && optMinLength >= 0) {
      const minLength = optMinLength;
      isValid = value.length >= minLength;
    }
    if (rules && rules.size > 0) {
      rules.forEach((rule) => {
        switch (true) {
          case isString(rule):
            // console.log('rule: ', rule)
            if (VALIDATOR[rule] && isf(VALIDATOR[rule])) {
              const resp = VALIDATOR[rule](value, {
                useSpc: true,
              });
              isValid = resp;
            }
            break;
          case Mp.isMap(rule): {
            if (rule.size > 0) {
              // const keyval = List(rule).get(0);
              const rl = (List(rule).get(0))[0];
              if (rl.length && VALIDATOR[rl]) {
                const resp = VALIDATOR[rl](value, {
                  useSpc: true,
                });
              isValid = resp;
              }
            }
            return true;
          }
          default:
            return true;
        }
      })
    }
    return {
      isValid,
      errors,
    }
  };

  const getInputProps = (st, inputName, prop = '') => {
    if (isImmutable(st)) {
      const PATH = prop.length ? ['forms', inputName, prop] : ['forms', inputName];
      return st.getIn(PATH, undefined);
    } else {
      return undefined;
    }
  } 

  const configureHandlers = () => {
    const handlers = {};
    const mapperHandlers = new Map();
    if (inputsNames.size > 0) {
      inputsNames.forEach(input => {
        const field = buildMap(mapParams.get(input));
        // crear la función handler que almacenará el valor del estado
        if (field.has("type") && typ.has(field.get("type"))) {
          let funcHandler;
          const inputType = field.get("type");
          switch (inputType) {
            case "text": {
              funcHandler = ({ state }) => ({ target }) => {
                const { value } = target;
                const PATHS = {
                    value: [
                    "forms", input, "value"
                  ],
                  };
                // const options = state.getIn(["forms", input, "options"]);
                const options = getInputProps(state, input, 'options');
                logImm(options)
                const valid = validateRules(value, options);
                console.log('valid', valid);
                console.log(`validating [${input}:${valid.isValid}]`);
                return {
                    state: state.setIn(PATHS.value, value),
                  };
              };
              break;
            }
            default:
              funcHandler = () => () => undefined;
          }
          mapperHandlers.set(`handleChange_${toLower(input)}`, funcHandler);
        }
      });
    }
    mapperHandlers.forEach((value, key) => {
      handlers[key] = value;
    });
    return handlers;
  };

  const configureState = () => {
    const INIT_INPUT = {
      value: "",
      errors: [],
      isvalid: false
    };
    const forms = {};
    inputsNames.forEach(input => {
      const field = buildMap(mapParams.get(input));
      if (field.has("type") && typ.has(field.get("type"))) {
        const inputType = field.get("type");
        switch (inputType) {
          case "text": {
            const filedConfig = Object.assign({}, {
                ...INIT_INPUT,
                options: mapToObj(field)
              }
            );
            forms[input] = filedConfig;
            break;
          }
          default:
        }
      }
    });
    return {
      state: fromJS({
        forms
      })
    };
  };
  class WithInputHandler extends Component {
    getInputs = (raw = false) => {
      if (raw) {
        console.log('-- INPUTS STATE --');
        console.log(this.props.state);
        console.log('-- /INPUTS STATE --');
      } else {
        console.log('-- INPUTS STATE --');
        logImm(this.props.state);
        console.log('-- /INPUTS STATE --');
      }
    }
    updateOptions = (inputName = '', newo) => {
      // THIS MUST UPDATE OPTIONS FOR INPUT 
    }
    handleInput = (inputName = "") => {
      const { state } = this.props;
      const handlerName = `handleChange_${toLower(inputName)}`;
      const inputExists = state.hasIn(["forms", inputName]);
      if (inputExists && isf(this.props[handlerName])) {
        return {
          type: "text",
          onChange: this.props[handlerName],
          value: state.getIn(["forms", inputName, "value"], "")
        };
      }
      return {
        onChange: () => console.log("input handler not defined"),
        value: ""
      };
    };
    render() {
      const nprops = Object.assign({}, this.props, {
        handleInput: this.handleInput,
        getInputs: this.getInputs,
      });
      return <WrappedComponent {...nprops} />;
    }
  }
  return compose(withStateHandlers(configureState(), configureHandlers()))(
    WithInputHandler
  );
};

function App(props) {
  const styles = {
    root: {
      fontFamily: ''
    },
    container: {
      display: "flex",
      flexDirection: "column",
      padding: 50
    },
    subtitle: {
      color: '#666666',
    },
    statusContainer: {
      paddingBottom: '20px',
    },
  };
  props.getInputs();
  const statusComp = (
    <Container style={styles.statusContainer}>
      <Label>
        status
            </Label>
      <Label color="blue">
        On going
            </Label>
    </Container>
  );
  return (
    <div className="App">
    <Container>
      <Container>
        <Header as="h1">withInputHandler</Header>
        <Header as="h2" style={styles.subtitle}>
          High Order Component for Input state handling
        </Header>
        {statusComp}
        <p>
          HOC that handles input text with auto-controlled state.
          This function uses the React's original SyntheticEvent <Label>onChange</Label> and <Label>value</Label> for standard handling, allowing work with every kind of ui-framework.
        </p>
        Input state and validation are fully managed using 
        <Label as="a" target="_blank" href="https://recompose.docsforhumans.com/">
          <Icon className="external alternate"/>Recompose
        </Label> state handlers methods and 
        <Label as="a" target="_blank" href="https://facebook.github.io/immutable-js/">
            <Icon className="external alternate" />Immutable JS
        </Label> for data persist.
      </Container>
      <Container>
        <h2>Native Components</h2>
        <div>
          <label htmlFor="txt_nombre">Nombre</label>
          <input id="txt_nombre" {...props.handleInput("nombre")} name="txt_nombre" />
        </div>
        <div>
          <label htmlFor="txt_edad">Edad</label>
          <input id="txt_edad" {...props.handleInput("edad")} name="txt_edad" />
        </div>
          <div>
            <label htmlFor="txt_apellidoPaterno">apellidoPaterno</label>
            <input {...props.handleInput("apellidoPaterno")} name="txt_edad" />
          </div>
      </Container>
      <br />
      <Container>
        Developed by: Erubiel Apodaca Soto.
      </Container>
    </Container>
    </div>
  );
}

App.propTypes = {
  field: T.func
};

App.defaultProps = {
  field: noop
};

const EnhancedApp = compose(
  withInputHandler({
    nombre: {
      type: "text",
      maxLength: 10,
      minLength: 1,
      rules: [
        {
          required: {
            message: 'El campo nombre es requerido',
          }
        },
        {
          alphanumeric: {
            message: 'el valor debe debe ser alfanumérico',
          }
        },
        {
          minLength: {
            message: 'El valor debe contener como mínimo 1 caracter',
          },
        },
        {
          maxLength: {
            message: 'El valor debe contener máximo 10 caracteres',
          }
        },
      ],
    },
    edad: {
      type: "text",
      required: false,
      maxLength: 2,
      minLength: 1,
      rules: [
        'alphanumeric',
      ],
    },
    apellidoPaterno: {
      type: "text",
      // required: false,
      maxLength: 2,
      minLength: 1,
      rules: [
        'required',
        'numeric',
      ],
    },
  })
)(App);

const rootElement = document.getElementById("root");
ReactDOM.render(<EnhancedApp />, rootElement);
