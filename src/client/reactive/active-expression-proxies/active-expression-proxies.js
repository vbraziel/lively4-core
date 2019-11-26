import { BaseActiveExpression } from 'active-expression';

// if the mode is on, proxies register new active expression
window.__expressionAnalysisMode__ = false;

// any way to handle this more elegantly than in global state?
window.__currentActiveExpression__ = false;

export function wrap(what) {
  const handler = {
    get: (target, property) => {
      if (window.__expressionAnalysisMode__){
        target.dependentActiveExpressions.add(window.__currentActiveExpression__);
      }
      
      return Reflect.get(target, property);

    },

    set: (target, property, value) => {
      // reflect here as well?
      //if (!target[property]){
      //  return false
      //}
      
      // target[property] = value;
      Reflect.set(target, property, value);
      
      target.dependentActiveExpressions.forEach(
        (dependentActiveExpression) => dependentActiveExpression.notifyOfUpdate()
      )

      return true;
    }
  };
  
  what.dependentActiveExpressions = new Set();
  const proxy = new Proxy(what, handler);
  
  return proxy;
}


export function aexpr(func, ...arg) {  
  return new ProxiesActiveExpression(func, ...arg);
}

export class ProxiesActiveExpression extends BaseActiveExpression {
  constructor(func, ...args) {
    super(func, ...args);
    this.updateDependencies();
  }
  
  notifyOfUpdate() {
    this.updateDependencies();
    this.checkAndNotify();
  }
  
  updateDependencies() {
    window.__expressionAnalysisMode__ = true;
    
    window.__currentActiveExpression__ = this;

    this.func();
    window.__expressionAnalysisMode__ = false;
  }
}



