const express = require('express');
const app = express();
app.use(express.json());

class VulnerablePDFRenderer {
    constructor() {
      this.isEvalSupported = true;
    }

    compileCommands(cmds) {
      if (!this.isEvalSupported) return null;

      const jsBuf = [];
      for (const cmd of cmds) {
        const args = cmd.args ? cmd.args.join(',') : '';
        jsBuf.push(`c.${cmd.cmd}(${args});`);
      }
      return new Function("c", "size", jsBuf.join(""));
    }
  }

function generateMaliciousPDF(input) {
    // const userInput = document.getElementById('userInput').value;
    var userInput = input;
    const fontMatrix = [
        0.001,
        0,
        0,
        0.001,
        0,
        userInput  
    ];

    const cmds = [
        { cmd: "save", args: [] },
        { cmd: "transform", args: fontMatrix },
        { cmd: "scale", args: ["size", "-size"] }
    ];

    try {
        const renderer = new VulnerablePDFRenderer();
        const renderFunc = renderer.compileCommands(cmds);

        if (typeof renderFunc === 'function') {
        renderFunc({ 
            save: () => console.log('save called'),
            transform: () => console.log('transform called'),
            scale: () => console.log('scale called')
        }, 1000);
        console.log('PDF生成成功（漏洞已触发）');
        }
    } catch (e) {
        console.error('错误:', e.message);
    }
}

app.post('/api/user/create', async (req, res) => {
    const userInput = req.body.input;
    generateMaliciousPDF(userInput);
});

app.listen(3000);