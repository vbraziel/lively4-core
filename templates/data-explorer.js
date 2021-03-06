"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { deepMapKeys } from 'src/client/rename_obj.js';
import { debounce } from "utils";

const visType1Conf = [
    {
      name: 'Name',
      type: 'primitive',
    },
    {
      name: 'Value',
      type: 'number',
    }
  ];

const visType2Conf = [
    {
      name: 'Name',
      type: 'primitive',
    },
    {
      name: 'Children',
      type: 'object',
      meta: [
        {
          name: 'Name',
          type: 'primitive'
        },
        {
          name: 'Size',
          type: 'number'
        }
      ]
    }
  ];


const visSettings = {
  'BubbleChart': visType1Conf,
  'BarChart': visType1Conf,
  'RadialTree': visType2Conf,
  'Tree': visType2Conf,
  /** TreeMap is not working correctly as it its position is not set correctly in d3-treemap
  'TreeMap': [
    {
      name: 'Name',
      type: 'string',
    },
    {
      name: 'Children',
      type: 'object',
      meta: [
        {
          name: 'Name',
          type: 'primitive'
        },
        {
          name: 'Size',
          type: 'primitive'
        }
      ]
    }
  ] **/
}

// map to lively-components
const visualizationComponents = {
  'BubbleChart': 'd3-bubblechart',
  'BarChart': 'd3-barchart-gh',
  'RadialTree': 'd3-radialtree',
  'Tree': 'd3-tree',
  'TreeMap': 'd3-treemap',
}

function getAllKeys(data) {
  return (
    data.reduce((keys, obj) => (
    keys.concat(Object.keys(obj).filter(key => (
      keys.indexOf(key) === -1))
    )
  ), [])
  );
}

export default class DataExplorer extends Morph {
  async initialize() {
    this.windowTitle = "DataExplorer";
    this.registerButtons()

    lively.html.registerKeys(this);
    
    Object.keys(visSettings).forEach(vis => this.get('#visTypeSelection').appendChild(<option value={vis}>{vis}</option>))
    

    this.get('#visTypeSelection').addEventListener("change", e => this.onVisualizationChange(e))
    this.get('#refinementEnd').addEventListener("change", e => {
      this.endIndex = e.target.value;
      this.sliceData();
    })
    
    this.get('#refinementStart').addEventListener("change", e => {
      this.startIndex = e.target.value;
      this.sliceData();
    })
    // get first value
    this.selectedVisualizationType = this.get('#visTypeSelection').value;
    this.settingsVisualization = visSettings[this.selectedVisualizationType];
    this.setupParameterVis();
    this.startIndex = 0;
    this.endIndex = 0;
    
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
    
    this.visualizationHeight = 400;
  }

  setData(data) {    
    this.originalData = data;
    this.data = data;
    this.createCountVariables();
    this.setupParameterVis();
    this.startIndex = 0;
    this.endIndex = this.data.length;
    
    this.get('#refinementStart').value = this.startIndex;
    this.get('#refinementEnd').value = this.endIndex;
    this.get('#refinementEnd').max = this.endIndex;
    this.get('#refinementStart').max = this.endIndex;
  }
  
  createCountVariables() {
    this.data.forEach(obj => {
      Object.keys(obj).forEach(key => {
        if(Array.isArray(obj[key])) {
         obj[key + 'COUNT'] = obj[key].length 
        }
      });
    });
  }
  
  sliceData() {
    this.data = this.originalData.slice(this.startIndex, this.endIndex);
    this.setupParameterVis();
  }

  onVisualizationChange(e) {
    this.selectedVisualizationType = e.target.value;
    this.settingsVisualization = visSettings[this.selectedVisualizationType];
    this.setupParameterVis();
  }
  
  setupParameterVis() {
    const parametersEl = this.get('#parameterSection');
    parametersEl.innerHTML = '';
    this.settingsVisualization.forEach(parameter => {
      let paraEl = <div class="col-3"></div>;
      if(parameter.type === 'object' && parameter.meta) {
        paraEl = <div class="col-5"></div>;
      }
      paraEl.appendChild(<span class="parameterName"><b>{parameter.name}</b> <i>({parameter.type}):</i></span>)
      const selection = <select id="name"></select>;
      selection.addEventListener("change", e => this.renderVisualization(e))

      parameter.selection = selection;
      
      if(this.data && this.data.length > 0) {
        // use first element as base for parameter selection;
        const fields = this.getPossibleFields(parameter);
        fields.forEach(field => {
          selection.appendChild(<option value={field}>{field}</option>);
        });
      }
      
      
      paraEl.appendChild(selection);
      this.setObjectParameters(parameter, paraEl);
      parametersEl.appendChild(paraEl);
    });
    this.renderVisualization();
  }
  
  setObjectParameters(parameter, parameterElement) {
    if(parameter.type === 'object') {
      if(parameter.meta) {
        parameter.meta.forEach(metaParameter => {
          const element = <div></div>;
          element.appendChild(<div class="parameterName">{metaParameter.name} <i>({metaParameter.type})</i>:</div>);
          const inputElement = <input></input>;
          inputElement.addEventListener("change", e => this.renderVisualization(e));
          element.appendChild(inputElement)
          metaParameter.input = inputElement;
          parameterElement.appendChild(<div class="row">{element}</div>);
        });
      }
    }
  }
  
  getPossibleFields(parameter) {
    let fields = [];
    switch(parameter.type) {
      case 'number':
        Object.keys(this.data[0]).forEach(field => {
          if(typeof this.data[0][field] === 'number'){
            fields.push(field);
          }
        }); 
        return fields;
      case 'object':
        Object.keys(this.data[0]).forEach(field => {
          if(typeof this.data[0][field] === 'object') {
            fields.push(field);
          }
        })
        return fields;
      case 'array of objects':
        break;
      case 'string':
        Object.keys(this.data[0]).forEach(field => {
          if(typeof this.data[0][field] === 'string'){
            fields.push(field);
          }
        }); 
        return fields;
      default:
        Object.keys(this.data[0]).forEach(field => {
          if(this.data[0][field] !== Object(this.data[0][field])){
            fields.push(field);
          }
        }); 
        return fields;
    } 
  }
  
  renderVisualization(e) {
    this.visualizationEL = this.get('#visualization');
    this.visualizationEL.innerHTML = '';
    switch(this.selectedVisualizationType) {
      case 'BubbleChart':
        this.renderBubbleChart();
        break;
      case 'BarChart':
        this.renderBarChart();
        break;
      case 'RadialTree':
        this.renderTreeType();
        break;
      case 'Tree':
        this.renderTreeType();
        break;        
      case 'PlainTree':
        this.renderTreeType();
        break;
      case 'TreeMap':
        this.renderTreeType();
        break;
      default:
        this.renderBubbleChart();
    }
  }
  
  async renderBubbleChart() {
    const bubbleChart = await lively.create(visualizationComponents[this.selectedVisualizationType]);    
    if(this.getBoundingClientRect().width > 10) {
      bubbleChart.setSize(this.getBoundingClientRect().width, this.visualizationHeight); 
    } else {
      bubbleChart.setSize(500, this.visualizationHeight); 
    }
    const data = {
      children: []
    }
    
    this.data.forEach(obj => {
      const dataObj = {};
      this.settingsVisualization.forEach(parameter => {
        const selectedField = parameter.selection.value;
        dataObj[parameter.name] = obj[selectedField];
      });
      data.children.push(dataObj)
    })
    bubbleChart.setData(data);
    this.visualizationEL.appendChild(bubbleChart);
  }
  
  async renderBarChart() {
    const barChart = await lively.create(visualizationComponents[this.selectedVisualizationType]);    
    const data = [];
    if(this.getBoundingClientRect().width > 10) {
      barChart.setSize(this.getBoundingClientRect().width, this.visualizationHeight); 
    } else {
      barChart.setSize(500, this.visualizationHeight); 
    }
    
    this.data.forEach(obj => {
      const dataObj = {};
      this.settingsVisualization.forEach(parameter => {
        const selectedField = parameter.selection.value;
        dataObj[parameter.name] = obj[selectedField];
      });
      data.push(dataObj)
    })
    barChart.setData(data);
    this.visualizationEL.appendChild(barChart);
  }
  
  async renderTreeType() {
    const vis = await lively.create(visualizationComponents[this.selectedVisualizationType]);
    
    const nameField =  this.settingsVisualization[0].selection.value;
    const childField = this.settingsVisualization[1].selection.value;
    
    const mapRename = {};
    
    mapRename[nameField] = 'name';
    mapRename[childField] = 'children';
    
    
    try {
      mapRename[this.settingsVisualization[1].meta[0].input.value] = 'name';  
    } catch(e) {
      lively.notify('Failed to find this value for name');
    }
    
    try {
      mapRename[this.settingsVisualization[1].meta[1].input.value] = 'size'; 
    } catch(e) {
      lively.notify('Failed to find this value for size');
    }
    
        
    vis.style.width = this.get('#content').getBoundingClientRect().width.toString() + 'px';
    vis.style.height = '100%';
    
    // rename all unused fields
    const allKeys = getAllKeys(this.data);
    allKeys.forEach(key => {
      if(!(key in mapRename)) {
        // assign a random string
        mapRename[key] = Math.random().toString(36).substring(7);
      }
    })
    
    const renamedObject = deepMapKeys({data: this.data}, key => (mapRename[key] || key))
    
    const data = {
      name: 'data',
      children: renamedObject.data,
    };
    
    vis.setTreeData(data);  
    this.visualizationEL.appendChild(vis);
  }
  
  livelyMigrate(other) {
    this.data = other.data;
    this.originalData = other.data;
  }
  
  onExtentChanged() {
    this.renderVisualization()
  }

  async livelyExample() {
    this.setData([{
      sha: "f0df88fd2775f37e023ad628ec7d35a082394b6b",
      author: {
        login: "userdummy",
        company: "companydummy"
      },
      comments: [{
          body: "comment1",
          line: 1,
          position: 10
        },
        {
          body: "comment2",
          line: 5,
          position: 12
        },
        {
          body: "comment3",
          line: 3,
          position: 1
        }
      ],
      tests: []
    }, {
      sha: "abc88fd2775f37e023ad628ec7d35a082394b6a",
      author: {
        login: "anon",
        company: null
      },
      comments: [{
        body: "comment4",
        line: 1,
        position: 1
      }],
      tests: [{
          sha: "f0df88fd2775f37e023ad628ec7d35a082394b6b"
        },
        {
          sha: "ghi88fd2775f37e023ad628ec7d35a082394b6a"
        },
        {
          sha: "jkl88fd2775f37e023ad628ec7d35a082394b6a"
        }
      ]
    }]);
  }


}
