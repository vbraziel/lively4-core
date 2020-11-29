import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js";

const exampleQueries = [
  "Composite(AA.AuN='mike smith')",
  "Ti='indexing by latent seman'",
  "Ti=='indexing by latent semantic analysis'",
  "Composite(AA.AuN=='susan t dumais')",
  "Y=[2010, 2012)",
  "Y=[2010, 2012]",
  "Y<=2010",
  "Y>=2005",
  "Y<2010",
  "D>'2010-02-03'",
  "D=['2010-02-03','2010-02-05']",
  "D='2010-02-03'",
  "And(Y=1985, Ti='disordered electronic systems')",
  "Or(Ti='disordered electronic systems', Ti='fault tolerance principles and practice')",
  "And(Or(Y=1985,Y=2008), Ti='disordered electronic systems')",
  "Composite(And(AA.AuN='mike smith',AA.AfN='harvard university'))",
  "And(Composite(AA.AuN='mike smith'),Composite(AA.AfN='harvard university'))"
]


function createUILayer(object, key) {
  var subDiv = <div id="innerDiv" style="margin: 5px; border: 1px solid gray;">{key}</div>;
  var valueOrObject = object[key];
  if (typeof(valueOrObject) == "object") {
    Object.keys(valueOrObject).map(k => {
      subDiv.appendChild(createUILayer(valueOrObject, k));
    });
  } else {
    var input = <input value={valueOrObject}></input>;
    subDiv.appendChild(input);
  }
  return subDiv;
}


export default class LeoUIExample{
  static async create () {
    
//     var hello = <div id="helloDiv" draggable="true" click={() => lively.notify('hi')}>
//         Hi
//       </div>

//     var world = <div id="worldDiv">
//         World
//       </div>

//     let description = <p id="description"></p>

//     hello.addEventListener('dragstart', dragStart);
//     hello.addEventListener('dragend', dragEnd);

//     world.addEventListener('drop', drop);

    var g = ohm.grammar(
      `Academic { 
        Exp =
          AcademicQuery

        AcademicQuery = Attribute Comparator Value -- simple
          | ("And" | "Or") "(" AcademicQuery "," AcademicQuery ")" -- complex
          | "Composite(" CompositeQuery ")" -- composite
        CompositeQuery = Attribute "." Attribute Comparator Value -- simple
          | ("And" | "Or") "(" CompositeQuery "," CompositeQuery ")" -- complex

        Comparator =
          PartialComparator "="?
        PartialComparator =
          "=" | "<" | ">"

        Attribute (an attribute) =
          letter letter? letter?

        Value (a value) =
          "\'" alnum* "\'" -- string
          | Number
          | Date
          | ( "[" | "(" ) Number "," Number ( "]" | ")" ) -- numberRange
          | ( "[" | "(" ) Date "," Date ( "]" | ")" ) -- dateRange

        Number =
          digit+
          Date =
          "\'" Number "-" Number "-" Number "\'"
      }`
    );
    
    var s = g.createSemantics();
    
    s.addOperation(
      'interpret', {
        Exp: function(e) {
          return e.interpret();
        },
        
        AcademicQuery_simple: function(attribute, comparator, value) {
          return { [attribute.interpret()]: {
            "comparator": comparator.interpret(),
            "value": value.interpret(),
          }}
        },
        AcademicQuery_complex: function(conjunction, _1, left, _2, right, _3) {
          return {[conjunction.sourceString]:
                  Object.assign(left.interpret(), right.interpret())
                 }
        },
        AcademicQuery_composite: function(_1, query, _2) {
          return query.interpret();
        },
        
        CompositeQuery_simple: function(mainAttribute, _, secondaryAttribute, comparator, value) {
          // TODO: Don't set keys! Otherwise, queries on the same attribute will be overwritten
          return {[mainAttribute.interpret()]:
                  {[secondaryAttribute.interpret()]:
                    {
                      "comparator": comparator.interpret(),
                      "value": value.interpret(),
                    }
                  }
          }
        },
        CompositeQuery_complex: function(conjunction, _1, left, _2, right, _3) {
          return {[conjunction.sourceString]:
                  Object.assign(left.interpret(), right.interpret())
                 }
        },
        
        Comparator: function(main, secondary) {
          return [main.interpret(), secondary.sourceString].join('');
        },
        PartialComparator: function(comparator) {
          return comparator.sourceString;
        },
        
        Attribute: function(a, b, c) {
          return [a.interpret(), b.interpret(), c.interpret()].join('');
        },

        Value: function(value) {
          return value.interpret();
        },
        Value_string: function(_1, string, _2) {
          return string.sourceString;
        },
        Value_numberRange: function(leftBracket, nLeft, _, nRight, rightBracket) {
          return "TODO";//arguments.map(a => {a.sourceString}).join('');
        },
        Value_dateRange: function(leftBracket, dLeft, _, dRight, rightBracket) {
          return "TODO";//arguments.map(a => {a.sourceString}).join('');
        },
        
        Number: function(n) {
          return parseFloat(n.sourceString);
        },
        Date: function(_1, year, _2, month, _3, day, _4) {
          return new Date(year.interpret(),
                          month.interpret(),
                          day.interpret())
        },
                
        letter: function(a) {
          return a.sourceString;
        }
      }
    )
    
    // "Test"
    exampleQueries.forEach(q => {
      var m = g.match(q);
      if (m.failed()) {
        lively.notify("Failed query: ", q)
      } else {
        //lively.notify(q, s(m).interpret());
      }
    })
    

//     function dragStart(event) {
//       description.innerHTML = "dragging";
//       event.dataTransfer.setData("element", event.target.id);
//     }

//     function dragEnd(event) {
//       description.innerHTML = "";
//     }

//     function drop(event) {
//       event.preventDefault();
//       var data = event.dataTransfer.getData("element");
//       console.log("Datatransfer Types" + event.dataTransfer.types);
//       event.target.appendChild(lively.query(this, '#'+data))
//     }
    
    var query = "And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')";
    var match = g.match(query);
    var queryObject = s(match).interpret();
    
    var input = <input id="queryInput" value={query} style="width: 100%"></input>
    var div = <div id="outerDiv" style="padding-right : 20px">
          {input}
        </div>

    Object.keys(queryObject).forEach(key => {
      div.appendChild(createUILayer(queryObject, key));
    });
    
    return div;
  }
}