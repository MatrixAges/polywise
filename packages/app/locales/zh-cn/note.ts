export default {
	setting: {
		title: '图片上传配置（S3）',
		tips: `#### 通用占位符
 
\`uploadPath\` 和 \`outputURLPattern\` 均支持通用占位符，插件会将其替换为实际变量。
| 占位符 | 描述 |
| :--- | :--- |
| \`{year}\` | 年 |
| \`{month}\` | 月 |
| \`{day}\` | 日 |
| \`{hour}\` | 时 |
| \`{minute}\` | 分 |
| \`{second}\` | 秒 |
| \`{millisecond}\` | 毫秒 |
| \`{timestamp}\` | Unix 时间戳 (秒) |
| \`{timestampMS}\` | Unix 时间戳 (毫秒) |

#### 上传路径 (\`uploadPath\`)
 
除了通用占位符外，还支持以下变量：
 
| 占位符 | 描述 |
| :--- | :--- |
| \`{fullName}\` | 完整文件名 (含扩展名) |
| \`{fileName}\` | 文件名 (不含扩展名) |
| \`{extName}\` | 扩展名 (不含 \`.\`) |
| \`{md5}\` | 图片 MD5 |
| \`{sha1}\` | 图片 SHA1 |
| \`{sha256}\` | 图片 SHA256 |
 
---
 
#### 自定义输出 URL 模板 (\`outputURLPattern\`)
 
此配置将替代已废弃的 \`urlPrefix\`、\`urlSuffix\` 和 \`disableBucketPrefixToURL\`。
 
除了通用占位符外，还支持以下变量：
 
| 占位符 | 描述 | 示例 |
| :--- | :--- | :--- |
| \`{protocol}\` | URL 协议 | \`http\` 或 \`https\` |
| \`{host}\` | URL 域名 | \`s3.amazonaws.com\` |
| \`{port}\` | URL 端口 | \`80\` |
| \`{dir}\` | 上传目录 | \`xxx/2024/12\` |
| \`{uploadedFileName}\` | 上传后的文件名 (含扩展名) | \`4aa4f41e38817e5fd38ac870f40dbc70.jpg\` |
| \`{path}\` | 完整路径 (\`{dir}/{uploadedFileName}\`) | \`xxx/2024/12/4aa4f41e38817e5fd38ac870f40dbc70.jpg\` |
| \`{fileName}\` | **源**文件名 (含扩展名) | \`test.jpg\` |
| \`{extName}\` | **源**文件扩展名 (不含 \`.\`) | \`jpg\` |
| \`{query}\` | URL 查询参数 (不含 \`?\`) | \`height=100&width=200\` |
| \`{hash}\` | URL hash (不含 \`#\` )| \`abc\` |
| \`{bucket}\` | S3 桶名 | \`my-bucket\` |
`
	}
}
