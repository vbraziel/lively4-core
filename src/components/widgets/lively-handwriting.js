
import Morph from 'src/components/widgets/lively-morph.js';
import {pt} from 'src/client/graphics.js';

/*MD 

# HandWriting 

## Based on Tom's Smalltalk Grafiti Implementation 

## Idea: 

- (1) Convert Strokes to a String of Directions
- (2) User Regular Expressions to match Characters

MD*/


export default class LivelyHandwriting extends Morph {
  async initialize() {
    this.windowTitle = "LivelyHandwriting";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods

    lively.addEventListener("livelyhandwriting", this, "mousedown", evt => this.onMouseDown(evt))
    lively.addEventListener("livelyhandwriting", this, "mousemove", evt => this.onMouseMove(evt))
    lively.addEventListener("livelyhandwriting", this, "mouseup", evt => this.onMouseUp(evt))
    
	
    this.recording = false;
    this.points = []
    this.text = ''
	
    lively.setExtent(this, lively.pt(600,300))
    
   // instanceVariableNames: 'points recording text'
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  onFirstButton() {
    lively.notify("hello")
  }

  
  async livelyExample() {
 
  }
  


  characterFromStrokes(aCollection, aPointCollection) {
     
    let seq = aCollection.map(ea => ea[0]).join(""); 
    
    
    this.get("#log").textContent = "seq=" +seq
    
    if(seq.match(/^r$/)) {return " "}
    if(seq.match(/^l$/)) {return "\b"}

    if(seq.match(/^ur?dl?r?$/)) {return "A"}
    if(seq.match(/^durdl?rd?l$/)) {return "B"}
    if(seq.match(/^u?ldru?$/)) {return "C"}
    if(seq.match(/^dur?dl$/)) {
      if ((this.pointInUpper(aPointCollection.last, 0.7, aPointCollection))) {
        return "P"
      } else {
        return  "D"
      }
    }
    if(seq.match(/^ld?r?l?d?r$/)) {return "E"}
    if(seq.match(/^lr?d$/)) {return "F"}
    if(seq.match(/^l?drul?rd?$/)) {
      if ((this.pointInUpper(aPointCollection.last, 0.2, aPointCollection))) {
        return "Q"
      } else {
        return  "G"
      }
    }
    if(seq.match(/^dr?u?r?d$/)) {return "H"}
    if(seq.match(/^d$/)) {return "I"}
    if(seq.match(/^dl$/)) {return "J"}
    if(seq.match(/^l?dlurdr?$/)) {return "K"}
    // if(seq.match(/^dr$/)) {return     ^ (aPointCollection last y > (self height * 0.6))) {returnL] ifFalse: [$4]} " potentially wonky, maybe relative? "
    if(seq.match(/^ur?dr?u?r?d$/)) {return "M"}
    if(seq.match(/^ur?dr?u$/)) {return "N"}
    // if(seq.match(/^l?drul$/)) {return     ^ (self point: aPointCollection last inUpper: 0.3 of: aPointCollection)) {returnO] ifFalse: [$6]}
    if(seq.match(/^dur?dl?d?r?$/)) {return "R"}
   " disambiguate against 8 by checking that we ended in a low area "
   // m = seq.match(/^ld?r?d?lu?r?') and: [(self point: aPointCollection last inUpper: 0.3 of: aPointCollection) not] ifTrue: [^ $S}
    // if(seq.match(/^rd$/)) {return     ^ (self point: aPointCollection last inLeft: 0.6 of: aPointCollection)) {return7] ifFalse: [$T]}
    if(seq.match(/^drud?$/)) {return "U"}
    if(seq.match(/^dur?$/)) {return "V"}
    if(seq.match(/^dr?u?dr?u$/)) {return "W"}
    if(seq.match(/^dlur?$/)) {return "X"}
    if(seq.match(/^dru?d?l?ur?$/)) {return "Y"}
    if(seq.match(/^rl?dl?d?r$/)) {return "Z"}

    if(seq.match(/^rdlur$/)) {return "0"}
    if(seq.match(/^u$/)) {return "1"}
    if(seq.match(/^urdl?d?r$/)) {return "2"}
    if(seq.match(/^u?rdl?d?rdlu?$/)) {return "3"}
    if(seq.match(/^drdlu?$/)) {return "5"}
    if(seq.match(/^u?l?dr?d?lur?u?l?$/)) {return "8"}
    if(seq.match(/^ldrudl?u?r?$/)) {return "9"}

   return undefined
  }

 
  
  
  directionFromTo(aPoint, anotherPoint) {
    if (!aPoint || !anotherPoint) return
    
    console.log("directions from " +  aPoint + " " + anotherPoint)
    
    
    let sub = (aPoint.subPt(anotherPoint))
    let delta = pt(Math.abs(sub.x), Math.abs(sub.y)) ;
	
    if (delta.x > delta.y) {
      if (aPoint.x > anotherPoint.x) {
        return "left"
      } else {
        return "right"
      }
    } else {
      if(aPoint.y > anotherPoint.y) {
        return "up"
      } else {
        return "down"
      }
    }
  }

       
  changed() {
    var fontHeight = 150;
    
    let canvas = this.get("canvas")
    var extent = lively.getExtent(this)
    canvas.setAttribute("width",  extent.x)
    canvas.setAttribute("height", extent.y)

    canvas.style.width =  extent.x + "px"
    canvas.style.height =  extent.y + "px"
    
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "lightgray"
    ctx.fillRect(0, 0,extent.x, extent.y)

    ctx.fillStyle = "black"
    ctx.font = fontHeight + 'px arial';
    ctx.fillText(this.text, 0, fontHeight);
    
    var cursorStart = pt(ctx.measureText(this.text).width, 0)
    
    ctx.strokeStyle = "red"
    ctx.lineWidth = "2px"
    ctx.beginPath();
    ctx.moveTo(cursorStart.x, cursorStart.y);
    ctx.lineTo(cursorStart.x, cursorStart.y + fontHeight);
    ctx.stroke();
    
    
    for(let i=0; i < this.points.length - 1; i++) {
      let start = this.points[i]
      let end = this.points[i+1]
      let direction = this.directionFromTo(start,  end)
      
      ctx.fillStyle = "red"
      ctx.fillRect(start.x - 3, start.y - 3, 6, 6)
      
      ctx.lineWidth = "2px"
      ctx.strokeStyle = ({
          left: "red",
          right: "green",
          up: "blue",
          down: "gray"
      })[direction]
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    }  
  }


  onMouseDown(anEvent) {
    this.recording = true
    this.points = []
    this.points.push(lively.getPosition(anEvent).subPt(lively.getGlobalPosition(this)))
    this.changed()
  }

  onMouseMove(anEvent) {
    if (!this.recording) return 
    var p = lively.getPosition(anEvent).subPt(lively.getGlobalPosition(this))
    // console.log("p", lively.getPosition(anEvent))
    this.points.push(p)
    this.changed()
  }


  onMouseUp(anEvent) {
    this.recording = false;
    if(this.points.length == 1) {
      this.text = ''
      this.changed()
      return
    } 
      
    " thin "
    // #TODO maybe use inject?
    let newPoints = []
    let currentPoint = this.points[0]  
    newPoints.push(currentPoint)    
    for(let i=1; i < this.points.length; i++) {
      let point = this.points[i]
      if (currentPoint.distSquared(point) > this.smoothingThresholdSquared()) {
        currentPoint = point
        newPoints.push(currentPoint)
      }
    }
    this.points = newPoints
          
    " isolate directions "
    let strokes = []
    let currentDirection
    for(let i=0; i < this.points.length - 1; i++) {
      let from = this.points[i]
      let to = this.points[i+1]
      let direction = this.directionFromTo(from,  to)
      if (direction != currentDirection) {
        strokes.push(direction)
        currentDirection = direction
      }
    }   

    let character = this.characterFromStrokes(strokes, this.points)
    if (character) {
      if (character == '\b') {
        this.text = this.text.slice(0, this.text.length - 1)
      }  else {
        this.text += character
      }
      this.changed()
    }
  }

/*
point: aPoint inLeft: aNumber of: aCollection

	| rangeX refX |
	rangeX := aCollection inject: (9e8 to: 0) into: [:interval :point | | ret |
		ret := interval.
		point x < ret start ifTrue: [ret := point x to: ret stop].
		point x > ret stop ifTrue: [ret := ret start to: point x].
		ret].
	
	refX := aPoint x - rangeX start.
	^ (refX / rangeX extent) < aNumber! !

*/

  pointInUpper(aPoint, aNumber, aCollection) {

    var start = 9e8
    var stop = 0
    for (var point of aCollection) {
      if (point.y < start) {start = point.y}
      if (point.y > stop) { stop = point.y}
    }
    
    let refY = aPoint.y - start;
    return (refY / Math.abs(start - stop)) < aNumber
  }

  smoothingThresholdSquared() {
    return 200
  } 
}