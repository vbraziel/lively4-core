# Bibliographie

Leo and Jens were here 

### Headings

- list item 1
- and two 



## Notes

```javascript 
var a = 3
```

<script> 
var a = 3;

(async () => {
  var div = <div style="white-space:pre">{await fetch("https://lively-kernel.org/lively4/lively4-leo/demos/bibliographie/_incoming.bib").then(r => r.text())}</div>

  return div 
})()
</script>

GenerateCitationKey als Vergleich und Prüfung

```javascript
var entry = `Stefan Ramson, Jens Lincke, Harumi Watanabe, and Robert Hirschfeld. <span class="marked"> Zone-based Layer Activation: Context-specific Behavior Adaptations Across Logically-connected Asynchronous Operations. </span> In Proceedings of the Virtual Workshop on Context-oriented Programming (COP) 2020, co-located with the European Conference on Object-oriented Programming (ECOOP), Berlin, Germany, July 21, 2020, ACM DL. (<a href="./media/RamsonLinckeWatanabeHirschfeld_2020_ZoneBasedLayerActivationContextSpecificBehaviorAdaptationsAcrossLogicallyConnectedAsynchronousOperations_AcmDL.pdf" rel="external">pdf</a>)
    <ul class="no-bullet">
      <li> <span class="small"> © ACM, 2020. This is the authors' version of the work. It is posted here by permission of ACM for your personal use. Not for redistribution. The definitive version will be published in the proceedings of the Workshop on Context-oriented Programming. </span> </li>
    </ul>`.split(/<.*?>/g)


entry[0].split(/, /g).map(ea => ea.replace(/^and / , "")) 

```
<li> Luke Church, Richard P. Gabriel, Hidehiko Masuhara, and Robert Hirschfeld. 
  <span class="marked"> PX/19 (Chairs' Welcome). </span> 
  In Proceedings of the Programming Experience 2019 (PX/19) Workshop, companion volume to International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;), 
  co-located with the International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;), pages xiii-xv, Genova, Italy, April 1, 2019, ACM DL. 
  (<a href="./media/ChurchGabrielMasuharaHirschfeld_2019_PX19_Welcome_AcmDL.pdf" rel="external">pdf</a>) </li>


<li> Patrick Rein. <span class="marked"> Reading Logic as Code or as Natural Language Text. </span> ACM Student Research Competition <span class="marked"> (First Place, Graduate Category), </span> In companion volume to International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;), 3 pages, Genova, Italy, April 1-4, 2019, ACM DL. (<a href="./media/Rein_2019_ReadingLogicAsCodeOrAsNaturalLanguageText_AcmDL.pdf" rel="external">pdf</a>)
    <ul class="no-bullet">
      <li> <span class="small"> © ACM, 2019. This is the author's version of the work. It is posted here by permission of ACM for your personal use. Not for redistribution. The definitive version will be published in the companion volume to International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;). </span> </li>
    </ul>
  </li>

<li> Fachgebiet Software-Architekturen. <span class="marked"> Jahresbericht 2018. </span> Hasso-Plattner-Institut, Digital-Engineering-Fakultät, Universität Potsdam, 2019. (<a href="./media/FachgebietSoftwareArchitekturen_2019_Jahresbericht2018.pdf" rel="external">pdf</a>) </li>








### Errors


SyntaxError: Unexpected number in JSON at position 25
    at JSON.parse (<anonymous>)
    at Function.parseAuthInfoFromUrl /src/client/auth.js
    at eval /src/client/auth.js

TypeError: Cannot read property 'clear' of undefined
    at Animation.animation.onfinish /src/components/tools/lively-editor.js

TypeError: Cannot read property 'then' of undefined
    at HTMLElement.inspectIt /src/components/widgets/lively-code-mirror.js



## Input:



<script>





</script>




## Example 


```javascript
import BibtexParser from "src/external/bibtexParse.js";
import Bibliography from "src/client/bibliography.js"

var item =`Tom Beckmann, Stefan Ramson, Patrick Rein, and Robert Hirschfeld. <span class="marked"> Visual Design for a Tree-oriented Projectional Editor. </span> In Proceedings of the Virtual Programming Experience 2020 (PX/20) Workshop, companion volume to the International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;), co-located with the International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;), pages 113-119, Porto, Portugal, March 23, 2020, ACM DL. (<a href="./media/BeckmannRamsonReinHirschfeld_2020_VisualDesignForATreeOrientedProjectionalEditor_AcmDL.pdf" rel="external">pdf</a>)
    <ul class="no-bullet">
      <li> <span class="small"> © ACM, 2020. This is the authors' version of the work. It is posted here by permission of ACM for your personal use. Not for redistribution. The definitive version will be published in the proceedings of the Programming Experience Workshop and the companion volume to International Conference on the Art, Science, and Engineering of Programming (&lt;Programming&gt;). </span> </li>
    </ul>`

  var a = item.split(/<.*?>/g)
  if (!a){throw new Error ("could not parse item: " + item)}
a[2]

  var authors = a[0].split(/, /g).map(ea => 
    ea.replace(/^and / , "").replace(/\. $/ , "")) 
  
  var m = a[2].match(/[0-9]{4}/)
    if (m){
      var year = m[0]
    }else {
      lively.notify ("could not find year in " + a[2],item)
    }

  var entry = { 
    entryType: 'article',
    entryTags: { 
      author: authors.join(" and "),
      year: year,
      title: a[1].replace(/\. $/,"").replace(/^ /,"") },
      published: a[2]
  }
  
  
  
  

  entry.citationKey = Bibliography.generateCitationKey(entry)


  var bibString = BibtexParser.toBibtex([entry ], false);
  bibString

    /*fetch("https://lively-kernel.org/lively4/lively4-core/demos/bibliographie/output.bib", {
    method: "PUT",
    body: bibString
  })*/


```



