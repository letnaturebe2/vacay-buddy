# 연차관리 슬랙으로 쉽게!

####  VacayBuddy는 연차 신청부터 승인, 현황 확인까지 전부 슬랙 안에서 해결할 수 있는 스마트한 연차 관리 도우미입니다.<a href="https://vacaybuddy-server-1080165942907.asia-northeast3.run.app//slack/install">


<div align="center"> 
설치하기 
<a>
<img src="assets/logo/slack_icon.png" alt="Slack logo" width="15">
</a>
</div>

## 간편한 연차 신청

<img src="./assets/gifs/pto-request.gif" alt="PTO 요청 화면">

- **슬랙에서 바로 신청**: 슬랙 앱 홈에서 몇 번의 클릭으로 간편하게 연차를 신청하세요.
- **남은 연차 확인**: 봇 설치 후 홈탭에서 바로 내 남은 연차를 한눈에 확인할 수 있습니다.
- **이전 연차 내역**: 신청한 연차 내역을 상세히 확인할 수 있습니다.

## 편리한 승인 및 검토

<img src="./assets/screens/pto-review.png" alt="PTO 검토 화면">

- **알림 및 승인**: 연차 신청 시 메시지 알림이 오고, 버튼을 눌러 모달창에서 승인 또는 거절할 수 있습니다.
- **간편한 승인 처리**: 슬랙 메시지에서 바로 모달창을 열어 승인 또는 거절할 수 있습니다.

## 관리자 기능

<img src="./assets/screens/admin-page.png" alt="관리자 페이지">

- **맞춤형 휴가 템플릿 관리**: 연차, 오후반차, 포상휴가 등 다양한 휴가 유형을 자유롭게 설정하고 관리할 수 있습니다.
- **팀원 휴가 관리 대시보드**: 모든 팀원의 휴가 신청 내역과 남은 연차를 한 눈에 확인하고 관리할 수 있습니다.
- **관리자 설정**: 홈탭에서 관리자 지정, 휴가 템플릿 관리, 팀원 연차 확인이 가능합니다.

## 스마트한 연차 데이터 관리

<img src="./assets/screens/excel-format.png" alt="엑셀 데이터 화면">

- **엑셀 데이터 연동**: 기존 엑셀 파일로 관리하던 팀원들의 연차 데이터를 한 번에 업로드하여 자동으로 동기화합니다.
- **원활한 연차 전환**: 기존 시스템에서 VacayBuddy로 손쉽게 마이그레이션하여 연차 관리 시스템 전환이 가능합니다.
- **실시간 연차 현황**: 업로드된 데이터는 실시간으로 업데이트되어 항상 최신 연차 현황을 유지합니다.

## 팀 현황 대시보드

<img src="./assets/screens/team-status-html.png" alt="팀 현황 대시보드">

- **팀원 연차 관리**: 팀원들의 연차 및 휴가 현황을 한눈에 확인할 수 있는 페이지를 제공합니다.

## 설치 방법

### Slack 앱 생성하기

1. [https://api.slack.com/apps/new](https://api.slack.com/apps/new)로 이동하여 "From an app manifest" 선택
2. 앱을 설치할 워크스페이스 선택
3. `manifest.json` 내용을 텍스트 상자에 복사하고 "Next" 클릭
4. 구성을 검토하고 "Create" 클릭
5. "Install to Workspace"를 클릭하고 "Allow" 선택

### 환경 변수 설정

1. `env.sample`을 `.env`로 복사
2. [앱 설정 페이지](https://api.slack.com/apps)에서 "OAuth & Permissions"를 클릭하고 Bot User OAuth Token을 복사하여 `.env` 파일의 `SLACK_BOT_TOKEN`에 추가
3. "Basic Information"에서 "App-Level Tokens" 섹션의 지침에 따라 `connections:write` 범위로 토큰을 생성하고 `.env`의 `SLACK_APP_TOKEN`에 추가
4. 필요에 따라 데이터베이스 연결을 위한 추가 환경 변수 구성

### 로컬 실행 방법

```bash
npm install
npm start
```

## 슬랙 커뮤니티
슬랙 채널에서 궁금한 점이나 피드백을 남겨주세요. 여러분의 의견을 기다립니다!
[채널 참여하기](https://join.slack.com/t/vacay-buddy/shared_invite/zt-328y00o5z-HoneR_Gl4iNlg9sNMMgrNg)

## LICENSE
MIT 라이센스에 따라 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 연락처
PTO 관련 문의는 letnaturebe2@gmail.com으로 연락하세요.