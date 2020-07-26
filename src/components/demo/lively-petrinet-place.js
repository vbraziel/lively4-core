import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"



export default class LivelyPetrinetPlace extends Morph {

  initialize() {
    if (!this.componentId) {
      this.componentId = Helper.getRandomId();
    }
    
    this.history = [];
    
    this.windowTitle = "LivelyPetrinetPlace";
    this.registerButtons();
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    this.get("#inputLabel").addEventListener("change", (evt) => this.onLabelChange(evt));
    lively.addEventListener("foo", this, "pointerdown", evt => Helper.startDragAndDrop(evt, this));
    
    if (this.label) {
      this.get("#inputLabel").value = this.label;
    }
  }
  
  
  // Access
  
    
  get componentId() {
    return this.getAttribute("componentId");
  }

  set componentId(id) {
    this.setAttribute("componentId", id);
  }
  
  get tokens() {
    return Array.from(this.querySelectorAll("lively-petrinet-token"));
  }
  
  numberOfTokens(){
    return this.tokens.length;
  }
  
  get label() {
    return this.getAttribute("label");
  }
  
  set label(text) {
    this.setAttribute("label", text);
  }
  
  get petrinet() {
    return Helper.getPetrinetOf(this);
  }
  
  // Simulation State
  
  
  
  setState(step) {
    const numberTokensAtStep = this.history[step];
    if (numberTokensAtStep == this.numberOfTokens()) {
      return;
    }

    this.deleteAllTokens();
    for (let i = 0; i < numberTokensAtStep; i++) {
      this.addToken();
    }
  }
  
  resetToState(step) {
    this.history = this.history.slice(0,step);
  }
  
  start() {
    this.history = [this.numberOfTokens()];
  }  
  
  persistState() {
    this.history = [...this.history, this.numberOfTokens()];
  }
  
  
  
  // Interaction
  
  setSelectedStyle() {
    this.graphicElement().style.border = Helper.getSelectedBorder();
  }
  
  setDisselectedStyle() {
    this.graphicElement().style.border = Helper.getDisselectedBorder();
  }
  
  graphicElement() {
    return this.get("#circle");
  }
  
  onLabelChange(evt) {
    this.label = this.get("#inputLabel").value;
  }
  
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
       evt.stopPropagation();
      evt.preventDefault();

       var menu = new ContextMenu(this, [
          ["add token", () => this.addToken()],
            ["start connection", () => this.petrinet.startConnectionFrom(this)]],
                                 );
       menu.openIn(document.body, evt, this);
        return true;
      }
  }
  

  async addToken() {
    const length = lively.getExtent(this.graphicElement()).x;
    const token = await (<lively-petrinet-token></lively-petrinet-token>);
    const margin = lively.getGlobalPosition(this.graphicElement()).x - lively.getGlobalPosition(this).x;
    console.log(margin);
    const x = Math.random() * length/2 + length/4;
    const y = Math.random() * length/2 + length/4;
    const tokenPosition = pt(margin+x,y);
    lively.setPosition(token, tokenPosition);
    this.appendChild(token)
    lively.addEventListener("TokenSelected", token, "click", (evt) => this.petrinet.onElementClick(evt, token));
  }
  
  
  async deleteToken(){
      this.tokens[0].remove()
  }
  
  async deleteAllTokens(){
    for (let token of this.tokens) {
      token.remove();
    }
  }
   
  
}