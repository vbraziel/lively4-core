// Try out replacement
let celcius = 24;
let fahrenheit = celcius * 9/5 + 32;

// Track loop variables
let fact = 1;
for(let i = 1; i < 5; i++) {
  fact *= i;
}

// See dead code
if(celcius < 15) {
  console.log("It's cold");
} else {
  console.log("It's warm");
}
/* Examples: {"probes":[{"location":[12,3,12,10]},{"location":[8,2,8,6]}],"sliders":[],"examples":[],"replacements":[{"location":[6,11,6,12],"code":"89"}],"instances":[]} */