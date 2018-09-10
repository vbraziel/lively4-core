import aexpr from 'active-expression-rewriting';

export default function when(condition, ...params) {
  const aexprContructor = params[0] && params[0].strategy || aexpr;
  const exp = aexprContructor(condition);
  return new Promise(resolve => {
    exp.onBecomeTrue(() => {
      exp.dispose();
      resolve();
    });
  });
}
