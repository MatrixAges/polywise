export default {
	setting: {
		title: 'Image Upload Config（S3）',
		tips: `#### Common Placeholders
 
Both \`uploadPath\` and \`outputURLPattern\` support common placeholders, which the plugin will replace with actual variables.
| Placeholder | Description |
| :--- | :--- |
| \`{year}\` | Year |
| \`{month}\` | Month |
| \`{day}\` | Day |
| \`{hour}\` | Hour |
| \`{minute}\` | Minute |
| \`{second}\` | Second |
| \`{millisecond}\` | Millisecond |
| \`{timestamp}\` | Unix timestamp (seconds) |
| \`{timestampMS}\` | Unix timestamp (milliseconds) |

#### Upload Path (\`uploadPath\`)
 
In addition to the common placeholders, the following variables are also supported:
 
| Placeholder | Description |
| :--- | :--- |
| \`{fullName}\` | Full filename (including extension) |
| \`{fileName}\` | Filename (excluding extension) |
| \`{extName}\` | Extension (excluding \`.\`) |
| \`{md5}\` | Image MD5 |
| \`{sha1}\` | Image SHA1 |
| \`{sha256}\` | Image SHA256 |
 
---
 
#### Custom Output URL Template (\`outputURLPattern\`)
 
This configuration will replace the deprecated \`urlPrefix\`, \`urlSuffix\`, and \`disableBucketPrefixToURL\`.
 
In addition to the common placeholders, the following variables are also supported:
 
| Placeholder | Description | Example |
| :--- | :--- | :--- |
| \`{protocol}\` | URL protocol | \`http\` or \`https\` |
| \`{host}\` | URL host | \`s3.amazonaws.com\` |
| \`{port}\` | URL port | \`80\` |
| \`{dir}\` | Upload directory | \`xxx/2024/12\` |
| \`{uploadedFileName}\` | Uploaded filename (including extension) | \`4aa4f41e38817e5fd38ac870f40dbc70.jpg\` |
| \`{path}\` | Full path (\`{dir}/{uploadedFileName}\`) | \`xxx/2024/12/4aa4f41e38817e5fd38ac870f40dbc70.jpg\` |
| \`{fileName}\` | **Source** filename (including extension) | \`test.jpg\` |
| \`{extName}\` | **Source** file extension (excluding \`.\`) | \`jpg\` |
| \`{query}\` | URL query parameters (excluding \`?\`) | \`height=100&width=200\` |
| \`{hash}\` | URL hash (excluding \`#\` )| \`abc\` |
| \`{bucket}\` | S3 bucket name | \`my-bucket\` |
`
	}
}
