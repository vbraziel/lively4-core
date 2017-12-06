import Morph from "src/components/widgets/lively-morph.js"

import { Graph, _, TAG_URL } from 'src/client/triples/triples.js';

export default class KnotView extends Morph {
  get urlString() { return this.get("#path-to-load").value; }
  get tagURLString() { return TAG_URL; }
  
  async initialize() {
    this.windowTitle = "Knot View";

    var pathToLoad = this.get("#path-to-load");
    pathToLoad.addEventListener('keyup',  event => {
      if (event.keyCode == 13) { // ENTER
        this.onPathEntered(this.urlString);
      }
    });
    
    let aceComp = this.get('#content-editor');
    aceComp.editor.setOptions({maxLines:Infinity});

    let urlToLoad = this.getAttribute('data-knot-url');
    if (urlToLoad && urlToLoad !== "") {
      this.loadKnotForURL(urlToLoad);
    }
  }
  
  buildMetadata(knot) {
    const metadataTable = this.get("#metadata-table");
    metadataTable.innerHTML = "";
    
    for (const [key, value] of Object.entries(knot.getMetadata())) {
      metadataTable.appendChild(<tr>
        <td>{key}</td>
        <td>{value}</td>
      </tr>);
    }
  }
  
  buildNavigatableLinkFor(knot) {
    return <a click={e => this.loadKnotForURL(knot.fileName)}>
      {knot.label()}
    </a>;
  }
  buildRefFor(knot) {
    return this.buildNavigatableLinkFor(knot);
  }
  buildTableDataFor(knot) {
    return <td>
      {this.buildRefFor(knot)}
      <i class="fa fa-search" click={e => {
        lively.openInspector(knot, undefined, knot.label());
      }}></i>
    </td>;
  }
  buildTableRowFor(triple, knot1, knot2) {
    return <tr>
      {this.buildTableDataFor(knot1)}
      {this.buildTableDataFor(knot2)}
      {this.buildTableDataFor(triple)}
    </tr>;
  }
  async replaceTableBodyFor(selector, s, p, o, propForFirstCell, propForSecondCell) {
    let graph = await Graph.getInstance();
    let poTableBody = this.get(selector + ' tbody');
    poTableBody.innerHTML = "";
    graph.query(s, p, o).forEach(triple => {
      poTableBody.appendChild(
        this.buildTableRowFor(
          triple,
          triple[propForFirstCell],
          triple[propForSecondCell]
        )
      );
    });
  }
  
  async loadKnotForURL(url) {
    return this.loadKnot(url);
  }
  async loadKnot(url) {
    let graph = await Graph.getInstance();
    let knot = await graph.requestKnot(new URL(url));
    
    this.get("#path-to-load").value = knot.url;
    this.get("#label").innerHTML = knot.label();
    
    let deleteKnot = this.get('#delete-button');
    deleteKnot.onclick = event => this.deleteKnot(event);

    // URLs
    let urlList = this.get("#url-list");
    urlList.innerHTML = "";
    graph.getUrlsByKnot(knot).forEach(url => {
      function isExternalLink(url) {
        try {
          return Graph.isExternalURL(new URL(url));
        } catch(e) {
          return false;
        }
      }
      
      async function followURL(e) {
        if(isExternalLink(url)) {
          window.open(url);
        } else {
          const container = await lively.openBrowser(url, false);
          container.focus();
        }
        e.preventDefault();
        e.stopPropagation();
        return true;
      }

      urlList.appendChild(<li click={followURL}>
        {isExternalLink(url) ?
          url + '<i class="fa fa-external-link"></i>' :
          url
        }
      </li>);
    });
    
    // Tags
    let tag = await graph.requestKnot(new URL(TAG_URL));
    let tagContainer = this.get('#tag-container');
    tagContainer.innerHTML = "";
    graph.query(knot, tag, _).forEach(triple => {
      let tagElement = this.buildTagWidget(triple.object, triple);
      tagContainer.appendChild(tagElement);
    });
    this.get('#add-tag').onclick = event => this.addTag(event);

    // spo tables
    this.replaceTableBodyFor('#po-table', knot, _, _, 'predicate', 'object');
    this.replaceTableBodyFor('#so-table', _, knot, _, 'subject', 'object');
    this.replaceTableBodyFor('#sp-table', _, _, knot, 'subject', 'predicate');

    // add button behavior
    this.get('#add-triple-as-subject').onclick = evt => this.addTripleWithKnotAsSubject(evt);
    this.get('#add-triple-as-predicate').onclick = evt => this.addTripleWithKnotAsPredicate(evt);
    this.get('#add-triple-as-object').onclick = evt => this.addTripleWithKnotAsObject(evt);

    // metadata
    //this.buildMetadata(knot);
    
    // content
    this.buildContentFor(knot);

  }
  
  buildTagWidget(tag, triple) {
    return <div>
      {this.buildNavigatableLinkFor(tag)}
      {this.buildDeleteTagElement(triple)}
    </div>;
  }
  buildDeleteTagElement(triple) {
    return <i class="fa fa-trash" click={e => {
      this.deleteTagTriple(triple);
    }}></i>;
  }
  async deleteTagTriple(triple) {
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(triple.fileName));
    
    if(await graph.deleteKnot(knot)) {
      this.refresh();
    } else {
      lively.notify(`did not delete tag ${triple.object.fileName}`);
    }
  }

  refresh() {
    this.loadKnot(this.urlString);
  }
  async deleteKnot() {
    const graph = await Graph.getInstance();
    const knot = await graph.requestKnot(new URL(this.urlString));
    
    if(await graph.deleteKnot(knot)) {
      const elementToRemove = this.parentElement.isWindow ? this.parentElement : this;
      elementToRemove.remove();
    } else {
      lively.notify(`did not delete knot ${this.urlString}`);
    }
  }
  
  async createAddTriple() {
    const addTriple = await lively.openComponentInWindow("add-triple");
    addTriple.afterSubmit = () => {
      addTriple.parentElement.remove();
      this.refresh();
    }
    return addTriple;
  }
  async addTag(event) {
    const addTriple = await this.createAddTriple();

    addTriple.setField('subject', this.urlString);
    addTriple.setField('predicate', this.tagURLString);
    addTriple.focus('object');
  }
  
  async addTripleWithKnotAsSubject() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('subject', this.urlString);
    addTriple.focus('predicate');
  }

  async addTripleWithKnotAsPredicate() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('predicate', this.urlString);
    addTriple.focus('subject');
  }

  async addTripleWithKnotAsObject() {
    const addTriple = await this.createAddTriple();

    addTriple.setField('object', this.urlString);
    addTriple.focus('subject');
  }

  buildListItemFor(knot, role) {
    return <li>{role}: {this.buildRefFor(knot)}</li>;
  }
  buildContentFor(knot) {
    let aceComp = this.get('#content-editor');
    let spoList = this.get('#spo-list');
    if(knot.isTriple()) {
      this.hide(aceComp);
      this.show(spoList);
      spoList.innerHTML = '';
      spoList.appendChild(this.buildListItemFor(knot.subject, 'Subject'));
      spoList.appendChild(this.buildListItemFor(knot.predicate, 'Predicate'));
      spoList.appendChild(this.buildListItemFor(knot.object, 'Object'));
    } else {
      this.show(aceComp);
      this.hide(spoList);
      aceComp.editor.setValue(knot.content);
      aceComp.enableAutocompletion();
      aceComp.aceRequire('ace/ext/searchbox');
      aceComp.doSave = async text => {
        await knot.save(text);
        this.refresh();
      }
    }
  }
  
  hide(element) { element.style.display = "none"; }
  show(element) { element.style.display = "block"; }

  onPathEntered(path) {
    this.loadKnotForURL(path);
  }
  
  livelyPrepareSave() {
    this.setAttribute("data-knot-url", this.urlString);
  }
}
