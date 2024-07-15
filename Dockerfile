# 使用官方的Node.js镜像作为基础镜像
FROM node:14

# 创建并设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json文件
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件到工作目录
COPY . .

# 暴露应用运行的端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
