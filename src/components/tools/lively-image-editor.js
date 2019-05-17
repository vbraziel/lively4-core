import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyImageEditor extends Morph {
  async initialize() {
    this.windowTitle = "Image Editor";

    this.canvas = this.get("#canvas")
    this.canvas.height = 500
    this.canvas.width = 500

    this.ctx = this.canvas.getContext("2d");

    lively.removeEventListener("pointer", this)
    lively.addEventListener("pointer", this, "pointerdown", e => this.onPointerDown(e))
    lively.addEventListener("pointer", this, "pointermove", e => this.onPointerMove(e))
    lively.addEventListener("pointer", this, "pointerup", e => this.onPointerUp(e))

    lively.addEventListener('pointer', this, "contextmenu", evt => {
      if (!evt.shiftKey) {
        this.onContextMenu(evt)
        evt.stopPropagation();
        evt.preventDefault();
        return true;
      }
    }, false);
    
    var url = this.getAttribute("src")
    if (url) this.loadImage(url)
    
  }
  
  
  
  // BEGIN EDITOR API
  saveFile() {
    return lively.files.copyURLtoURL(this.canvas.toDataURL(), this.getURL())
  }

  getURL(url) {
    return this.getAttribute("src")
  }

  setURL(url) {
    if(this.getURL() != url) {
      this.loadImage(url)
    }
  }
  
  currentEditor() {
    var canvas = this.canvas
    return {
      getValue() { return canvas.toDataURL()}
    }
  }
  // END EDITOR API
  
  
  loadImage(url) {
    debugger
    this.setAttribute("src", url)
    var img = new Image();
    img.onload = () => {
      this.canvas.height = img.height
      this.canvas.width = img.width
      this.ctx.drawImage(img, 0, 0); // Or at whatever offset you like
      
    };
    img.src = url
  }

  posFromEvent(evt) {
    return lively.getPosition(evt).subPt(lively.getGlobalPosition(this.canvas))
  }
  
  paint(pos) {
    this.ctx.strokeStyle = "#FF0000";
    this.ctx.lineWidth = 1;
    if (this.lastPos) {
      this.ctx.moveTo(this.lastPos.x, this.lastPos.y);      
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.closePath();
      this.ctx.stroke();
    }
    this.lastPos = pos
  }

  onPointerDown(evt) {
    this.isDown = true
    var pos = this.posFromEvent(evt)
    this.paint(pos)
  }
  
  onPointerMove(evt) {
    if (this.isDown) {
      var pos = this.posFromEvent(evt)
      this.paint(pos)
    }
  }

  onPointerUp(evt) {
    var pos = this.posFromEvent(evt)
    this.paint(pos)
    this.isDown = false
    this.lastPos = undefined
  }
  
  async onSave(url) {
    url = url || this.getAttribute("src") 
    if (url) {
      this.setAttribute("src", url)
      this.saveFile()
      lively.notify("saved " + url)
    } else {
      this.onSaveAs()
    }
  }

  async onSaveAs() {
    var url = await lively.prompt("save as", this.getAttribute("src") || "")
    if (url) {
      this.onSave(url)
    }    
  }  
  
  async onOpen() {
    var url = await lively.prompt("load", this.getAttribute("src") || "")
    if (url) {
      await this.loadImage(url)
      lively.notify("load " + url)
    }
  }

  async onContextMenu(evt) {
    const menuElements = [
      ["save", () => this.onSave()],
      ["save as...", () => this.onSaveAs()],
      ["open image", () => this.onOpen()],
    ];
    const menu = new lively.contextmenu(this, menuElements)
    menu.openIn(document.body, evt, this)
  }
  
  async livelyExample() {
    this.loadImage("https://lively-kernel.org/lively4/foo/test.png")
  }
}
