/*MD # Repository-wide Search

```
Examples:
   Search.search("lively-ball")
   Search.searchAndRename("lively-ball","lively-baaaaall")
``` 
MD*/

import _ from 'src/external/lodash/lodash.js' 
import FileIndex from "src/client/fileindex.js"

export default class Search {
  
  static getRoot() {
    return lively4url.replace(/[^\/]*$/,"")
  }
  
  static async search(pattern, rootdirs = "lively4-jens", ) {
    if (!pattern) throw new Error("Argument missing: not pattern")
    var root = this.getRoot()
    var result = await fetch(root + "_search/files", {
      headers:  { 
           "searchpattern": pattern,
           "rootdirs": rootdirs,
           "excludes": "node_modules,src/external,vendor/",
        }
    }).then(r => r.text())
    return result.split("\n").filter(ea => ea).map( ea => ea.split(":"))
  }
 
  static async searchAndRename(pattern, replace, dry) {
    if (!pattern) throw new Error("Argument missing: not pattern")
    if (!replace) throw new Error("Argument missing: not replace")
    var root = this.getRoot()

    var files = _.uniq((await Search.search(pattern)).map(ea => ea[0]))
    
    for (let file of files) {
      var url = root + file
      var contents = await fetch(url).then(ea => ea.text())
      var newcontents = contents.replace(new RegExp(pattern, "g"), replace)
      if (dry) {
        lively.notify("would modify " + file)
        continue
      }
      
      var putRequest = await fetch(url, {
        method: "PUT",
        body: newcontents
      })
      if (putRequest.status == 200) {
        lively.notify("Replaced pattern in " + file)
      } else {
        lively.notify("PROBLEM replacing pattern in " + file, putRequest.status)
      }  
    }
    return files
  }
}