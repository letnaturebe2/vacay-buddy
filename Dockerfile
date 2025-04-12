# Node.js 기반 이미지 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 앱 의존성 설치를 위한 package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 환경 변수 설정
ENV NODE_ENV=production

# 애플리케이션 실행을 위한 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "dist/app-prod.js"]