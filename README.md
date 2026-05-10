# LabPlot Lite V0.1

一个最小版实验数据绘图网页工具：上传 CSV，自动生成温度-时间曲线，并导出 PNG 和 Origin 友好 CSV。

## 运行方法

```bash
pip install -r requirements.txt
python app.py
```

浏览器打开：

```text
http://127.0.0.1:5000
```

## CSV 格式

推荐列名：

```csv
time_s,temp_c
0,25.1
5,25.3
10,25.8
```

## 当前功能

- 上传 CSV
- 自动识别时间列和温度列
- 生成温度-时间曲线 PNG
- 导出 Origin 友好 CSV
- 显示最高温、最低温、平均温、峰值时间、数据点数

## 暂不做

- 登录
- 收费
- AI 识别
- 多模板
- 数据云端保存
