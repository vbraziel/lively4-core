import { getLocal as _getLocal } from "active-expression-rewriting";
import { setLocal as _setLocal } from "active-expression-rewriting";
function funcA() {
    let _scope2 = {};

    var x;
    function funcB() {
        let _scope = {};

        var y;
        function funcC() {
            if (42) {
                let _scope3 = {};

                let z;
                function funcD() {
                    y = (_getLocal(_scope2, "x"), x), _setLocal(_scope, "y"), y;
                    function funcE() {
                        x = (_getLocal(_scope3, "z"), z), _setLocal(_scope2, "x"), x;
                        x = (_getLocal(_scope3, "z"), z), _setLocal(_scope2, "x"), x;
                    }
                }
            }
        }
    }
}
