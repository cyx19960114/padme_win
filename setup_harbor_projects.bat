@echo off
echo =================================
echo 设置Harbor演示项目
echo =================================

set HARBOR_URL=http://localhost:8080
set HARBOR_USER=admin
set HARBOR_PASS=Harbor12345

echo.
echo 🔗 测试Harbor连接...
curl -s -u %HARBOR_USER%:%HARBOR_PASS% %HARBOR_URL%/api/v2.0/systeminfo > nul
if %errorlevel% neq 0 (
    echo ❌ 无法连接到Harbor，请确保Harbor在localhost:8080运行
    pause
    exit /b 1
)
echo ✅ Harbor连接成功

echo.
echo 📋 创建基础项目...

echo 🚀 创建项目: train_class_repository
curl -s -u %HARBOR_USER%:%HARBOR_PASS% -X POST "%HARBOR_URL%/api/v2.0/projects" ^
-H "Content-Type: application/json" ^
-d "{\"project_name\":\"train_class_repository\",\"metadata\":{\"public\":\"false\"},\"storage_limit\":-1}"
echo.

echo 🚀 创建项目: federated_learn_repository  
curl -s -u %HARBOR_USER%:%HARBOR_PASS% -X POST "%HARBOR_URL%/api/v2.0/projects" ^
-H "Content-Type: application/json" ^
-d "{\"project_name\":\"federated_learn_repository\",\"metadata\":{\"public\":\"false\"},\"storage_limit\":-1}"
echo.

echo.
echo ✅ 项目创建完成!
echo.
echo 📝 接下来需要手动执行以下Docker命令来推送示例镜像:
echo.
echo # ================================
echo # Docker镜像准备命令  
echo # ================================
echo.
echo # 1. 登录Harbor
echo docker login localhost:8080 -u admin -p Harbor12345
echo.
echo # 2. 拉取并推送演示镜像
echo.
echo # 项目: diabetes_prediction
echo docker pull tensorflow/tensorflow:2.8.0
echo docker pull python:3.9-slim
echo docker tag tensorflow/tensorflow:2.8.0 localhost:8080/federated_learn_repository/diabetes_prediction/learning:latest
echo docker tag python:3.9-slim localhost:8080/federated_learn_repository/diabetes_prediction/aggregation:latest
echo docker push localhost:8080/federated_learn_repository/diabetes_prediction/learning:latest
echo docker push localhost:8080/federated_learn_repository/diabetes_prediction/aggregation:latest
echo.
echo # 项目: heart_disease_classification  
echo docker pull pytorch/pytorch:1.12.0-cuda11.3-cudnn8-devel
echo docker tag pytorch/pytorch:1.12.0-cuda11.3-cudnn8-devel localhost:8080/federated_learn_repository/heart_disease_classification/learning:latest
echo docker tag python:3.9-slim localhost:8080/federated_learn_repository/heart_disease_classification/aggregation:latest
echo docker push localhost:8080/federated_learn_repository/heart_disease_classification/learning:latest
echo docker push localhost:8080/federated_learn_repository/heart_disease_classification/aggregation:latest
echo.
echo # 项目: image_classification
echo docker pull tensorflow/tensorflow:2.8.0-gpu
echo docker tag tensorflow/tensorflow:2.8.0-gpu localhost:8080/federated_learn_repository/image_classification/learning:latest
echo docker tag python:3.9-slim localhost:8080/federated_learn_repository/image_classification/aggregation:latest  
echo docker push localhost:8080/federated_learn_repository/image_classification/learning:latest
echo docker push localhost:8080/federated_learn_repository/image_classification/aggregation:latest
echo.
echo ================================
echo.
echo 🎉 完成后，刷新Central Service界面，您应该能看到可选的项目了!
echo.
pause
