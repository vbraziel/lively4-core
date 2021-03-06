import Morph from 'src/components/widgets/lively-morph.js';
import AcademicSubquery from "src/components/widgets/academic-subquery.js";

var timeout;

export default class AcademicQuery extends Morph {
  constructor() {
    super();
  }
  
  async initialize() {
    this.updateView();
    
    // alternativ immer das AcademicQuery object mitgeben
    // und dem Bescheid geben, wenn ein update ist
    // (alles kacke)
    // idealerweise bemerkt der hier schon, wenn sich
    // irgendwo unter ihm Text ändert
    var observer = new MutationObserver((mutations) => {
      mutations.forEach(async mutation => {
        //lively.notify("SUPER observation", mutation.type)
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          if (mutation.type == "childList") {
            if (this.subquery) {
              this.textContent = await this.subquery.viewToQuery();
              var input = this.get('#queryInput');
              input.value = this.getQuery();
            }
          }
        }, 1000);
      })
    });
    
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      //attributeFilter: true // breaks for some reason
    };
    
    observer.observe(this.get('#pane'), config);
  }
  
  async setQuery(q) {
    var subquery = await (<academic-subquery id="main"></academic-subquery>);
    subquery.setQuery(q)
    
    this.textContent = q;
    this.subquery = subquery;
    
    this.updateView()
  }
  
  getQuery() {
    return this.textContent;
  }

  async updateView() {
    var pane = this.get("#pane")
    var queryView = <academic-subquery></academic-subquery>;
    if(this.subquery) {
      queryView = this.subquery;
    } else {
      lively.notify("Could not load query.");
    }
    var input = <input id="queryInput" value={this.textContent} style="width: 300px"></input>;
    var updateButton = <button click={() => this.setQuery(input.value)}>update</button>;
    var searchButton = <button click={() => lively.openBrowser("academic://expr:" + this.textContent + "?count=100")}>search</button>;
    
    pane.innerHTML = ""
    pane.appendChild(<div>
        <h1>Academic Query:</h1>
        {input} {updateButton} {searchButton}
        {queryView}
      </div>);
  }

  viewToQuery() {
    return this.subquery.textContent;
  }
  
  async livelyExample() {
    this.setQuery("Composite(AA.AuId = 2055148755)")
    //this.setQuery("And(Or(Y = '1985', Y = '2008'), Ti = 'disordered electronic systems')")
    //this.setQuery("And(O='abc', Y='1000')")
    //this.setQuery("Y='1000'")
  }
  
  
}