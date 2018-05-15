// System imports
import Morph from 'src/components/widgets/lively-morph.js';
import { babel } from 'systemjs-babel-build';
const { traverse } = babel;

// Custom imports
import ASTWorkerWrapper from "./worker/ast-worker-wrapper.js";
import Timer from "./utils/timer.js";
import LocationConverter from "./utils/location-converter.js";
import {
  generateLocationMap,
  canBeProbed,
  canBeExample,
  canBeReplaced,
  canBeInstance,
  parameterNamesForFunctionIdentifier
} from "./utils/ast.js";
import { 
  loadFile,
  saveFile
} from "./utils/load-save.js";
import {
  defaultAnnotations,
  defaultTracker
} from "./utils/defaults.js";
import Probe from "./annotations/probe.js";
import Slider from "./annotations/slider.js";
import Example from "./annotations/example.js";
import Replacement from "./annotations/replacement.js";
import Instance from "./annotations/instance.js";

// Constants
const COMPONENT_URL = "https://lively-kernel.org/lively4/lively4-babylonian-programming/src/components/babylonian-programming-editor";
const USER_MARKER_KINDS = ["example", "replacement", "probe"];

/**
 * An editor for Babylonian (Example-Based) Programming
 */
export default class BabylonianProgrammingEditor extends Morph {
 
  /**
   * Loading the editor
   */
  
  initialize() {
    this.windowTitle = "Babylonian Programming Editor";
    
    // Lock evaluation until we are fully loaded
    this._evaluationLocked = true;
    
    // Worker for parsing
    this.worker = new ASTWorkerWrapper();
    
    // AST
    this._ast = null; // Node
    this._selectedPath = null; // NodePath

    // Pure text markers
    this._deadMarkers = []; // [TextMarker]
    
    // All Annotations
    this._annotations = defaultAnnotations;
    
    // Currently activated examples
    this._activeExamples = []; // [Example]

    // Timer to evaluate when user stops writing
    this.evaluateTimer = new Timer(300, this.evaluate.bind(this));
    
    // CodeMirror
    this.editorComp().addEventListener("editor-loaded", () => {
      // Patch editor to load/save comments
      this.livelyEditor().loadFile = this.load.bind(this);
      this.livelyEditor().saveFile = this.save.bind(this);
      
      // Test file
      this.livelyEditor().setURL(`${COMPONENT_URL}/demos/2_functions.js`);
      this.livelyEditor().loadFile();
      
      // Event listeners
      this.editor().on("change", () => {
        this.syncIndentations();
        this.evaluateTimer.start();
      });
      this.editor().on("beforeSelectionChange", this.onSelectionChanged.bind(this));
      this.editor().setOption("extraKeys", {
        "Ctrl-1": () => { this.addAnnotationAtSelection("probe") },
        "Ctrl-2": () => { this.addAnnotationAtSelection("example") },
        "Ctrl-3": () => { this.addAnnotationAtSelection("replacement") },
        "Tab": (cm) => { cm.replaceSelection("  ") },
      });
      
      // Inject styling into CodeMirror
      // This is dirty, but currently necessary
      fetch(`${COMPONENT_URL}/codemirror-inject-styles.css`).then(result => {
        result.text().then(styles => {
          const node = document.createElement('style');
          node.innerHTML = styles;
          this.editorComp().shadowRoot.appendChild(node);
        });
      });
    });
  }
  
  async load() {
    // Unlock evaluation after two seconds
    this._evaluationLocked = true;
    setTimeout(() => {
      this._evaluationLocked = false;
    }, 2000);
    
    // Remove all existing annotations
    for(let key in this._annotations) {
      for(let index in this._annotations[key]) {
        this._annotations[key][index].clear();
      }
    }
    this._annotations = defaultAnnotations();
    
    // Load file from network
    let text = await loadFile(this.livelyEditor());
    await this.parse();
    
    // Find annotations
    let annotations = null;
    const matches = text.match(/\/\* Examples: (.*) \*\//);
    if(matches) {
      annotations = JSON.parse(matches[matches.length-1]);
      text = text.replace(matches[matches.length-2], "");
    }
    
    // Set text
    this.livelyEditor().setText(text);
    await this.parse();
    
    // Add annotations
    if(annotations) {
      for(let probe of annotations.probes) {
        this.addProbeAtPath(this.pathForKey(probe.location));
      }
      for(let slider of annotations.sliders) {
        this.addSliderAtPath(this.pathForKey(slider.location));
      }
      for(let example of annotations.examples) {
        const obj = this.addExampleAtPath(this.pathForKey(example.location), false);
        obj.load(example);
      }
      for(let replacement of annotations.replacements) {
        const obj = this.addReplacementAtPath(this.pathForKey(replacement.location));
        obj.load(replacement);
      }
      for(let instance of annotations.instances) {
        const obj = this.addInstanceAtPath(this.pathForKey(instance.location));
        obj.load(instance);
      }
    }

    this.evaluate(true);
  }
  
  async save() {
    let serializedAnnotations = {};
    
    // Serialize annotations
    for(let key in this._annotations) {
      serializedAnnotations[key] = [];
      for(let annotation of this._annotations[key]) {
        serializedAnnotations[key].push(annotation.serializeForSave());
      }
    }
    const stringAnnotations = JSON.stringify(serializedAnnotations);
    
    // Save file
    let data = this.livelyEditor().currentEditor().getValue();
    data = `${data}/* Examples: ${stringAnnotations} */`;
    saveFile(this.livelyEditor(), data);
  }

  
  /**
   * Adding annotations
   */
  
  addAnnotationAtSelection(kind) {
    // Get selected path
    const path = this._selectedPath;
    if(!path) {
      throw new Error("The selection is not valid");
    }
    
    // Add annotation
    switch(kind) {
      case "probe":
        // Decide if we mean a probe or a slider
        if(path.isLoop()) {
          this.addSliderAtPath(path);
        } else {
          this.addProbeAtPath(path);
        }
        break;
      case "example":
        // Decide if we mean an example or an instance
        if(path.parentPath.isClassDeclaration()) {
          this.addInstanceAtPath(path);
        } else {
          this.addExampleAtPath(path);
        }
        break;
      case "replacement":
        this.addReplacementAtPath(path);
        break;
      default:
        throw new Error("Unknown annotation kind");
    }
  }
  
  addProbeAtPath(path) {
    // Make sure we can probe this path
    if(!canBeProbed(path)) {
      return;
    }
    
    // Add the probe
    const probe = new Probe(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this._activeExamples,
      this.removeAnnotation.bind(this)
    );
    this._annotations.probes.push(probe);
    
    this.enforceAllSliders();
    this.evaluate();
    return probe;
  }

  addSliderAtPath(path) {
    // Make sure we can probe this path
    if(!canBeProbed(path)) {
      return;
    }
    
    // Add the slider
    const slider = new Slider(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onSliderChanged.bind(this),
      this._activeExamples,
      this.removeAnnotation.bind(this)
    );
    this._annotations.sliders.push(slider);
    
    this.evaluate();
    return slider;
  }

  addExampleAtPath(path, isOn = true) {
    // Make sure we can probe this path
    if(!canBeExample(path)) {
      return;
    }
    
    // Add the example
    const example = new Example(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this),
      this.onExampleStateChanged.bind(this),
      isOn
    );
    this._annotations.examples.push(example);
    
    if(isOn) {
      this._activeExamples.push(example);
    }
    
    this.evaluate();
    return example;
  }
  
  addReplacementAtPath(path) {
    // Make sure we can replace this path
    if(!canBeReplaced(path)) {
      return;
    }
    
    // Add the replacement
    const replacement = new Replacement(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this)
    );
    this._annotations.replacements.push(replacement);
    
    this.evaluate();
    return replacement;
  }
  
  addInstanceAtPath(path) {
    // Make sure we can add an instance to this path
    if(!canBeInstance(path)) {
      return;
    }
    
    // Add the instance
    const instance = new Instance(
      this.editor(),
      LocationConverter.astToMarker(path.node.loc),
      this.onEvaluationNeeded.bind(this),
      this.removeAnnotation.bind(this)
    );
    this._annotations.instances.push(instance);
    
    this.evaluate();
    return instance;
  }
  
  
  /**
   * Updating annotations
   */
  
  syncIndentations() {
    for(let key in this._annotations) {
      for(let annotation of this._annotations[key]) {
        annotation.syncIndentation();
      }
    }
  }
  
  updateAnnotations() {
    // Update sliders
    for(let slider of this._annotations.sliders) {
      const node = this.nodeForAnnotation(slider).body;
      if(window.__tracker.blocks.has(node._id)) {
        slider.maxValues = window.__tracker.blocks.get(node._id);
      } else {
        slider.empty();
      }
    }
    
    // Update probes
    for(let probe of this._annotations.probes) {
      const node = this.nodeForAnnotation(probe);
      if(window.__tracker.ids.has(node._id)) {
        probe.values = window.__tracker.ids.get(node._id);
      } else {
        probe.empty();
      }
    }
    
    // Update examples
    for(let example of this._annotations.examples) {
      if(example.default) {
        continue;
      }
      const path = this.pathForAnnotation(example);
      example.keys = parameterNamesForFunctionIdentifier(path);
    }
  }

  updateDeadMarkers() {
    // Remove old dead markers
    this._deadMarkers.map(m => m.clear());

    // Add new markers
    const that = this;
    traverse(this._ast, {
      BlockStatement(path) {
        if(!window.__tracker.executedBlocks.has(path.node._id)) {
          const markerLocation = LocationConverter.astToMarker(path.node.loc);
          that._deadMarkers.push(
            that.editor().markText(
              markerLocation.from,
              markerLocation.to,
              {
                className: "marker dead"
              }
            )
          );
        }
      }
    });
  }
  
  enforceAllSliders() {
    for(let slider of this._annotations.sliders) {
      slider.fire();
    }
  }
  
  removeAnnotation(annotation) {
    for(let key in this._annotations) {
      if(this._annotations[key].includes(annotation)) {
        this._annotations[key].splice(this._annotations[key].indexOf(annotation), 1);
      }
    }
    annotation.clear();
    this.evaluate();
  }
  
  
  /**
   * Evaluating code
   */
  
  async parse() {    
    // Serialize annotations
    let serializedAnnotations = {};
    for(let key of ["probes", "sliders", "replacements", "instances"]) {
      serializedAnnotations[key] = this._annotations[key].map((a) => a.serializeForWorker());
    }
    serializedAnnotations.examples = this._activeExamples.map((a) => a.serializeForWorker());

    // Call the worker
    const { ast, code } = await this.worker.process(
      this.editor().getValue(),
      serializedAnnotations
    );
    if(!ast) {
      return;
    }

    this._ast = ast;

    // Post-process AST
    // (we can't do this in the worker because it create a cyclical structure)
    generateLocationMap(ast);
    
    return code;
  }
  
  async evaluate(ignoreLock = false) {
    if(this._evaluationLocked && !ignoreLock) {
      return;
    }
    
    // Parse the code
    const code = await this.parse()
    if(!code) {
      return;
    }

    // Execute the code
    console.log("Executing", code);
    this.execute(code);
  }
  
  execute(code) {
    // Prepare result container
    window.__tracker = defaultTracker();

    // Execute the code
    try {
      eval(code);
      // Show the results
      this.updateAnnotations();
      this.updateDeadMarkers();
    } catch (e) {
      console.warn("Could not execute code");
      console.error(e);
    }
  }

  
  /**
   * Event handlers
   */
  
  onSelectionChanged(instance, data) {
    // This needs an AST
    if(!this.hasWorkingAst()) {
      this._selectedPath = null;
      return;
    }
    
    // Get selected path
    const selectedLocation = LocationConverter.selectionToKey(data.ranges[0]);

    // Check if we selected a node
    if(selectedLocation in this._ast._locationMap) {
      this._selectedPath = this._ast._locationMap[selectedLocation];
    } else {
      this._selectedPath = null;
    }
  }

  onSliderChanged(slider, exampleId, value) {
    // Get the location for the body
    const node = this.nodeForAnnotation(slider);
    const bodyLocation = LocationConverter.astToKey({
      start: node.loc.start,
      end: node.body.loc.end
    });

    // Get all probes in the body
    const includedProbes = this._annotations.probes.filter((probe) => {
      const probeLocation = probe.locationAsKey;
      const beginsAfter = probeLocation[0] > bodyLocation[0]
                          || (probeLocation[0] === bodyLocation[0]
                              && probeLocation[1] >= bodyLocation[1]);
      const endsBefore = probeLocation[2] < bodyLocation[2]
                         || (probeLocation[2] === bodyLocation[2]
                             && probeLocation[3] <= bodyLocation[3]);
      return beginsAfter && endsBefore;
    });
    
    // Tell all probes about the selected run
    for(let probe of includedProbes) {
      probe.setActiveRunForExampleId(exampleId, value);
    }
  }
  
  onExampleStateChanged(example, newIsOn) {
    if(newIsOn) {
      this._activeExamples.push(example);
    } else {
      this._activeExamples.splice(this._activeExamples.indexOf(example), 1);
    }
    this.evaluate();
  }
  
  onEvaluationNeeded() {
    this.evaluate();
  }
  
  
  /**
   * Shortcuts
   */

  hasWorkingAst() {
    return (this._ast && this._ast._locationMap);
  }
  
  nodeForAnnotation(annotation) {
    const path = this.pathForAnnotation(annotation);
    if(path) {
      return path.node;
    }
    return null;
  }
  
  pathForAnnotation(annotation) {
    if(this.hasWorkingAst()) {
      return this.pathForKey(annotation.locationAsKey);
    }
    return null;
  }
  
  pathForKey(key) {
    return this._ast._locationMap[key];
  }
  
  livelyEditor() {
    return this.get("#source");
  }
  
  editorComp() {
    return this.livelyEditor().get("lively-code-mirror");
  }
  
  editor() {
    return this.editorComp().editor
  }
  
}