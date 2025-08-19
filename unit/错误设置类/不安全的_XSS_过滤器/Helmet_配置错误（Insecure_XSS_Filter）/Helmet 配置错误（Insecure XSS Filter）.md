# Helmet 配置错误（Insecure XSS Filter）

**描述**：将所有 Internet Explorer 版本的 X-XSS-Protection 设置为 1; mode=block 会造成在旧版浏览器中产生跨站点脚本缺陷。

**CWE**：CWE-79