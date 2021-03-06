# Object Graph

This is a prototype of an object graph using graphviz d3. 

### Features:
  - interactive exploration of graph (with transition)
  - variable graph layout engine
  - custom graph through "keys" function
    - allows to filter and add custom edges (e.g. ignore childNodes array and add direct edges to childNodes[0] etc)
  - custom presentation through "dataToDot" function
    - gray out not expanded nodes and edges
    - edges vs. inline structs

###  #TODO
  - extract as component (e.g. lively-object-graph)
  - provide customizable default implementation of "keys" and "dataToDot" that can be adapted to domain specific object graphs
    - pure HTML element hierrachy, AST, Callgraph, etc ...
  - context menu for nodes 
  - not initial transition animation
    
<script>
import ContextMenu from 'src/client/contextmenu.js';

(async () => {
   var vis = await (<d3-graphviz style="background:gray; width:1200px; height: 800px"></d3-graphviz>)
    
    vis.engine = "dot" 
    
    var menuItems = [
      ["graphviz engine", 
        ["dot", "neato", "fdp", "twopi", "circo"].map(ea => {
          return [ea,
            () => {
              vis.engine = ea  
              vis.setDotData(dataToDot(graph))
            }
          ]
        })
      ]
    ]
    
    vis.addEventListener("contextmenu",  evt => {
      ContextMenu.openIn(document.body, evt, this, undefined, menuItems);
      evt.stopPropagation();
      evt.preventDefault();
    });

    
    
    
    // vis.engine = "circo"
    
    var nodeMap = new Map()
    var objectToId = new Map()
    var idcounter = 1;
    function ensureId(obj) {
      var id = objectToId.get(obj) 
      if (!id) {
        id = idcounter++
        objectToId.set(obj, id) 
      }
      return "n" + id
    }
    // not serializable graph structure...
    var graph =  ensureNode(window.that || document.body)
    
    
    function ensureNode(obj) {
      var id = ensureId(obj)
      var node = nodeMap.get(id)
      
      if (!node) {
        node = {
          obj: obj,
          out: []
        }
        nodeMap.set(id, node)
      }
      return node
    }
    
    function collapseNode(graphNode) {
      graphNode.out = []
      graphNode.expanded = false
    }
    
    function expandNode(graphNode) {
      var edgeNames = keys(graphNode.obj);
      if (edgeNames) {
        graphNode.out = edgeNames.map(ea => {
          try {
            var value = eval("graphNode.obj." + ea) // vs graphNode.obj[ea], the former allows complex keys
          } catch(e) {
            value = "!ERROR!"
          }
          
          return {
            // edge
            label: ea,
            target: ensureNode(value)
          }
        })
      }
      graphNode.expanded = true
    }

    
    
    // function expandNode(graphNode) {
    //   var children = graphNode.obj.childNodes
    //   if (children) {
    //     graphNode.out = _.map(children, ea => {
    //       return {
    //         obj: ea,
    //         out: []
    //       }
    //     }).filter(ea => ! (ea.obj instanceof Text))
    //   }
    // }


    expandNode(graph)


    // customize range here...
    function keys(obj) {
      var keys = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(i) && !obj.__lookupGetter__(key) ) { //  
          keys.push(key);
        }
      }
      
      if (obj.childNodes) {
        for(var i=0; i< obj.childNodes.length; i++) {
          keys.push("childNodes[" + i + "]");
        }
      }
      
      if (obj.attributes) {
        for(var ea of obj.attributes) {
          keys.push(`getAttribute("${ea.name}")`);
        }
      }
      
      if (obj.parentElement) {
        keys.push(`parentElement`);
      }
      
      if (obj.shadowRoot) {
        keys.push(`shadowRoot`);
      }
      
      if (obj instanceof Text) {
        keys.push(`textContent`);
      }

      return keys;
    }

    function stripLabel(str) {
      return str.replace(/([^A-Za-z0-9 _.,;:<>\/\[\]])/g," ").slice(0,50)
    }

    function dataToDot(graphNode) {
      var edges = []
      var nodes = []
      var visited = new Set()
      function visit(node) {
        if (visited.has(node)) return
        visited.add(node)
        var id = ensureId(node.obj)
        var obj = node.obj
        var name = ("" +obj)
        //nodes.push(id + `[label="${name}"]`)
        // nodes.push(id + `[label=<<TABLE><TR><TD>left</TD><TD>right</TD></TR></TABLE>>]`)
        
        if (obj instanceof Object) {
          name = obj.constructor.name
        }
        name = stripLabel(name)
        
        var inner = [name] 
        
        if (node.out) {
          node.out.forEach(eaOut => {
            var targetObj = eaOut.target.obj
            if (_.isObject(targetObj)) {
              if (targetObj instanceof Text) {
                // ignore TextNodes
              } else {
                edges.push(ensureId(node.obj) + " -> " + ensureId(targetObj) + `[ label="${eaOut.label}" ` 
                    +`fontcolor="${ eaOut.target.expanded ? "black" : "gray"}" `
                   +`color="${ eaOut.target.expanded ? "black" : "gray"}" `
                  + `]`)
                visit(eaOut.target)
              }
            
            } else {
              if (targetObj !== null) {
                if (["class","id", "name"].includes(eaOut.label)) {
                  inner.push(eaOut.label + ": " + stripLabel("" + targetObj))                 
                } else if (eaOut.label.match("getAttribute")) {
                  inner.push(eaOut.label.replace(/getAttribute/,"@").replace(/[()"]+/g,"") + ": " + stripLabel("" + targetObj))                 
                } else {
                  // #TODO show details on demand?
                  inner.push(stripLabel(eaOut.label) + ": " + stripLabel("" + targetObj)) 
                }
                
                
              }
            }
          })
        }
        nodes.push(id + `[shape="record" label="{ ${inner.join("|")}}" ` 
          +`fontcolor="${ node.expanded ? "black" : "gray"}" `
          +`color="${ node.expanded ? "black" : "gray"}"]`)
      }
      visit(graphNode)
      return `digraph {
        graph [  splines="true"  overlap="false"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];

        ${edges.join(";")}
        ${nodes.join(";")}
      }`
    }
    
    
    var dotData = dataToDot(graph)
    vis.config({
      onclick(data, evt, element) {
        // lively.showElement(element)
        if(evt.ctrlKey) {
          lively.openInspector({
            data: data,
            node: nodeMap.get(data.key),
            element: element
          })
        } else {
          var node = nodeMap.get(data.key)
          if (node) {
            if (node.out.length == 0) {
              expandNode(node)
            } else {
              collapseNode(node)
            }
          
          }
          lively.showElement(element, 300).innerHTML = ""
          vis.update(dataToDot(graph))    
        }
      }
    })    

    vis.setDotData(dotData)
    
    return vis
  })()
</script>