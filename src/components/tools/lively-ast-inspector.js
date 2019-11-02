import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';
import { sortAlphaNum } from 'src/client/sort.js';
import { getTempKeyFor } from 'utils';
import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

function truncateString(s = '', length = 30, truncation = '...') {
  return s.length > length
          ? s.slice(0, length - truncation.length) + truncation
          : String(s);
}

export default class AstInspector extends Morph {
  
  async initialize() {
    this.windowTitle = "AST Inspector";
    this.registerButtons()

    lively.html.registerKeys(this);
  }
  
  get container() { return this.get("#container"); }
  
  inspect(obj) {
    if (!obj) return;
    
    if (this.targetObject) {
      var oldViewState = this.getViewState()
    }
    
    this.targetObject = obj;
    this.container.innerHTML = "";
    
    const content = this.display(obj, true, null, null);
    this.container.appendChild(content);
    this.updatePatterns(this.container.childNodes[0])
    
    if (oldViewState) {
      this.setViewState(oldViewState)
    }
    return content;
  }
  
  isAstMode() {
    return true;
  }
/*MD # Displaying MD*/
  
  display(obj, expanded, name, parent) {
    // #TODO: Differentiation between object and value?
    if (obj instanceof Text) {
      return this.displayText(obj, expanded, parent);
    } else if (typeof obj == "object" || typeof obj == "function") {
      return this.displayObject(obj, expanded, name);
    } else {
      return this.displayValue(obj, expanded, name);
    }
  }
  
  displayText(obj, expanded) {
    var node = <span class="element"></span>
    this.render(node, obj, expanded); 
    return node;
  }
  
  displayObject(obj, expand, name) {
    if (!(obj instanceof Object)) {
      return this.displayValue(obj, expand, name);
    }
    
    var node = <div class="element"></div>;
    node.pattern = "NAME " + (name || '').toString()
    node.name = name
    this.renderObject(node, obj, expand, name);
    return node;
  }
  
  displayValue(value, expand, name) {
    if (name) {
      let attrValue;
      if (value && typeof value === 'symbol') {
        attrValue = value.toString();
      } else {
        attrValue = JSON.stringify(value).replace(/</g,"&lt;");
      }
      return <div class="element">
        <span class='attrName'>{name}:</span>
        <span class='attrValue'>{attrValue}</span>
      </div>;
    } else {
      return <pre>{JSON.stringify(value)}</pre>;
    }
  }
  
/*MD # Rendering MD*/
  
  render(node, obj, expanded) {
    if (obj instanceof Text) {
      return this.renderText(node, obj, expanded);
    } else if (typeof obj == "object") {
      return this.renderObject(node, obj, expanded, node.name);
    }
  }
  
  renderText(node, obj, expanded) {
    if (obj.textContent.match(/^[ \n]*$/)) 
      return; // nothing to render here... skip, empty lines or just spaces
    if (obj.textContent && obj.textContent.length > 100)
      node.innerHTML = "<pre>" +  obj.textContent + "</pre>";
    else {
      console.log("renderText " + obj)
      node.innerHTML =  obj.textContent;
      if (obj instanceof Text) {
        node.onclick = evt => {
          node.contentEditable = true;
          return true;
        };
        // accept changes in content editable attribute value
        node.onkeydown = evt => {
          if(evt.keyCode == 13) { // on enter -> like in input fields
           node.contentEditable = false;
            obj.textContent =  node.textContent;
            evt.preventDefault();
          }
        };          
      }
      
    }
  }
  
  renderObject(node, obj, expand, name = '') {
    // handle system objects... 
    node.type = "Object"
    node.isExpanded = expand;

    var className = obj.constructor.name;
    if (this.isAstMode() && obj.type) {
      className = obj.type
    }
    
    node.innerHTML = '';
    node.appendChild(this.expandTemplate(node));
    node.appendChild(<span>
      <span class='attrName expand'> {name}</span><span class="syntax">:</span> 
    </span>)
    
    node.appendChild(<a id='tagname' class='tagname'>{className}</a>)
    
    node.appendChild(<span>
      <span class="syntax">&#123;</span>{
          this.contentTemplate()
        }<span class="syntax">&#125;</span>
    </span>)
  
    this.attachHandlers(node, obj, name, "renderObject");
    this.renderExpandedProperties(node, obj);
  }
  
  renderExpandedProperties(node, obj) {
    if (!node.isExpanded) return;
        
    var contentNode = node.querySelector("#content");

    if (obj && obj[Symbol.iterator]) {
      this.renderIterable(contentNode, obj);
      return;
    }
    
    contentNode.innerHTML = "";
    this.allKeys(obj).sort(sortAlphaNum).forEach( ea => {
      try {
        var value = obj[ea];
      } catch(e) {
        console.log("[inspector] could not display " + ea + " of " + obj);
        return;
      }
      if (value == null) return;  
      var childNode = this.display(value, false, ea, obj);
      if (childNode) contentNode.appendChild(childNode);
    });
  }
  
  allKeys(obj) {
    if(obj === null || !(typeof obj === 'object' || typeof obj === 'function')) { return []; }
    
    var keys = Object.getOwnPropertySymbols(obj).concat(Object.getOwnPropertyNames(obj))
    return _.sortBy(keys)
  }
  
  renderIterable(contentNode, obj) {
    if (!contentNode) return
    contentNode.innerHTML = ""
    var entries = []
    try {
      entries = obj.entries() // illegal invocation?
    } catch(e) {
      //do nothing
    }
    
    for(let [key, value] of entries) {
      const node = this.display(value, true, key)
      if (node) contentNode.appendChild(node);   
    }
  }
  
  expandTemplate(node) {
    return <span class='syntax'><a class='expand'>{node.isExpanded ? 
      <span style='font-size:9pt'>&#9660;</span> : 
      <span style='font-size:7pt'>&#9654;</span>
    }</a></span>;
  }
  
  contentTemplate(content) {
    return <span id='content'><a id='more' class='more'>{content ? content : "..."}</a></span>;
  }
  
  /*MD # Handlers MD*/
  
  attachHandlers(node, obj, name, renderCall = "render") {
    node.target = obj;
    var moreNode = node.querySelector("#more");
    if (moreNode) {
      moreNode.onclick = evt => {
        this[renderCall](node, obj, true, name);
      };
    }
    node.querySelectorAll(".expand").forEach(expandNode => {
      expandNode.onclick = evt => {
        this[renderCall](node, obj, !node.isExpanded, name);
      }
    });
    const tagNode = node.querySelector("#tagname");
    if (tagNode) tagNode.addEventListener('click', evt => {
      this.onSelect(node, obj);
    });
  }
  
  /*
   * called, when selecting a subobject 
   */
  onSelect(node, obj) {
    if (this.selectedNode) {
      this.selectedNode.classList.remove("selected");
    }
    this.selectedNode = node;
    this.selectedNode.classList.add("selected");
  
    this.selection = obj;
    lively.showElement(obj);
    window.that = obj; // #Experimental
    this.get("#editor").doitContext = obj;
    this.dispatchEvent(new CustomEvent("select-object", {detail: {node: node, object: obj}}));
  }
  
  onContextMenu(evt) {
    if (this.targetObject && !evt.shiftKey) {
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
  }
/*MD # View State MD*/
  
  getViewState() {
    return this.captureViewState(this.container.childNodes[0])
  }
  
  setViewState(state) {
    return this.applyViewState(this.container.childNodes[0], state)
  }
  
  applyViewState(node, state) {
    if (!node.querySelector) return; // text node
    
    this.expandNode(node)
    var content = node.querySelector("#content")
    if (content) {
      var children = _.filter(content.childNodes, 
        ea => ea.classList.contains("element"))
      state.children.forEach( ea => {
        var child = children.find( c => c.pattern == ea.pattern)
        if (child) this.applyViewState(child, ea) 
      })
    }
  }
  
  expandNode(node) {
    if (node.isExpanded) return
    this.render(node, node.target, true)
  }
  
  captureViewState(node) {
    var result =  { 
      pattern: node.pattern,
      children: []}
      
    if (!node.querySelector) return result; // text node

    var content = node.querySelector("#content")
    if (content) {
      _.filter(content.childNodes, ea => ea.isExpanded).forEach(ea => {
        result.children.push(this.captureViewState(ea))        
      })
    }
    return result
  }
  
  updatePatterns(node) {
    if (!node.target) {
      node.pattern = "NOTARGET"
    }
    var content = node.querySelector("#content")
    if (content) {
      content.childNodes.forEach( ea => {
        this.updatePatterns(ea);
      })
    }
  }
  
/*MD # Lively Integration MD*/
  
  async livelyExample() {
    const syntaxPlugins = (await Promise.all([
        'babel-plugin-syntax-jsx',
        'babel-plugin-syntax-do-expressions',
        'babel-plugin-syntax-function-bind',
        'babel-plugin-syntax-async-generators'
      ]
        .map(syntaxPlugin => System.import(syntaxPlugin))))
        .map(m => m.default);
    
    const url = lively4url + "/src/components/tools/lively-ast-inspector.js";
    const src = await fetch(url).then(r => r.text());
    const ast = babel.transform(src, {
        babelrc: false,
        code: false,
        comments: true,
        compact: false,
        plugins: syntaxPlugins,
    }).ast;
    
    this.inspect(ast);
  }
}