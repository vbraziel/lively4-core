"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';
import {Helper} from "src/components/demo/lively-petrinet-helper.js"




export default class LivelyPetrinetEditor extends Morph {
  
  
  
  // Initialization
  
  async initialize() {
    this.windowTitle = "LivelyPetrinetEditor";
    this.registerButtons();
    this.mouseIsOnNode = false;
    this.selectedElement = undefined;
    if (this.petrinet != undefined) {
        this.addAllListeners();
    }
  }
  
  
  async initializePetrinet(petrinet) {
    await this.appendChild(petrinet);
    this.addAllListeners();
  }
  
  
  
  // Access
  
  
  
  get petrinet() {
    return this.get("lively-petrinet");
  }
  
  get places() {
    return this.petrinet.places;
  }
  
  
  get transitions(){
    return this.petrinet.transitions;
  }
  
  
  get connectors() {
    return this.petrinet.connectors;
  }
  
  addAllListeners() {
    lively.addEventListener("OnDblClick", this, "dblclick", (evt) => this.onDblClick(evt))

    lively.addEventListener("MouseDraw", this, "mousemove", evt => this.onMouseMove(evt));
    

    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false)
    
    for (const place of this.places) {
      this.addListeners(place)
    }
    
    for (const transition of this.transitions) {
      this.addListeners(transition)
    }
  }
  

  
  // Methods For Simulation
  
  
  
  start() {
    for (const place of this.places) {
      place.start();
    }
  }
  
  setState(step) {
    for (const place of this.places) {
      place.setState(step);
    }
  }
  
  resetToState(step) {
    for (const place of this.places) {
      place.resetToState(step);
    }
  }
  
  getCurrentStep() {
    return this.places[0].history.length
  }
  
  *stepUntilFired() {
    while (true) {
       for (const transition of Helper.shuffled(this.transitions)) {
        if (this.canFire(transition)) {
          this.fire(transition);
          this.persistPlaceState();
          yield;
        }
      }
    }
  }
  
  async onStep() {
      let hasFired = false;
      for (const transition of Helper.shuffled(this.transitions)) {
          if (this.canFire(transition)) {
            await this.fire(transition);
            hasFired = true;
          }
      }
      if (hasFired) {
        this.persistPlaceState();
      }
  }
  
  canFire(transition) {
      const placesBefore = this.getFirstComponents(this.getConnectorsBefore(transition));
      const placesAfter = this.getSecondComponents(this.getConnectorsAfter(transition));
      const firingIsPossible = placesBefore.every((place) => place.tokens.length > 0);
      const transitionAllowsFiring = transition.isActiveTransition();
      if (!firingIsPossible || !transitionAllowsFiring) {
        return false;
      }
      return true;
  }
  
  async fire(transition) {
      const connectorsBefore = this.getConnectorsBefore(transition);
      const connectorsAfter = this.getConnectorsAfter(transition);
      for (const place of this.getFirstComponents(connectorsBefore)) {
        place.deleteToken();
      }
    
      // Animation
      await Promise.all(connectorsBefore.map(connector => connector.animateMovingToken()));
    
      await Promise.all(connectorsAfter.map(connector => connector.animateMovingToken()));
    
      for (const place of this.getSecondComponents(connectorsAfter)) {
        await place.addToken();
      }
      return
  }
  
  getFirstComponents(connectors) {
    return connectors.map(connector => this.petrinet.getComponentFrom(connector.fromComponentId));
  }
  
  getSecondComponents(connectors) {
    return connectors.map(connector => this.petrinet.getComponentFrom(connector.toComponentId));
  }
  
  getConnectorsBefore(element) {
    let connectorsBefore = [];
    for (const connector of this.connectors) {
      if (connector.toComponentId == element.componentId) {
        connectorsBefore.push(connector);
      }
    }
    return connectorsBefore;
  }
  
  
  getConnectorsAfter(element) {
    let connectorsAfter = [];
    for (const connector of this.connectors) {
      if (connector.fromComponentId == element.componentId) {
        connectorsAfter.push(connector);
      }
    }
    return connectorsAfter;
  }
  
  persistPlaceState() {
    for (const place of this.places) {
      place.persistState();
    }
  }

  
  
  // Lively Methods
  
  
  
  onContextMenu(evt) {
    console.log(evt);
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();
        const mousePosition = this.getPositionInWindow(evt);
        const offset = lively.getGlobalPosition(this.get("lively-petrinet")).y - lively.getGlobalPosition(this).y;
        const positionInPetrinet = pt(mousePosition.x, mousePosition.y - offset);
        const toolbarToggleText = this.toolbarIsActive() ? "disable toolbar" : "activate toolbar";

        var menu = new ContextMenu(this, [
              ["add place", () => this.addPlace(positionInPetrinet)],
              ["add transition", () => this.addTransition(positionInPetrinet)],
              ["add code transition", () => this.addCodeTransition(positionInPetrinet)],
              [toolbarToggleText, () => this.toggleToolbar()]
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  toggleToolbar() {
    if (this.toolbarIsActive()){
      this.get("lively-petrinet-toolbar").style.display = "none";
    } else {
      this.get("lively-petrinet-toolbar").style.display = "block";
    }
  }
  
  toolbarIsActive() {
    return this.get("lively-petrinet-toolbar").style.display != "none";
  }
  
  async livelyExample() {
    const petrinet = await (<lively-petrinet></lively-petrinet>);
    await this.initializePetrinet(petrinet);
    await this.addPlace(pt(0,0));
    this.petrinet.places[0].addToken();
    await this.addPlace(pt(500, 100));
    await this.addTransition(pt(300, 100));
    this.addConnector(this.places[0], this.transitions[0]);
    this.addConnector(this.transitions[0],this.places[1]);
    this.toggleToolbar();
  }
  

  
  
  
  // Connector Creation
  
  
  
  async onMouseMove(evt) { 
    const cursor = this.get("#cursor");
    const pos = pt(evt.clientX, evt.clientY);
    if (this.connectionIsStarted()) {
      lively.setGlobalPosition(cursor, pos);
    }
  }
  
  getPositionInWindow(evt){
    const windowPosition = lively.getGlobalPosition(this);
    const x = evt.clientX - windowPosition.x;
    const y = evt.clientY - windowPosition.y;
    return pt(x,y);
  }
  
  connectionIsStarted() {
    const cursor = this.get("#cursor");
    const startedConnection = cursor != null;
    return startedConnection;
  }
  
  onDblClick(evt) {
    if (this.mouseIsOnNode || !this.connectionIsStarted())      {
        return;
    }
    this.deleteUnfinishedConnector(this.get("#cursor"),   this.unfinishedConnector);
  }
  
  async deleteUnfinishedConnector(cursor, connector) {
    cursor.remove();
    connector.remove();
  }
  
  async startConnectionFrom(element) {
    //Create Connector
    var connector = await (<lively-petrinet-edge></lively-petrinet-edge>);
    this.append(connector);
    connector.connectFromPetrinetComponent(element);
    
    // Create Cursor That Moves Connector
    var cursor = await (<div></div>)
    cursor.style.backgroundColor = "blue"
    cursor.id = "cursor"
    lively.setExtent(cursor, pt(5,5));
    const position = lively.getGlobalPosition(element);
    await this.append(cursor);
    lively.setGlobalPosition(cursor, position);
    
    //Connect Cursor To Connector
    connector.connectTo(cursor);
    this.unfinishedConnector = connector;

    return connector
  }
  
  async connectTo(component) {
    if (!this.unfinishedConnector) {
      return;
    }
    const fromComponent = this.petrinet.getComponentFrom(this.unfinishedConnector.fromComponentId);
    this.deleteUnfinishedConnector(this.get("#cursor"), this.unfinishedConnector);
    //this.get("#cursor").remove();

    if (fromComponent == component) {
      return
    }
    
    await this.addConnector(fromComponent, component);
  }
  
  async manageNewConnection(element) {
    if (!this.connectionIsStarted()) {
      await this.startConnectionFrom(element);
    } else {
      await this.connectTo(element);
    }
  }
  
  updateAllConnectors() {
    for (const connector of this.connectors) {
      connector.updateConnector();
    }
  }
  
  
  
  // Add And Delete Elements
  
  
  
  async addConnector(fromComponent, toComponent) {
    const newConnector = await this.petrinet.addConnector(fromComponent, toComponent);
    lively.addEventListener("onClick", newConnector, "click", (evt) => this.onElementClick(evt, newConnector));
  }
  
  async addTransition(position) {
    const transition = await this.petrinet.addTransition(position);
    this.initializeElement(transition, position);
  }
  
  
  async addPlace(position) {
      const place = await this.petrinet.addPlace(position);
      this.initializeElement(place, position);
  }
  
  async addCodeTransition(position) {
    const codeTransition = await this.petrinet.addCodeTransition(position);
    this.initializeElement(codeTransition, position);
  }
  
  async addListeners(element) {
      element.onmouseover = () => this.mouseIsOnNode = true;
      element.onmouseout = () => this.mouseIsOnNode = false;
      lively.addEventListener("onDblClick", element.graphicElement(), "dblclick", () =>     this.manageNewConnection(element));
      lively.addEventListener("lively", element, "click", (evt) => this.onElementClick(evt, element))
  }
  
  async initializeElement(element, position) {
      this.addListeners(element);
  }
  
  deleteSelectedElement(){
    const connectorsBefore = this.getConnectorsBefore(this.selectedElement);
    for (const connector of connectorsBefore) {
      connector.remove();
    }
    const connectorsAfter = this.getConnectorsAfter(this.selectedElement);
    for (const connector of connectorsAfter) {
      connector.remove();
    }
    this.selectedElement.remove();
  }
  
  isSelectedElement(element){
    return element == this.selectedElement;
  }

  onElementClick(evt, element) {
    evt.preventDefault();
    evt.stopPropagation();
    this.selectedElement = element;
    element.setSelectedStyle();
    for (const otherElement of [...this.transitions, ...this.places, ...this.connectors]) {
      if (otherElement != element) {
        otherElement.setDisselectedStyle();
      }
    }
  }
  
  

}