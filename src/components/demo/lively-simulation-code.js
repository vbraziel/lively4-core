"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';

const DEFAULT_SNIPPET = '// Enter simulation code here';
const HIGHLIGHT_BG_COLOR = 'cornflowerblue';

export default class LivelySimulationCode extends Morph {
    
  // lifecycle
  initialize() {
    const codeMirror = this.get('#codeMirror');
    codeMirror.addEventListener('focusout', () => this.handleFocusOut());
    codeMirror.addEventListener('focusin', () => this.handleFocusIn());
    codeMirror.checkSyntax = () => {};
    codeMirror.setCustomStyle('.cm-error { color: blue !important; }');
  }
  
  initializeEditor(snippet) {
    const codeMirror = this.get('#codeMirror');
    codeMirror.editor.setValue(snippet);
     codeMirror.editor.setOption('lineNumbers', false);
    codeMirror.editor.setOption('gutters', []);
    codeMirror.editor.setOption('highlight', false);
    codeMirror.editor.setOption('lint', false);
    this.preCompile();
    this.updateCellTags();
  }
  
  initializeSnippet(snippet = DEFAULT_SNIPPET) {
    const codeMirror = this.get('#codeMirror');
    codeMirror.editorLoaded().then(() => this.initializeEditor(snippet));
  }
  
  attachedCallback() {
    this.registerCellName();
  }
  
  detachedCallback() {
    this.cellNameUpdater.dispose();
  }
  
  registerCellName() {
    this.cellNameUpdater = aexpr(() => {
      const codeView = this.getCodeView();
      return codeView.getCell().getNormalizedName();
    }).onChange((cellName) => {
      if (!_.isEmpty(cellName)) this.preCompile();
    });
  }
  
  // event handler
  handleFocusOut() {
    this.preCompile();
    this.updateCellTags();
  }
  
  handleFocusIn() {
    this.clearAllMarks();
  }
  
  handleCellRef(event, cellRef) {
    if (this.hasFocus) return;
    const simulation = this.getSimulation();
    if (simulation && simulation.toggleHighlight)
      simulation.toggleHighlight(cellRef);
    event.preventDefault();
  }
  
  // other
  execute(state) {
    const cellNames = _.keys(state);
    try {
      this.precompiled.apply(state);
      this.clearError();
    } catch ({ message }) {
      this.setError(message);
    }
    return Promise.resolve(_.pick(state, cellNames));
  }
  
  preCompile() {
    try {
      const snippet = this.getSnippet();
      const preProcessedSnippet = this.preProcess(snippet);
      this.precompiled = new Function(preProcessedSnippet);
      this.clearError();
    } catch ({ message }) {
      this.setError(message);
    }
  }
  
  preProcess(snippet) {
    const codeView = this.getCodeView();
    if (!codeView) return;
    const localState = codeView.getState();
    const name = codeView.getCell().getNormalizedName();
    let processedSnippet = snippet;
    processedSnippet = this.preImportStateAsLocal(processedSnippet, name, localState);
    processedSnippet = this.preTransformExternalState(processedSnippet);
    processedSnippet = this.preExportStateAsLocal(processedSnippet, name, localState);
    return processedSnippet;
  }
  
  preTransformExternalState(processedSnippet) {
    // adapted from old simulation
    return processedSnippet.replace(/#([A-Za-z][A-Za-z0-9]*(?:#[A-Za-z0-9]*)*)(\$)?(?!#)/g, 
        (m, $1) => {
            var s = "this"
            $1.split("#").forEach(function(ea) { s += "['" + ea.charAt(0).toLowerCase() + ea.slice(1) +"']"})
            return s
        })
  }
  
  preImportStateAsLocal(snippet, name, localState) {
    if (_.isEmpty(localState)) return snippet;
    return `let { ${name}: { ${_.join(_.keys(localState), ',')} } } = this;\n
            ${snippet}`;
  }
  
  preExportStateAsLocal(snippet, name, localState) {
    if (_.isEmpty(localState)) return snippet;
    return `${snippet}\n
            this['${name}'] = {
              ${ _.join(_.keys(localState), ',\n') }
            };`;
  }
  
  updateCellTags() {
    this.clearAllMarks();
    const snippet = this.getSnippet();
    const re = /#([A-Za-z][A-Za-z0-9]*(?:#[A-Za-z0-9]*)*)(\$)?(?!#)/g;
    let match;
    while ((match = re.exec(snippet)) != null) {
      this.addWidget(match);
    }    
    const simulation = this.getSimulation();
    if (!simulation) return;
    this.highlight(simulation.currentHighlight);
  }
  
  addWidget(match) {
    const cm =  this.get('#codeMirror').editor;
    const cellRef = match[1].toLowerCase();
    const widget = <span style='cursor: pointer'>{ match[0] }</span>;
    widget.dataset['cellref'] = cellRef;
    widget.addEventListener('mousedown', (event) => this.handleCellRef(event, cellRef));
    try {
      cm.markText(
        cm.posFromIndex(match.index),
        cm.posFromIndex(match.index + match[0].length), 
        { replacedWith: widget }
      );
    } catch (error) { /* ignore */ }
  }
  
  clearAllMarks() {
    const cm =  this.get('#codeMirror').editor;
    _.forEach(cm.getAllMarks(), mark => mark.clear());
  }
  
  highlight(cellRef) {
    const cm =  this.get('#codeMirror').editor;
    const widgets = _.map(cm.getAllMarks(), mark => _.get(mark, 'widgetNode.children[0]'));
    if (!cellRef) {
      _.forEach(widgets, widget => widget.style.backgroundColor = '');
    } else {
      const matchingWidgets = _.filter(widgets, widget => widget.dataset['cellref']== cellRef);
      const otherWidgets = _.reject(widgets, widget => widget.dataset['cellref']== cellRef);
      _.forEach(otherWidgets, widget => widget.style.backgroundColor = '');
      _.forEach(matchingWidgets, widget => widget.style.backgroundColor = HIGHLIGHT_BG_COLOR);
    }
  }
  
  setSnippet(snippet) {
    const codeMirror = this.get('#codeMirror');
    codeMirror.editor.setValue(snippet);
    this.preCompile(snippet);
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
  
  setError(error) {
    const status = this.get('#status');
    status.innerText = error;
    status.classList.add('error');
  }
  
  clearError() {
    const status = this.get('#status');
    status.innerText = 'No Error';
    status.classList.remove('error');
  }
  
  getSnippet() {
    return this.get('#codeMirror').editor.getValue();
  }
  
  isFocused() {
    return this.isChildFocused(this.get('#codeMirror'));
  }
  
  isChildFocused(child, doc = document) {
    if (doc.activeElement === child) return true;
    if (doc.activeElement && doc.activeElement.shadowRoot)
			return this.isChildFocused(child, doc.activeElement.shadowRoot)
    return false;
  }
  
  getCodeView() {
    return this.getRootNode().host;
  }
  
  getSimulation() {
    const codeView = this.getCodeView();
    if (!codeView) return;
    const cell = codeView.getCell();
    if (!cell) return;
    return cell.getSimulation();  
  }
}