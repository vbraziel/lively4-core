import scriptManager from  "src/client/script-manager.js";
// import * as persistence from  "src/client/persistence.js";
import Morph from "src/components/widgets/lively-morph.js";
import {pt} from '../graphics.js';
import { through } from "utils";

// import html from "scr/client/html.js"

// store promises of loaded and currently loading templates

if (!self.lively4loadingPromises) {
  self.lively4loadingPromises = {} // just to be on the save side....
}
export var loadingPromises = self.lively4loadingPromises;

// #MetaNote #UserCase this is an example for preserving module internal state while reloading a module
var _templates;
var _prototypes;
var _proxies;

var _templatePaths;
var _templatePathsCache;
var _templatePathsCacheTime;

var _templateFirstLoadTimes = {}

// for compatibility
export function register(componentName, template, prototype) {
  return ComponentLoader.register(componentName, template, prototype);
}

/* #FutureWork should interactive state change of "(module) global" state be preserved while reloading / developing modules
    ComponentLoader.foo = 3
    ComponentLoader.foo

#Discussion

pro) expected in Smalltalk-like developent and live-programmning experience
contra) gap between development-time and runtime (those manualy changes could make something work that without it won't...)

synthese) if modules and classes are also objects that can have run-time-specific state they should be migrated the same as objects. 

*/


export default class ComponentLoader {

  static get templates() {
    if (!_templates) _templates = {};
    return _templates;
  }

  static get prototypes() {
    if (!_prototypes) _prototypes = {};
    return _prototypes;
  }

  static get proxies() {
     if (!_proxies) _proxies = {};
    return _proxies;
  }

  static updatePrototype(aClass, moduleName) {    
    var componentName = moduleName.replace(/.*\//,"").replace(/\.js$/,"")
    if (componentName && this.prototypes[componentName]) {
      this.prototypes[componentName] = aClass
      this.proxies[componentName].__proto__ = aClass
      this.proxies[componentName].prototype.__proto__ = aClass.prototype
    }
  }

  static async onCreatedCallback(object, componentName) {
    // console.log('onCreatedCallback ' + componentName)
    // if (persistence.isCurrentlyCloning()) {
    //   return;
    // }
    
    // if (componentName == "lively-code-mirror") {
    //   debugger
    // }

//     if (!object.shadowRoot) {
//     // #Deprecation
//       // Element.createShadowRoot is deprecated and will be removed in M73, around March 2019. Please use Element.attachShadow instead. See https://www.chromestatus.com/features/4507242028072960 
//       var shadow = object.createShadowRoot();
//       // #NotWorkingYet as expected...
//       // var shadow = object.attachShadow({mode: 'open'});

//       // clone the template again, so when more elements are created,
//       // they get their own copy of elements
//       var clone = document.importNode(ComponentLoader.templates[componentName], true);
//       // #TODO replace the "template" reference with an indirection that can be changed from the outside,
//       // e.g. var clone = document.importNode(this.templates[componentName], true);
//       // but beeing able to modify it, because we have a reference should suffice at the moment...

//       shadow.appendChild(clone);
//     }

      
    // attach lively4scripts from the shadow root to this
    scriptManager.attachScriptsFromShadowDOM(object);
    
    // attach lively4script from the instance
    scriptManager.findLively4Script(object, false);

    if (ComponentLoader.prototypes[componentName].createdCallback) {
      ComponentLoader.prototypes[componentName].createdCallback.call(object);
    }

    // load any unknown elements, which this component might introduce
    // console.log('START onCreatedCallback loadUnresolved ' + componentName)
            
    this._livelyLoading = Promise.resolve()
    this._livelyLoadingDep =  ComponentLoader.loadUnresolved(
        object, true, "onCreated " + componentName, false).then((args) => {
      // console.log('FINISHED onCreatedCallback loadUnresolved ' + componentName)

      // lively.fillTemplateStyles(object.shadowRoot, "source: " + componentName).then(() => {
        // call the initialize script, if it exists
      
        if (typeof object.initialize === "function") {
          object.initialize();
        }
        // console.log("dispatch created " +componentName )
        // console.log("Identitity: " + (window.LastRegistered === object))
        
      // })
      if (_templateFirstLoadTimes[componentName]) {
        // console.log('Component first load time: ' + ((performance.now() - _templateFirstLoadTimes[componentName]) / 1000).toFixed(3) + "s " + componentName + " ")
        _templateFirstLoadTimes[componentName] = null;
      }
      // console.log("LOADER fire created " + componentName)
      object._lively4created = Date.now()
      object.dispatchEvent(new Event("created")); // when we wait on other unresolved components, we can run into cyclic dependencies.... #Cyclic
    }).catch( e => {
      console.error(e); 
      return e
    });
    this._livelyLoadingDep
  }
  
  static async onAttachedCallback(object, componentName) {
    
    if (this._livelyLoading) {
      await this._livelyLoading // should we provicde this robustness here? Or should these be more pure metal...
    }
    
    // console.log("onAttachedCallback " + componentName)
    
    // if (ComponentLoader.proxies[componentName]) {
    //   console.log("[component loader] WARNING: no proxy for " + componentName )
    //   return 
    // }

    if (object.attachedCallback && 
      ComponentLoader.proxies[componentName].attachedCallback != object.attachedCallback) {
        object.attachedCallback.call(object);
    } else if (ComponentLoader.prototypes[componentName].attachedCallback) {
      ComponentLoader.prototypes[componentName].attachedCallback.call(object);
    }
  }
  
  static async onDetachedCallback(object, componentName) {
    
    if (this._livelyLoading) {
      await this._livelyLoading
    }
    
    // if (ComponentLoader.proxies[componentName]) {
    //   console.log("[component loader] WARNING: no proxy for " + componentName )
    //   return 
    // }
    
    if (object.detachedCallback 
    && ComponentLoader.proxies[componentName].detachedCallback != object.detachedCallback) {
      object.detachedCallback.call(object);
    } else if (ComponentLoader.prototypes[componentName].detachedCallback) {
      ComponentLoader.prototypes[componentName].detachedCallback.call(object);
    }
  }
  
  static applyTemplate(element, componentName) {
    if (!element.shadowRoot) {
      element.attachShadow({mode: 'open'});
    }
    
    var template = this.templates[componentName]
    if (template) {
      var fragment = template.cloneNode(true)
      fragment.childNodes.forEach(ea => {
        var clone = document.importNode(ea, true)
        element.shadowRoot.appendChild(clone)
      })
    }
  }
  
  // this function registers a custom element,
  // it is called from the bootstap code in the component templates
  static async register(componentName, template, aClass) { 
    // console.log("LOADER register " + componentName)
    var proxy
    
    // For reflection and debugging
    this.templates[componentName] = template;
    this.prototypes[componentName] = aClass;
    
    if (template) {
      await lively.fillTemplateStyles(template, "source: " + componentName)
    }
    
    if (!this.proxies[componentName]) {
      proxy = class extends HTMLElement {
        static get name() {
          return componentName
        } 
        
        get _lively4version() {
          return 2
        }
        
        constructor() {
          // console.log("LOADER Proxy Constructor " + componentName)
    
          super(); // always call super() first in the constructor.
          
          ComponentLoader.applyTemplate(this, componentName)
          ComponentLoader.onCreatedCallback(this, componentName)
        }

        connectedCallback( args) {
          // console.log('connectedCallback ' + componentName )
          
          
          // return super.connectedCallback(...args)
          // super seams to bind early?
          ComponentLoader.onAttachedCallback(this, componentName)
          if (this.constructor.__proto__.prototype.connectedCallback) {
            return this.constructor.__proto__.prototype.connectedCallback.apply(this, args)
          }
        }
        disconnectedCallback(...args) {
          // return super.disconnectedCallback(...args)
          ComponentLoader.onDetachedCallback(this, componentName)
          if (this.constructor.__proto__.prototype.disconnectedCallback) {
            return this.constructor.__proto__.prototype.disconnectedCallback.apply(this, args)
          }
        }

        adoptedCallback(...args)	{
          // return super.adoptedCallback(...args)
          if (this.constructor.__proto__.prototype.adoptedCallback) {
            return this.constructor.__proto__.prototype.adoptedCallback.apply(this, args)  
          }
        }
      }
      window.customElements.define(componentName, proxy);
      this.proxies[componentName] =  proxy
    } else {
      proxy = this.proxies[componentName] 
    }
      
    proxy.__proto__ = aClass
    proxy.prototype.__proto__ = aClass.prototype
    

  
  }

  // this function creates the bootstrap script for the component templates
  static createRegistrationScript(componentId) {
    var script = document.createElement("script");
    script.className = "registrationScript";
    script.innerHTML = "lively.registerTemplate()";
    return script;
  }

  // this function loads all unregistered elements, starts looking in lookupRoot,
  // if lookupRoot is not set, it looks in the whole document.body,
  // if deep is set, it also looks into shadow roots
  static loadUnresolved(lookupRoot, deep, debuggingHint, withChildren=false, withyourself=false) {
    lookupRoot = lookupRoot || document.body;

    var selector = ":not(:defined)";
    var unresolved = []
    
    // check if lookupRoot is unresolved
    
    // loot at me
    if (withyourself && lookupRoot.parentElement) {
      var unresolvedSiblingsAndMe = Array.from(lookupRoot.parentElement.querySelectorAll(selector));
      if (unresolvedSiblingsAndMe.includes(lookupRoot)) {
        unresolved.push(lookupRoot)
      }
    }
    // find all unresolved elements looking downwards from lookupRoot
    
    // look at my children? 
    if (withChildren) {
      unresolved = unresolved.concat(Array.from(lookupRoot.querySelectorAll(selector)));
    }
    
    // look into the shadow?
    if (deep) {
      var deepUnresolved = findUnresolvedDeep(lookupRoot);
      unresolved = unresolved.concat(deepUnresolved);
    }

    function findUnresolvedDeep(root) {
      var shadow = root.shadowRoot;
      if (!shadow) {
        return [];
      }

      var result = Array.from(shadow.querySelectorAll(selector));

      Array.from(shadow.children).forEach((child) => {
        result = result.concat(findUnresolvedDeep(child));
      });

      return result;
    }

    // helper set to filter for unique tags
    var unique = new Set();
    
    
    var __debugOpenPromisedComponents = new Set()
    
    var promises = unresolved.filter((el) => {
      // filter for unique tag names
      if (!el.nodeName || el.nodeName.toLowerCase() == "undefined") return false;
      var name = el.nodeName.toLowerCase();
      return !unique.has(name) && unique.add(name);
    })
    .map((el) => {
      var name = el.nodeName.toLowerCase();
      if (loadingPromises[name]) {
        // the loading was already triggered
        return loadingPromises[name];
      }

      __debugOpenPromisedComponents.add(name)
      // create a promise that resolves once el is completely created
      var createdPromise = new Promise((resolve, reject) => {
        if (el._lively4created) {
          return resolve({target: el})
        }
        el.addEventListener("created", (evt) => {
          evt.stopPropagation();
          __debugOpenPromisedComponents.delete(name)
          resolve(evt);
        });
      });

      // trigger loading the template of the unresolved element
      loadingPromises[name] = createdPromise;
      
      loadingPromises[name].name = "[Loaded " +name + " " + Date.now() + "]"
      
      this.loadByName(name).then((didInsertTag) => {
        if(!didInsertTag) {
          console.error("Component Loader", `Template ${name} could not be loaded.`, 3, null, "yellow");
          delete loadingPromises[name];
          return null;
        }
      })
      

      return createdPromise;
    })
    .filter(promise => promise != null);
    
    
    // if (unique.has("lively-hand")) {
    //   debugger
    // }
    
    // console.log("findUnresolvedDeep components: ", promises)

    // return a promise that resolves once all unresolved elements from the unresolved-array
    // are completely created
    return new Promise( (resolve, reject) => {
      
      // fuck promises!!!! I hate them. There is one promise pending.... but just does not fail. It just hangs around doing nothing! #Jens
      promises.forEach( p => {
        p.then( r => {
          p.finished = true;
        }, er => console.log("ERROR in promise: " + p.name))
        
      })
      window.setTimeout( function() {
        var unfinished = false;
        var unfinishedPromise;
        promises.forEach( p => {
          if (!p.finished) {
            unfinishedPromise = p
            unfinished = true;
          }
        })
        if (unfinished) {
          debugger
          resolve("timeout") // "(if) the fuel gauge breaks, call maintenance. If they are not there in 20 minutes, fuck it."
          console.warn("Timout due to unresolved promises, while loading " + unfinishedPromise.name + " context: " + debuggingHint, " unresolved: " + Array.from(__debugOpenPromisedComponents).join(", ") )
        }
      }, 20 * 1000)

      Promise.all(promises).then( result => resolve(), err => {
          // console.log("ERROR loading component ", err)
      })
    })
  }
  
  
  static resetTemplatePathCache() {
    _templatePathsCache = undefined
    _templatePathsCacheTime = undefined
  }

  static async getTemplatePathContent(path) {
    // return  await fetch(path, { method: 'OPTIONS' }).then(resp => resp.json());
    
    if (!_templatePathsCache) {
      _templatePathsCache = {}
      _templatePathsCacheTime = {}
    } 
    let cacheInvalidationTime = 60 * 5 * 1000;
    let cached = _templatePathsCache[path]
    let time = _templatePathsCacheTime[path]
    if (cached && ((Date.now() - time) < cacheInvalidationTime)) return cached
    
    let resultPromise =  fetch(path, { method: 'OPTIONS' }).then(resp => {
      if (resp.status !== 200) return undefined
      return resp.json()
    });
    _templatePathsCacheTime[path] = Date.now()
    _templatePathsCache[path] = new Promise(async (resolve, reject) => {
      let result = await resultPromise;
      if (result) {
          resolve({contents: result.contents});
        return cached 
      }
    })
    return resultPromise 
  }
  
  static getTemplatePaths() {
    if (!_templatePaths) {
      _templatePaths = [
        lively4url + '/templates/',
        lively4url + '/src/components/',
        lively4url + '/src/components/widgets/',
        lively4url + '/src/components/tools/',
        lively4url + '/src/components/halo/',
        lively4url + '/src/components/demo/',
        lively4url + '/src/components/draft/',
        lively4url + '/src/components/d3/',
        lively4url + '/src/client/vivide/components/',
        lively4url + '/src/client/reactive/components/rewritten/',
        lively4url + '/src/client/reactive/components/basic/',
        lively4url + '/src/client/triples/components/',
        lively4url + '/src/client/pen-editor/components/',
        lively4url + '/src/babylonian-programming-editor/',
        lively4url + '/src/babylonian-programming-editor/demos/canvas/',
        lively4url + '/src/babylonian-programming-editor/demos/todo/',
      ]; // default
    } 
    return _templatePaths
  }

  static addTemplatePath(path) {
    if (!lively.files.isURL(path)) {
      path = lively.location.href.replace(/[^/]*$/, path)
    }
    var all = this.getTemplatePaths()
    if (!all.includes(path)) {
      all.push(path)
    }
  }

  static async searchTemplateFilename(filename) {
    
    var templatePaths =  this.getTemplatePaths()
    let templateDir = undefined;          
  
    // #IDEA, using HTTP HEAD could be faster, but is not always implemented... as ource OPTIONS is neigher
    // this method avoids the 404 in the console.log
    
    
    // the OPTIONS request seems to break karma... waits to long..
    if (!window.__karma__) { 
      for(templateDir of templatePaths) {
        try {
          var stats = await this.getTemplatePathContent(templateDir);
          var found = stats.contents.find(ea => ea.name == filename)
        } catch(e) {
          // console.log("searchTemplateFilename: could not get stats of  " + filename + " ERROR: ", e)
          found = null
        }
        if (found) {
          return templateDir + filename
        }
      }

    } else {
      // so the server did not understand OPTIONS, so lets ask for the files directly
      if (!found) {
        for(templateDir of templatePaths) {
          found = await fetch(templateDir + filename, { method: 'GET' }) // #TODO use HEAD, after implementing it in lively4-server
            .then(resp => resp.status == 200); 
          if (found) {
            return templateDir + filename
          }  
        } 
      }      
    }
    return undefined
  }
    
  static async loadByName(name) {
    // console.log("LOADER loadByName " + name)
    
    _templateFirstLoadTimes[name] = performance.now()
    var modUrl = await this.searchTemplateFilename(name + '.js')
    if (!modUrl) {
      throw new Error("Could not find template for " + name)
    }
    
    var templateURL = await this.searchTemplateFilename(name + '.html')
   
    // Check  if the template will be loadable (this would e.g. fail if we were offline without cache)
    // We have to check this before inserting the link tag because otherwise we will have
    // the link tag even though the template was not properly loaded
    try {
      let response = await fetch(modUrl, { method: 'OPTIONS'});
      if(response.ok) {
        var mod = await System.import(modUrl)
        var aClass = mod.default
        
        if (templateURL) {
          let templateResponse = await fetch(templateURL, { method: 'OPTIONS'});
          if(templateResponse.ok) {
            var templateSource = await fetch(templateURL).then(r => r.text());
            var div = document.createElement("div")
            div.innerHTML = templateSource
            var template = div.querySelector("template")
            template.remove()
          }          
        }
        this.register(name, template.content, aClass)
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  static createComponent(tagString) {
    var comp = document.createElement(tagString);
    return comp;
  }

  static async loadAndOpenComponent(componentName, immediate = () => {}) {
    var component = this.createComponent(componentName);
    
    const compPromise = this.openIn(<div />, component);
    immediate(component);
    
    return compPromise.through(comp => comp.remove());
  }
  
  static openIn(parent, component, beginning) {
    var created = false;
    var compPromise = new Promise((resolve) => {
      if (component._lively4created ) return resolve(component)
      
      component.addEventListener("created", (e) => {
        if (e.path[0] !== component) {
          // console.log("[components] ingnore and stop created event from child " + e.path[0].tagName);
          return 
        }
        if (created) {
          // #Just check... we had this issue before
          throw new Error("[compontents] created called twice for " + component)
        } else {
          created = true
          e.stopPropagation();
          resolve(e.target);
        }
        
      });
    });

    if (beginning) {
      parent.insertBefore(component, parent.firstChild);
    } else {
      parent.appendChild(component);
    }
    this.loadUnresolved(component, true, "openIn " + component, true, true);
    return compPromise;
  }

  static openInBody(component) {
    return this.openIn(document.body, component, true);
  }

  static async openInWindow(component, pos) {
    // this will call the window's createdCallback before
    // we append the child, if the window template is already
    // loaded
    var w = this.createComponent("lively-window");
    if (pos) {
      lively.setPosition(w, pos);
    }
    w.style.opacity = 0.2
    w.appendChild(component);

    this.openInBody(w);

    if (!component.localName.match(/-/)) {
      return w // standard elments... which are no components
    }
    
    // therefore, we need to call loadUnresolved again after
    // adding the child, so that it finds it and resolves it,
    // if it is currently unresolved
    var windowPromise = new Promise((resolve) => {
      this.loadUnresolved(document.body, true, "openInWindow " + component).then(() => {
        w.style.opacity = 1 
        if (component.windowTitle) 
          w.setAttribute('title', '' + component.windowTitle);

        resolve(w);
      });
    });

    return windowPromise;
  }

  static reloadComponent(source) {
    var template = lively.html.parseHTML(source).find(ea => ea.localName == "template");
    if (!template) return;
    var name = template.id;
    if (!name) return;
    var templateClone = document.importNode(template.content, true);
    ComponentLoader.templates[name] = templateClone;
    
    return lively.fillTemplateStyles(templateClone, "source: " + name).then( () => name);
  }
  
}



_templatePathsCache = null

