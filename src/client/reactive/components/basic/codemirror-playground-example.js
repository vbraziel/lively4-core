"enable aexpr";

// Alt-A to show hints!

let x = 1;
let y = 2;
y = 42;
x = 3;
{
  let x = 4;
  aexpr(() => x + y);
  x = 42;
}

x = 42;
y = 13;