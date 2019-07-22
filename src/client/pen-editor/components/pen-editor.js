import Morph from 'src/components/widgets/lively-morph.js';

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import AbstractAstNode from './abstract-ast-node.js';

import { uuid, shake } from 'utils';

import Keys from 'src/client/keys.js';

// https://github.com/babel/babel/blob/8ee24fdfc04870dade1f7318b29bb27b59fdec79/packages/babel-types/src/definitions/core.js
// validator https://github.com/babel/babel/blob/eac4c5bc17133c2857f2c94c1a6a8643e3b547a7/scripts/generators/utils.js
// let nodeTypes = Object.keys(babel.types.ALIAS_KEYS).map(name => babel.types[name])
// nodeTypes.map(n => n.name)
// babel.buildExternalHelpers()
// babel.types.BUILDER_KEYS.IfStatement
// babel.types.NODE_FIELDS.ArrowFunctionExpression.body.validate.oneOfNodeTypes
// babel.types.NODE_FIELDS.BlockStatement.body.validate
// var y = 
//     Object.keys(babel.types.NODE_FIELDS.AssignmentExpression.operator.validate)
// babel.types.identifier('hello')
// babel.types.TYPES[0]
// var x = babel.types.NODE_FIELDS.BlockStatement.body.validate.chainOf[1]
// Object.keys(x.each.oneOfNodeTypes)
// Object.keys(y)
//((babel.types.NODE_FIELDS.BlockStatement.directives.validate).chainOf[1].each).oneOfNodeTypes[0] === 'Directive'

class History {

  constructor() {
    this.inner = [];
    this.currentIndex = -1;
  }
  
  setEditor(editor) {
    this.editor = editor;
    
    this.render();

    return this;
  }
  
  add(item) {
    this.inner.length = this.currentIndex + 1;
    this.currentIndex += 1;
    this.inner.push(item);

    this.render();
  }
  
  undo() {
    const newIndex = Math.max(this.currentIndex - 1, 0);
    
    const isNew = newIndex < this.currentIndex;
    if (isNew) {
      this.currentIndex = newIndex;
      this.render();
    } else {
      this.shakeCurrentEntry();
    }
    return isNew;
  }
  
  redo() {
    const newIndex = Math.min(this.currentIndex + 1, this.inner.length - 1);
    
    const isNew = newIndex > this.currentIndex;
    if (isNew) {
      this.currentIndex = newIndex;
      this.render();
    } else {
      this.shakeCurrentEntry();
    }
    return isNew;
  }
  
  jumpTo(index) {
    this.currentIndex = index;

    this.render();
    
    return this.current();
  }
  
  current() {
    return this.inner[this.currentIndex];
  }
  
  clear() {
    this.inner.length = 0;
    this.currentIndex = -1;

    this.render();
  }
  
  get historyView() { return this.editor && this.editor.historyView; }
  
  render() {
    if (!this.editor) { return; }
    
    const historyView = this.historyView;
    historyView.innerHTML = '';
    
    this.inner
      .map((ast, id) => {
        const clickHandler = evt => this.editor.onSelectHistoryEntry(evt, ast, id);

        const element = <span class="history-entry" click={clickHandler}>{id}</span>
        if (this.currentIndex === id) {
          element.classList.add('selected');
        }
        
        return element;
      })
      .forEach(element => historyView.appendChild(element));
  }
  
  shakeCurrentEntry() {
    if (!this.editor) { return; }
    
    const historyView = this.historyView;
    if (historyView && historyView.children && historyView.children[this.currentIndex]) {
      shake(historyView.children[this.currentIndex]);
    }
    
  }

}

export function nodeEqual(node1, node2) {
  return node1 && node1.uuid && node2 && node2.uuid && node1.uuid === node2.uuid;
}

class Navigation {
  setEditor(editor) { return this; }
  up(element, evt) {
    if (
      element.parentElement && element.parentElement.localName.includes('ast-node')
    ) {
      evt.stopPropagation();
      evt.preventDefault();
      element.parentElement.focus();
      return true;
    }
    return false;
  }
  getElementForNode(node, editor) {
    return editor.getElementForNode(node);
  }
  navigateNextInList(element, editor, linearizedNodeList) {
    const currentNode = linearizedNodeList.find(n => nodeEqual(n, element.astNode));
    const newIndex = linearizedNodeList.indexOf(currentNode) + 1;
    const newNode = linearizedNodeList[newIndex];
    if (newNode) {
      const target = this.getElementForNode(newNode, editor);
      if (target) {
        target.focus();
      } else {
        lively.warn('no target found')
      }
    } else {
      lively.warn('reached end of list')
    }
  }
  left(element, evt) {

    evt.stopPropagation();
    evt.preventDefault();

    function reversedEnterList(ast) {
      const linearizedNodeList = [];
      ast.traverseAsAST({
        enter(path) {
          linearizedNodeList.push(path.node);
        }
      });
      return linearizedNodeList.reverse();
    }

    const linearizedNodeList = reversedEnterList(element.editor.history.current());
    this.navigateNextInList(element, element.editor, linearizedNodeList);
    return;
  }
  right(element, evt) {
    evt.stopPropagation();
    evt.preventDefault();

    function exitList(ast) {
      const linearizedNodeList = [];
      ast.traverseAsAST({
        exit(path) {
          linearizedNodeList.push(path.node);
        }
      });
      return linearizedNodeList;
    }

    const linearizedNodeList = exitList(element.editor.history.current());
    this.navigateNextInList(element, element.editor, linearizedNodeList);
    return;
  }
  down(element, evt) {
    evt.stopPropagation();
    evt.preventDefault();

    function getFirstChildNode(currentNode, ast) {
      let target;
      ast.traverseAsAST({
        enter(path) {
          if (nodeEqual(currentNode, path.node)) {
            path.traverse({
              enter(pathChild) {
                target = target || pathChild.node;
              }
            });
          }
        }
      });
      return target;
    }

    const child = getFirstChildNode(element.astNode, element.editor.history.current());
    if (child) {
      debugger
      const newElement = this.getElementForNode(child, element.editor)
      if (newElement) {
        newElement.focus();
        return true;
      } else {
        lively.warn('no element for child found')
      }
    } else {
      lively.warn('no child found')
    }
    return false;
  }
}

export default class PenEditor extends Morph {

  /*MD ## Accessors MD*/
  get fileName() { return this.get('input#fileName'); }
  get historyView() { return this.get('#history'); }
  get projectionChild() { return this; }
  get lcm() { return this.get('#lcm'); }
  get inspector() { return this.get('#inspector'); }

  get history() { return this._history = this._history || new History().setEditor(this); }
  set history(value) { return this._history = value; }

  get navigation() { return this._navigation = this._navigation || new Navigation().setEditor(this); }
  set navigation(value) { return this._navigation = value; }

  trace(method) {
    this._ordering = this._ordering || 1;
    return lively.success(this._ordering++ + ': ' + method);
  }

  initialize() {
    this.trace('initialize PEN Editor')
    this.windowTitle = "AST Editor";
    
    this.registerButtons();
    
    this.fileName.value = lively4url + '/src/client/pen-editor/components/example.js';
    
    this.addEventListener('keydown', evt => this.onKeydown(evt));

    this.initToggleButtons();
    this.initLCM();
  }
  initToggleButtons() {
    this.initToggleButton({
      button: this.get('#toggleInspector'),
      target: this.inspector,
      persistAttribute: 'show-inspector',
    });
    this.initToggleButton({
      button: this.get('#toggleCodeMirror'),
      target: this.lcm,
      persistAttribute: 'show-code-mirror',
    });
  }
  initToggleButton({
    button, hideClassButton = 'toggle-button-hide', showClassButton = 'toggle-button-show',
    target, hideClassTarget = 'toggle-target-hide', showClassTarget = 'toggle-target-show',
    defaultValue = false, persistAttribute
  }) {
    let shown = this.hasAttribute(persistAttribute) ?
        JSON.parse(this.getAttribute(persistAttribute)) :
        defaultValue;
    
    const updateToggleState = () => {
      if (shown) {
        button.classList.add(showClassButton);
        button.classList.remove(hideClassButton);
        target.classList.add(showClassTarget);
        target.classList.remove(hideClassTarget);
        if (target.tagName === 'LIVELY-CODE-MIRROR') {
          target.editorLoaded().then(() => target.editor.refresh());
        }
      } else {
        button.classList.add(hideClassButton);
        button.classList.remove(showClassButton);
        target.classList.add(hideClassTarget);
        target.classList.remove(showClassTarget);
      }
      this.setAttribute(persistAttribute, JSON.stringify(shown))
    }

    updateToggleState();
    button.addEventListener('click', evt => {
      shown = !shown;
      updateToggleState();
    });
  }
  initLCM() {
    this.lcm.editorLoaded().then(() => {
      this.lcm.registerExtraKeys({
        'Ctrl-Shift-S': cm => {
          lively.files.saveFile(this.fileName.value, this.lcm.value);
        }
      });
      this.lcm.doSave = text => this.onLCMSave(text);
    });
  }
  onLCMSave(text) {
    this.setAST(text.toAST());
  }
  onKeydown(evt) {
    const { char, meta, ctrl, shift, alt, keyCode, charCode } = Keys.keyInfo(evt);
    
    if (alt && char === 'Z') {
      if (this.history.undo()) {
        this.project(this.history.current());
      }
      return;
    } else if (alt && (char === 'Y' || (shift && char === 'Z'))) {
      if (this.history.redo()) {
        this.project(this.history.current());
      }
      return;
    }
    
    this.printKeydown(evt);
  }
  
  getElementForNode(node) {
    return this.querySelectorAll('*').find(element => nodeEqual(element.astNode, node));
  }
  
  printKeydown(evt) {
    const { char, meta, ctrl, shift, alt, keyCode, charCode } = Keys.keyInfo(evt);
    
    const modifiers = [];
    if (meta) modifiers.push('meta');
    if (ctrl) modifiers.push('ctrl');
    if (shift) modifiers.push('shift');
    if (alt) modifiers.push('alt');
    
    lively.warn(`${char} (${keyCode}, ${charCode})[${modifiers.join(', ')}]`);
  }
  
  async setAST(ast) {
    this.assignUUIDsForAllNodes(ast);
    this.addToHistory(ast);
    this.project(ast);
  }
  
  assignUUIDsForAllNodes(ast) {
    ast.traverseAsAST({
      enter: path => this.ensureUUID(path.node)
    });
  }
  
  ensureUUID(node) {
    node.uuid = node.uuid || uuid();
  }
  
  addToHistory(ast) {
    this.history.add(ast);
  }
  
  onTestButton(evt) {
    const current = this.history.current();
    let ast = current.cloneDeep();

    ast.traverseAsAST({
      Identifier(path) {
        path.node.name += 'X';
      }
    });
    
    this.setAST(ast);
  }
  
  onResetHistory() {
    this.history.clear();
  }
  
  onToggleInspector() {}
  onToggleCodeMirror() {}
  
  onSelectHistoryEntry(evt, ast, id) {
    const ast2 = this.history.jumpTo(id);
    this.project(ast2);
  }
  
  project(ast) {
    this.inspectAST(ast);
    this.buildProjection(ast);
    this.buildTransformation(ast);
  }
  
  inspectAST(ast) {
    this.inspector.hideWorkspace()
    this.inspector.inspect(ast)
  }
  
  getProgramPath(ast) {
    let programPath;
    ast.traverseAsAST({
      Program(path) {
        programPath = path;
      }
    });
    return programPath;
  }
  
  async buildProjection(ast) {
    const path = this.getProgramPath(ast);
    const astNode = await AbstractAstNode.getAppropriateNode(path);
    astNode.setPath(path);

    this.projectionChild.innerHTML = '';
    this.projectionChild.appendChild(astNode);
  }

  async buildTransformation(ast) {
    this.lcm.value = ast.transformAsAST().code
  }

  livelyMigrate(other) {
    this.trace('livelyMigrate (PEN Editor Migrate)')
    
    this.history = other.history.setEditor(this);
    const ast = this.history.current()
    this.project(ast);
  }
  
  async livelyExample() {
    this.trace('livelyExample (PEN Editor Example)')
    
    await this.loadFile(lively4url + '/src/client/pen-editor/components/example.js');
  }
  
  async loadFile(filePath) {
    const source = await filePath.fetchText();
    const ast = source.toAST();

    this.history.clear();
    this.setAST(ast)
  }
  
  // #TODO: implement
  async saveFile(filePath) {}
  
}

document.querySelectorAll("pen-editor").forEach(pe => {
  const history = pe.history;
  if (history) {
    // evil live programming
    history.constructor = History

    // we can fix this, so we can do live development again....
    history.__proto__ = History.prototype
  }
  const navigation = pe.navigation;
  if (navigation) {
    // evil live programming
    navigation.constructor = Navigation

    // we can fix this, so we can do live development again....
    navigation.__proto__ = Navigation.prototype
  }
});
