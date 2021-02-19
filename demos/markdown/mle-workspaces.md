# Workspace Example

This is an Example of a workspace embedded in HTML/Markdown that will persist it's code in browser local storage.
<lively-script><script>import focalStorage from 'src/external/focalStorage.js'; import {SocketSingleton} from 'src/components/mle/socket.js'; const idMap = new Map(); const enclosingDiv = <div />; var mle = {}; async function startUp(){ await SocketSingleton.get(); let i = 0; while(await focalStorage.getItem(`markdown_workspace_${i}`)){ await new Pane(i, await focalStorage.getItem(`markdown_workspace_${i}_kind`)).create(); i++; } } class Pane { constructor(id, kind){ if(id !== undefined){ this._id = id; this.kind = kind; } else { this._id = idMap.size; } idMap.set(this.textStorageId, this); } onDoIt() { this.saveText() this.workspace.tryBoundEval(this.workspace.value) } async onReset() { if(this.kind) this.socket = await SocketSingleton.reset(); this.logarea.value = "LOGS"; this.drawarea.innerHTML = ""; } get defaultText() { return "sql`SELECT * FROM students`" } get textStorageId() { return `markdown_workspace_${this._id}` } async loadText() { var loaded = await focalStorage.getItem(this.textStorageId); if (loaded) return loaded; return this.defaultText; } async saveText() { focalStorage.setItem(this.textStorageId, this.workspace.value); focalStorage.setItem(`${this.textStorageId}_kind`, this.kind); } log(s) { this.logarea.value += s + ""; } async create() { // #TODO #META style and pre tags are problematic in Markdown scripts this.kind = this.kind === undefined ? await lively.confirm("MLE Workspace? Ok for yes, Cancel for No.") : this.kind; var style = document.createElement("style"); style.textContent = ` lively-code-mirror { border: 1px solid gray; flex: 4; }`; var buttons = <div> <button click={() => {this.onDoIt()} }>DoIt</button> <button click={() => {this.onReset()} }>reset</button> </div>; this.workspace = await (<lively-code-mirror></lively-code-mirror>); this.workspace.value = await this.loadText(); this.workspace.doitContext = this; this.logarea = <textarea disabled style="flex: 2;"/>; this.logarea.value = "LOGS"; this.drawarea = <div></div>; if(this.kind){ this.workspace.boundEval = async function(s) { this.socket = this.socket || await SocketSingleton.get(); this.socket.emit("test", {id: this.textStorageId, func: "evaluate", parameters: [s]}); const value = await new Promise((res) => { this.socket.on("result", r => { if(!r) return; if(r.id !== this.textStorageId) return; console.log(r.data) res(JSON.parse(r.data)); }); }); this.outData = value; Object.defineProperty(window, `$${this._id}`, {configurable: true, value}); this.log(JSON.stringify(value)); this.saveText(); return {value}; } this.workspace.boundEval = this.workspace.boundEval.bind(this); } enclosingDiv.appendChild( <div style="padding: 10px; width:90%;"> {style} <h4>{this.kind ? "MLE" : "DOM"} Workspace ${this._id}</h4> {buttons} <div style="display: flex;"> {this.workspace} {this.logarea} </div> {this.drawarea} </div> ); } } startUp().then(t => <div> <button click={() => new Pane().create()}>New workspace</button> {enclosingDiv} </div>)</script> </lively-script>