# Harbor 示例镜像推送脚本
Write-Host "🎯 开始推送Harbor演示镜像" -ForegroundColor Green

# 登录Harbor
Write-Host "🔐 登录Harbor..." -ForegroundColor Yellow
docker login localhost:8080 -u admin -p Harbor12345

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Harbor登录失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Harbor登录成功" -ForegroundColor Green

# 定义示例项目
$projects = @(
    @{
        name = "diabetes_prediction"
        learning = "python:3.9-slim"
        aggregation = "python:3.9-slim"
    },
    @{
        name = "heart_disease_classification"  
        learning = "python:3.9-slim"
        aggregation = "python:3.9-slim"
    },
    @{
        name = "image_classification"
        learning = "python:3.9-slim"
        aggregation = "python:3.9-slim"
    }
)

foreach ($project in $projects) {
    Write-Host "`n📦 处理项目: $($project.name)" -ForegroundColor Cyan
    
    # 拉取基础镜像
    Write-Host "⬇️  拉取学习镜像: $($project.learning)" -ForegroundColor Yellow
    docker pull $project.learning
    
    Write-Host "⬇️  拉取聚合镜像: $($project.aggregation)" -ForegroundColor Yellow  
    docker pull $project.aggregation
    
    # 标记并推送学习镜像
    $learningTarget = "localhost:8080/federated_learn_repository/$($project.name)/learning:latest"
    Write-Host "🏷️  标记学习镜像: $learningTarget" -ForegroundColor Yellow
    docker tag $project.learning $learningTarget
    
    Write-Host "📤 推送学习镜像..." -ForegroundColor Yellow
    docker push $learningTarget
    
    # 标记并推送聚合镜像
    $aggregationTarget = "localhost:8080/federated_learn_repository/$($project.name)/aggregation:latest"
    Write-Host "🏷️  标记聚合镜像: $aggregationTarget" -ForegroundColor Yellow
    docker tag $project.aggregation $aggregationTarget
    
    Write-Host "📤 推送聚合镜像..." -ForegroundColor Yellow
    docker push $aggregationTarget
    
    Write-Host "✅ 项目 $($project.name) 处理完成" -ForegroundColor Green
}

Write-Host "`n🎉 所有演示镜像推送完成!" -ForegroundColor Green
Write-Host "📝 现在您可以:" -ForegroundColor Yellow
Write-Host "   1. 访问 http://localhost:3000" -ForegroundColor White
Write-Host "   2. 点击 'Federated Learning' -> 'Create Federated Learning Request'" -ForegroundColor White
Write-Host "   3. 在 'Select Project' 下拉框中选择项目" -ForegroundColor White
Write-Host "   4. 选择项目后，'Select Learning Image' 和 'Select Aggregation Image' 应该会显示可用选项" -ForegroundColor White
