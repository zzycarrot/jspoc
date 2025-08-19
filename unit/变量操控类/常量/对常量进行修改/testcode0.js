const express = require('express');
const router = express.Router();

// 声明一个包含敏感配置的常量
const SECRET_CONFIG = {
  adminPassword: 'SuperSecret123',
  apiKey: 'ABCD-1234-EFGH-5678'
};

function updateConfig(newConfig) {
  // 尝试修改常量 - 这在实际执行时会抛出错误，但某些静态分析工具可能检测不到
  // SINK
  SECRET_CONFIG = newConfig;
}

router.post('/update-config', function(req, res) {
  // SOURCE
  const newConfig = req.body.config;
  
  try {
    updateConfig(newConfig);
    res.send('Configuration updated successfully');
  } catch (err) {
    res.status(500).send('Error updating configuration');
  }
});

module.exports = router;