# 使用官方的 Node.js 20.10.0 版本作为基础镜像
FROM node:20.10.0

# 设置工作目录为 /app
WORKDIR /app

# 将当前目录下的 package.json 和 package-lock.json 复制到容器的 /app 目录下
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 如果你的项目有额外的文件或目录需要复制，可以在这里添加 COPY 指令
# 例如：COPY . .
COPY server.js ./
# 设置容器启动时运行的命令
CMD [ "node", "server.js" ]

# 如果你的应用需要监听某个端口，可以 EXPOSE 这个端口
# 例如，如果你的 Node.js 应用监听 3000 端口，那么可以添加：
EXPOSE 9000