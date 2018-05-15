import InputWidget from "./input-widget.js";
import { DeleteButton, SwitchButton } from "./buttons.js";
import {
  defaultInstance,
  guid
} from "../utils/defaults.js";


export default class ExampleWidget extends InputWidget {
  constructor(editor, location, kind, changeCallback, deleteCallback, stateCallback, defaultIsOn, instances) {
    super(editor, location, kind, changeCallback, deleteCallback);
    this._id = guid();
    this._isOn = defaultIsOn;
    this._updateColor();
    this._stateCallback = stateCallback;
    this._instances = instances; // [Instance]
    this._keys = []; // [key]
    this._nameElement = null; // input
    this._instanceElement = null; // {element, input}
    this._elements = new Map(); // Map(key, {element, input})
  }
  
  set keys(keys) {
    this._keys = keys;
    this._update();
  }
  
  _getFormElementForKey(key) {
    if(!this._elements.has(key)) {
      this._elements.set(key, this._makeFormElementForKey(key));
    }
    return this._elements.get(key);
  }
  
  // Creates a single form element
  _makeFormElementForKey(key) {
    const fieldId = `form-${this._id}-${key}`;

    // Textfield
    const input = <input
                    type="text"
                    id={fieldId}
                    name={key}
                    size="1"
                    value=""
                    placeholder="init"></input>

    input.addEventListener("input", () => {
      input.setAttribute("size", input.value.length ? input.value.length : 1);
    });
    input.addEventListener("change", () => {
      this._changeCallback(this._id);
    });

    // Label
    const label = <label
                    for={fieldId}
                  >{key + ":"}</label>

    return {
      element: <span>
                 {label}
                 {input}
               </span>,
      input: input
    };
  }
  
  // Create a field for the example name
  _getNameElement() {
    if(!this._nameElement) {
      const input = <input
                      type="text"
                      id={`form-${this._id}-__name`}
                      class="example-name space-before"
                      style={"background-color:"+this._color}
                      name="__name"
                      size="4"
                      placeholder="name"
                      value=""></input>

      input.addEventListener("input", () => {
        input.setAttribute("size", input.value.length ? input.value.length : 4);
      });
      input.addEventListener("change", () => {
        this._changeCallback(this._id);
      });

      this._nameElement = input;
    }

    this._nameElement.style.backgroundColor = this._color;

    return this._nameElement;
  }
  
  _getInstanceElement() {
    if(!this._instanceElement) {
      const input = <select></select>;

      input.addEventListener("change", () => {
        this._changeCallback(this._id);
      });

      this._instanceElement = {
        element: <span>
            this: {input}
          </span>,
        input: input
      };
    }
    
    const input = this._instanceElement.input;
    let oldValue = 0;
    if(input.options.length) {
      oldValue = input.options[input.selectedIndex].value;
    }
    let newIndex = 0;
    input.innerHTML = "";
    [defaultInstance()].concat(this._instances).map((instance, index) => {
      input.appendChild(<option value={instance.id}>{instance.name}</option>)
      if(instance.id === oldValue) {
        newIndex = index;
      }
    });
    input.selectedIndex = newIndex;

    return this._instanceElement;
  }
  
  _update() {
    this._element.textContent = "";
    this._element.appendChild(DeleteButton(this._deleteCallback));
    this._element.appendChild(SwitchButton(this._onSwitchClicked.bind(this),
                                           this._isOn));
    this._element.appendChild(this._getNameElement());
    this._element.appendChild(this._getInstanceElement().element);
    this._keys.forEach((key) => {
      this._element.appendChild(this._getFormElementForKey(key).element);
    })
  }
                                           
  _onSwitchClicked() {
    this._isOn = !this._isOn;
    this._updateColor();
    this._stateCallback(this._isOn);
  }
  
  _updateColor() {
    if(this._isOn) {
      this._color = nextColor();
    } else {
      this._color = "lightgray";
    }
  }
  
  get values() {
    let result = {};
    this._keys.forEach(k => {
      result[k] = this._elements.get(k).input.value
    });
    return result;
  }
  
  set values(values) {
    this.keys = Object.keys(values);
    for(let key of this._keys) {
      this._elements.get(key).input.value = values[key];
      this._elements.get(key).input.dispatchEvent(new Event("input"));
    }
  }
  
  get code() {
    return `[${this._keys.map(k => this._elements.get(k).input.value)
                         .join(",")}]`;
  }
  
  get instanceId() {
    return this._instanceElement.input.options[this._instanceElement.input.selectedIndex].value;
  }
  
  set instanceId(instanceId) {
    [defaultInstance()].concat(this._instances).map((instance, index) => {
      if(instance.id === instanceId) {
        this._instanceElement.input.selectedIndex = index;
      }
    });
  }
  
  get id() {
    return this._id;
  }
  
  set id(id) {
    this._id = id;
  }
  
  get name() {
    if(this._nameElement) {
      return this._nameElement.value;
    } else {
      return "";
    }
  }
    
  set name(name) {
    this._nameElement.value = name;
    this._nameElement.dispatchEvent(new Event("input"));
  }
}

ExampleWidget.hue = 0
const nextColor = () => {
  const color = `hsl(${ExampleWidget.hue}, 30%, 70%)`;
  ExampleWidget.hue = (ExampleWidget.hue + 60) % 360;
  return color;
}
