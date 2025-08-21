# 最终演示：对比安全和不安全的实现

Write-Host "=== JSON注入漏洞完整演示 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 实验总结报告" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host ""
Write-Host "🎯 漏洞类型: JSON注入 (JSON Injection)" -ForegroundColor Red
Write-Host "🔍 漏洞位置: /api/user/create 端点"
Write-Host "💥 漏洞原因: 使用字符串拼接构造JSON，未对用户输入进行适当转义"

Write-Host ""
Write-Host "✅ 成功的攻击示例:" -ForegroundColor Green
Write-Host "1. 注入额外字段: 'hacker\", \"malicious\": \"true'"
Write-Host "2. 注入嵌套对象: 'user\", \"metadata\": {\"role\": \"admin\"}'"
Write-Host "3. 注入多个字段: 'evil\", \"role\": \"admin\", \"access\": \"full'"

Write-Host ""
Write-Host "❌ 失败的攻击示例:" -ForegroundColor Red
Write-Host "1. 覆盖已存在字段 (后定义的字段覆盖前面的)"
Write-Host "2. 注入数组结构 (语法错误)"
Write-Host "3. 复杂JSON结构注入 (JSON.parse失败)"

Write-Host ""
Write-Host "📊 实际数据验证:"
Write-Host "让我们查看MongoDB中实际被注入的恶意数据..."

# 显示注入的恶意数据
docker exec -it json_-mongo-1 mongosh --eval "
db = db.getSiblingDB('testDB'); 
console.log('=== 被成功注入的恶意字段 ===');
db.users.find({
    \$or: [
        {injected: {\$exists: true}},
        {malicious: {\$exists: true}},
        {role: {\$exists: true}},
        {access: {\$exists: true}},
        {metadata: {\$exists: true}}
    ]
}).forEach(function(doc) {
    console.log('User:', doc.user);
    console.log('恶意字段:', JSON.stringify(doc, null, 2));
    console.log('---');
});
"

Write-Host ""
Write-Host "🔒 安全修复建议:" -ForegroundColor Green
Write-Host "1. ❌ 不要使用字符串拼接构造JSON"
Write-Host "2. ✅ 直接使用解析后的JSON对象"
Write-Host "3. ✅ 对所有用户输入进行验证和清理"
Write-Host "4. ✅ 使用白名单限制允许的字段"
Write-Host "5. ✅ 实施输入长度和格式限制"

Write-Host ""
Write-Host "💡 漏洞影响评估:" -ForegroundColor Yellow
Write-Host "• 严重程度: 中等"
Write-Host "• 可能后果: 数据污染、权限绕过、信息泄露"
Write-Host "• 利用难度: 低"
Write-Host "• 检测难度: 中等"

Write-Host ""
Write-Host "🎓 学习要点:" -ForegroundColor Cyan
Write-Host "• JSON注入是由于不安全的字符串拼接造成的"
Write-Host "• 攻击者可以注入额外的JSON字段"
Write-Host "• 这种攻击可能导致应用逻辑绕过"
Write-Host "• 安全的做法是直接操作JSON对象，而不是字符串"

Write-Host ""
Write-Host "实验完成! 🎉" -ForegroundColor Green
