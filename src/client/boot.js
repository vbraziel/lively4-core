/**
 * boot.js -- loads lively in any page that inserts through a script tag
 *
 **/

/* global lively4performance */
/* eslint no-console: off */

/*
 #TODO refactor booting/loading/init of lively4
  - currently we have different entry points we should unify
 */


// BEGIN COPIED HERE BECAUSE resuse through libs does not work yet
async function loadJavaScriptThroughDOM(name, src, force) {
  var code = await fetch(src).then(r => r.text())
  eval(code)
  
//   return new Promise(function (resolve) {
    
    
    
    
//     var scriptNode = document.querySelector(name);
//     if (scriptNode) {
//       scriptNode.remove();
//     }
//     var script = document.createElement("script");
//     script.id = name;
//     script.charset = "utf-8";
//     script.type = "text/javascript";
//     script.setAttribute("data-lively4-donotpersist","all");
//     if (force) {
//       src += +"?" + Date.now();
//     }
//     script.src = src;
//     script.onload = function () {
//       resolve();
//     };
//     document.head.appendChild(script);
//   });
}
// END COPIED


self.lively4currentbootid = "" + new Date()
self.lively4bootlogData = []
self.lively4bootlog = function add(url, date=Date.now(), mode="load", time=0, parentURL) {
  self.lively4bootlogData.push({
    url, date, mode, time, parentURL, bootid: self.lively4currentbootid
  })
}

if (!(localStorage["logLivelyBoot"] == "true")) {
  self.lively4bootlog = function() {
    // do nothing
  }
}

self.lively4transpilationCache = {
  update(cacheKey, cache) {
    this.cache.set(cacheKey, cache)
      var cacheJSO = {
        url: cacheKey,
        input: cache.input,
        output: cache.output,
        map: JSON.stringify(cache.map),
      }
      
      if (!cacheKey.match(/^workspace/)) {
        console.log("[babel] update transpilation cache " + cacheKey) // from client to server :-) #Security anybody?
        var transpileCacheURL = lively4url + "/.transpiled/" + cacheKey.replace(lively4url + "/","").replace(/\//g,"_") // flatten path
        fetch(transpileCacheURL, {
          method: "PUT",
          headers: {
            nocommit: true, // .transpiled is in gitignore... and the server cannot handle it automaitcally
          },
          body: cacheJSO.output
        })

        fetch(transpileCacheURL + ".map.json", {
          method: "PUT",
          headers: {
            nocommit: true
          },
          body: cacheJSO.map
        })        
      }
  },
  cache: new Map()
} 

self.lively4syncCache = new Map()
self.lively4optionsCache = new Map()
self.lively4fetchLog = []

async function invalidateFileCaches()  {
 
  var url = lively4url + "/"
  
  if (self.lively && lively.fileIndexWorker) {
    lively.fileIndexWorker.postMessage({message: "updateDirectory", url})
  }
  
  const FilesCaches = await System.import("src/client/files-caches.js")
  console.log("[boot] invalidateFileCaches:\n" + FilesCaches.invalidateTranspiledFiles())
  
}

async function preloadFileCaches() {
  await loadJavaScriptThroughDOM("JSZip", lively4url + "/src/external/jszip.js" )
  
  
  var start = performance.now()
  var preloadurl = lively4url + "/.lively4bundle.zip" + "?" + Date.now()
  var resp = await fetch(preloadurl)
  if (resp.status != "200") {
    console.warn("NO preload cache found in", preloadurl)
    return 
  }
  var contents = await resp.blob()

  var archive = await self.JSZip.loadAsync(contents)
  console.log("[boot] preloadFileCache fetched contents in  " + Math.round(performance.now() - start) + "ms")

  start = performance.now()
  for(var ea of Object.keys(archive.files)) {
    if (ea.match(/\.transpiled\//) || ea.match(/\.options\//)) continue;
    
    var file = archive.file(ea);
    if (file) {
      var modified = file.date.toISOString().replace(/T/, " ").replace(/\..*/, "")
      var url = lively4url + "/" + ea
      var content = await file.async("string")
      var mimeType = " text/plain"
      if (url.match(/\.js$/)) mimeType = "application/javascript"
      if (url.match(/\.css$/)) mimeType = "text/css"
      var response = new Response(content, {
        headers: {
          "content-type": mimeType,
          modified: modified
        }
      })
      self.lively4syncCache.set(url, response)
      // var cached = await self.lively4offlineFirstCache.match(url)
      // if (cached && cached.headers.get("modified") == modified) {
      //   // do nothing
      //   // console.log("PRECACHE IGNORE " + ea)
      // } else {
      //   // console.log("[boot] preloadFileCaches: " + ea)
      //   self.lively4offlineFirstCache.put(url, response)
      // }

      
      var optionsPath = ".options/" + ea.replace(/\//g,"_")
      var optionsFile = archive.file(optionsPath)
      if (optionsFile) {
        var optionsContent = await optionsFile.async("string")
        self.lively4optionsCache.set(url, new Response(optionsContent, {
          headers: {
            "content-type": "application/json"
          }
        }))
      }
      
      if (ea.match(/.js$/)) {
          var transpiledPath = ".transpiled/" + ea.replace(/\//g,"_")
          var transpiledFile = archive.file(transpiledPath)
          var mapFile = archive.file(transpiledPath + ".map.json");
          
          if (transpiledFile) { 
            // console.log("[boot] preloadFileCache initialize transpiled javascript: " + ea)
            try {
              var transpiledCode = await transpiledFile.async("string")
              if (mapFile) {
                var map = JSON.parse(await mapFile.async("string"))
              }
              self.lively4transpilationCache.cache.set(url, {
                  input: content, 
                  output: transpiledCode,
                  map: map,
                  modified: modified
                })
            } catch(e) {
              console.error("[boot] error in loading transpiled code: " + ea, e)
            }
          }
        }
    }
  } 
  console.log("[boot] preloadFileCache updated caches in  " + Math.round(performance.now() - start) + "ms")
//   var fileCacheURL = lively4url + "/bootfilelist.json"
//   try {
//     var filelist = await fetch(fileCacheURL).then(r => r.json())  
//   } catch(e) {
//     console.warn("could not load bootfilelist, continue anyway...")
//     return
//   }
  
//   urllist = filelist.map(ea => lively4url + "/" + ea)

//   var uncachedFiles = urllist.filter(ea => !lively4cacheFiles.get(ea))
  
//   var bootingMessageUI = document.querySelector("#lively-booting-message")
//   var count = 0
//   return Promise.all(uncachedFiles.map((ea, index) => {
//     var url = ea
//     return fetch(url).then(r => {
//       if (bootingMessageUI ) {
//         bootingMessageUI.textContent = "preload " + (count++) +"/" + uncachedFiles.length + "files" 
//       }
      
//     }) // ok, just fetch them, some will hit the cache, some will go through
//   })) 
}

self.lively4fetchHandlers = []
function instrumentFetch() {
  if (!self.originalFetch) self.originalFetch = self.fetch
  self.fetch = async function(request, options, ...rest) {
    var result = await new Promise(resolve => {
      if (self.lively4fetchHandlers) {
        // go through our list of handlers... the first one who handles it wins
        for(var handler of self.lively4fetchHandlers) {
          var handled = handler.handle && handler.handle(request, options)
          if (handled) return resolve(handled.result);        
        }
      }
      return resolve(self.originalFetch.apply(self, [request, options, ...rest]))
    })
    if (self.lively4fetchHandlers) {
      // anybody insterested when it finished
      for(var handler of self.lively4fetchHandlers) {
        handler.finsihed && handler.finsihed(request, options)
      }
    }
    return result
  }  
}

function installCachingFetch() {
  self.lively4fetchHandlers.push({    
    handle(request, options) {
      var url = (request.url || request).toString()
      var method = "GET"
      if (options && options.method) method = options.method;
      
      if (url.match(lively4url)) {
        self.lively4fetchLog.push({
          time: performance.now(),
          method: method,
          url: url
        }) 
        if (!self.lively4syncCache) return
        if (method == "GET") {
          if (options && options.headers && options.headers["fileversion"]) {
            return // don't cache versions request...
          }
          let match = self.lively4syncCache.get(url)
          if (match) {
            // console.log("[boot] SYNC CACHED " + url)
            return {
              result: Promise.resolve(match.clone())
            }          
          } else {
            console.log("[boot] SYNC MISSED " + url)
          }          
        } else if (method == "PUT") {
          // clear cache for PUT
          // so next GET will get the new content
          self.lively4syncCache.set(url, null) 
          
          // #TODO we could further store the PUT already locally? 
          // PRO: offline support
          // CONTRA: not sure if the file reached the server....
          
          // and don't further handle it... so that it will be saved on the server
        } else if (method == "OPTIONS") {
          if (options && options.headers && options.headers["showversions"]) {
            return // don't cache versions request...
          }
          
          let match = self.lively4optionsCache.get(url)
          if (match) {
            // console.log("[boot] SYNC OPTIONS CACHED " + url)
            return {
              result: Promise.resolve(match.clone())
            }          
          } else {
            console.log("[boot] SYNC OPTIONS MISSED " + url)
          }      
        } else {
          // do nothing
        }
      }
    },
    finished(request, options) {
      console.log("[boot] FINISHED fetch " + request.toString()) 
    }
  })
}

self.lively4invalidateFileCaches = invalidateFileCaches


if (self.lively && self.lively4url) {
  console.log("CANCEL BOOT Lively4, because it is already loaded")
} else {
  (async () => {
    
    // for finding the baseURL...
    var script = document.currentScript;
    var scriptURL = script.src;
    self.lively4url = scriptURL.replace("/src/client/boot.js","");
    
    // early feedback due to long loading time
    let livelyBooting = document.createElement('div');
    Object.assign(livelyBooting.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',

      zIndex: '10000',

      backgroundColor: 'white',
      border: 'black 1px solid',
      padding: '5px',
      boxShadow: '0px 0px 3px 0px rgba(40, 40, 40,0.66)'
    });
    livelyBooting.innerHTML = `<img alt="Lively 4" style="display:block; margin:auto;" src="${lively4url}/media/lively4_logo_smooth_100.png" />
<span style="font-size: large;font-family:arial">Booting:</span>
<div style="font-family:arial" id="lively-booting-message"></div>`;
    document.body.appendChild(livelyBooting);
    
    
    self.lively4bootGroupedMessages = []
    var lastMessage
    
    var estimatedSteps = 9;
    var stepCounter = 1;
    
    function groupedMessage( message) {
      var part = stepCounter++
      var numberOfSteps = estimatedSteps
      lastMessage =  {part, message, begin: performance.now()}
      
      console.group(`${part}/${numberOfSteps}: ${message}.`);

      let messageDiv = document.body.querySelector('#lively-booting-message');
      if(messageDiv) {
        messageDiv.innerHTML = `<span>${part}</span>/<span>${numberOfSteps}</span>: <span>${message}.</span>`;
      }
    }

    function groupedMessageEnd() {
      console.groupEnd();
      if (lastMessage) {
        lastMessage.end = performance.now()
        self.lively4bootGroupedMessages.push(lastMessage)
      }
    }

    console.group("BOOT");

    // some performance logging
    self.lively4performance = {start: performance.now()}
    try {
      Object.defineProperty(window, 'lively4stamp', {
        get: function() {
          if (!self.lively4performance) return;
          var newLast = performance.now()
          var t = (newLast - (lively4performance.last || lively4performance.start)) / 1000
          lively4performance.last = newLast
          return (t.toFixed(3) + "s ")
        }
      })
    } catch(e) {
      console.error(e)
    }

    var loadContainer = script.getAttribute("data-container"); // some simple configuration

    console.log("lively4url: " + lively4url);

      // first things first
      instrumentFetch()
      installCachingFetch()
      
      groupedMessage('Preload Files');
        await preloadFileCaches()
        // we could wait, or not... if we load transpiled things... waiting is better
      groupedMessageEnd();

      groupedMessage('Setup SystemJS');
        await loadJavaScriptThroughDOM("systemjs", lively4url + "/src/external/systemjs/system.src.js");
        await loadJavaScriptThroughDOM("systemjs-config", lively4url + "/src/systemjs-config.js");
      groupedMessageEnd();

      try {  
          groupedMessage('Initialize SystemJS');
            await System.import(lively4url + "/src/client/preload.js");
          groupedMessageEnd();
          
          groupedMessage('Wait on service worker (in load.js)');
            await (await System.import(lively4url + "/src/client/load-swx.js")).whenLoaded; // wait on service worker
          groupedMessageEnd();

          
          groupedMessage('Load Base System (lively.js)');
            await System.import("src/client/lively.js")

            // from load.js
            // lively.components.loadUnresolved(document.body, true, "load.js", true)

            // Customize.... #TODO where should it go?
            if (!self.__karma__ && navigator.userAgent.toLowerCase().indexOf('electron/') == -1) {
              self.onbeforeunload = function() {
                return 'Do you really want to leave this page?'; // gets overriden by Chrome native
              };
              self.onunload = function() {
                lively.onUnload && lively.onUnload()
              };
            }          
          groupedMessageEnd();
          
          groupedMessage('Load Standard Library');
            await System.import("lang");
            await System.import("lang-ext");
          groupedMessageEnd();

          groupedMessage('Initialize Document (in lively.js)' );
            await lively.initializeDocument(document, self.lively4chrome, loadContainer);
          groupedMessageEnd();

          groupedMessage('Look for uninitialized instances of Web Compoments');
            await lively.components.loadUnresolved(document.body, true, "boot.js", true)
          groupedMessageEnd();
        
        
          var componentWithContent = Array.from(lively.allElements(document.body))
              .filter(ea => ea.livelyContentLoaded && ea.livelyContentLoaded.then)
          groupedMessage(`Wait on ${componentWithContent.length} components with content`);
          
        
          // wait on all components to intialize their content.... e.g. the container loading a file
            await Promise.all(componentWithContent.map(ea => ea.livelyContentLoaded))
          groupedMessageEnd();

          console.log("Finally loaded!");
          if (self.lively4bootGroupedMessages) {
            var str =  self.lively4bootGroupedMessages.map(ea => {
              return ea.part + " "  + Math.round(ea.end - ea.begin) + "ms "+ ea.message
            }).join("\n")
            console.log("BOOT", str)
          }
          
          if (self.lively4bootlogData) {
            System.import("src/client/bootlog.js").then(m => {
              m.default.current().addLogs(self.lively4bootlogData)
            }).then(() => console.log("saved bootlog"))            
          }

          document.dispatchEvent(new Event("livelyloaded"));
      // } catch(err) {
      //   console.error("Lively Loading failed");
      //   console.error(err);
      } finally {
        console.groupEnd(); // BOOT
        livelyBooting.remove();
      }
    
  })();
}
