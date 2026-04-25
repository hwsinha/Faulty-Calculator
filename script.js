let random=Math.random();
let a=prompt("Enter first number");
let operator=prompt("Enter operator");
let b=prompt("Enter second number");

let obj={
    "+":"-",
    "-":"+",
    "*":"/",
    "/":"*"
}
console.log(random)
if(random>0.1){
    console.log(`the result of ${a} ${operator} ${b} is ${eval(`${a}${operator}${b}`)}`)
}
else{
    operator=obj[operator]
    console.log(`the result of ${a} ${operator} ${b} is ${eval(`${a}${operator}${b}`)}`)
}