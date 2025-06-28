import { NotificationService } from "../../src/service/notification.service";
import { UserService } from "../../src/service/user.service";
import { Organization } from "../../src/entity/organization.model";
import { PtoRequest } from "../../src/entity/pto-request.model";
import { User } from "../../src/entity/user.model";
import {
  createOrganization,
  createTestUser,
  createUsersWithTimezones,
  getRepositories,
  getServices,
  clearAllTestData,
  ensureTestDatabaseInitialized
} from "../config/test-utils";

// Mock WebClient with a shared instance
const mockChatPostMessage = jest.fn().mockResolvedValue({ ok: true });

jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({
    chat: {
      postMessage: mockChatPostMessage
    }
  }))
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let userService: UserService;
  let organization: Organization;

  beforeAll(async () => {
    await ensureTestDatabaseInitialized();
  });

  beforeEach(async () => {
    await clearAllTestData();

    const services = getServices();
    userService = services.userService;
    notificationService = new NotificationService(userService);

    organization = await createOrganization();
    mockChatPostMessage.mockClear();
  });

  afterEach(() => {
    // 각 테스트 후 타이머 복원 및 Mock 정리
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('sendPendingNotification', () => {
    it('단일 사용자에게 알림을 발송하고 lastNotificationSentAt을 UTC로 업데이트해야 함', async () => {
      const { userRepository } = getRepositories();
      const user = await createTestUser('U12345', organization, {
        name: 'Test User',
        tz: 'Asia/Seoul',
        tz_offset: 32400,
      });

      const pendingRequestsCount = 3;
      const beforeNotification = new Date();

      await notificationService.sendPendingNotification(user, pendingRequestsCount);

      expect(mockChatPostMessage).toHaveBeenCalledWith({
        channel: user.userId,
        blocks: expect.any(Array),
      });

      const updatedUser = await userRepository.findOne({ where: { userId: user.userId } });
      expect(updatedUser).toBeTruthy();
      expect(updatedUser!.lastNotificationSentAt).toBeInstanceOf(Date);

      const afterNotification = new Date();
      expect(updatedUser!.lastNotificationSentAt.getTime()).toBeGreaterThanOrEqual(beforeNotification.getTime());
      expect(updatedUser!.lastNotificationSentAt.getTime()).toBeLessThanOrEqual(afterNotification.getTime());
    });

    it('사용자의 timezone과 관계없이 lastNotificationSentAt이 UTC로 저장되어야 함', async () => {
      const { userRepository } = getRepositories();
      const timezoneConfigs = [
        { userId: 'U_US_EAST', tz: 'America/New_York', tz_offset: -18000 },
        { userId: 'U_EUROPE', tz: 'Europe/London', tz_offset: 0 },
        { userId: 'U_ASIA', tz: 'Asia/Tokyo', tz_offset: 32400 }
      ];

      const createdUsers = await createUsersWithTimezones(organization, timezoneConfigs);
      const beforeNotification = new Date();

      for (const user of createdUsers) {
        await notificationService.sendPendingNotification(user, 1);
      }

      const afterNotification = new Date();

      for (const user of createdUsers) {
        const updatedUser = await userRepository.findOne({ where: { userId: user.userId } });
        expect(updatedUser).toBeTruthy();
        expect(updatedUser!.lastNotificationSentAt.getTime()).toBeGreaterThanOrEqual(beforeNotification.getTime());
        expect(updatedUser!.lastNotificationSentAt.getTime()).toBeLessThanOrEqual(afterNotification.getTime());
      }

      expect(mockChatPostMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendPendingNotifications', () => {
    it('shouldSendNotification이 true인 사용자에게만 알림을 발송해야 함', async () => {
      // Given: 알림 조건이 다른 사용자들 생성
      const currentTime = new Date();

      // 알림을 받아야 하는 사용자
      const userShouldReceive = await createTestUser('U_SHOULD_RECEIVE', organization, {
        name: 'Should Receive User',
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z'), // 과거 날짜
      });

      // 이미 알림을 받은 사용자
      const userAlreadyReceived = await createTestUser('U_ALREADY_RECEIVED', organization, {
        name: 'Already Received User',
        lastNotificationSentAt: currentTime, // 현재 시간
      });

      // Mock user의 shouldSendNotification getter
      jest.spyOn(userShouldReceive, 'shouldSendNotification', 'get').mockReturnValue(true);
      jest.spyOn(userAlreadyReceived, 'shouldSendNotification', 'get').mockReturnValue(false);

      const usersWithRequests = [
        { user: userShouldReceive, requests: [{ id: 1 }, { id: 2 }] as PtoRequest[] },
        { user: userAlreadyReceived, requests: [{ id: 3 }] as PtoRequest[] },
      ];

      // When: 알림 발송
      const notificationsSent = await notificationService.sendPendingNotifications(usersWithRequests);

      // Then: shouldSendNotification이 true인 사용자만 알림 받음
      expect(notificationsSent).toBe(1);
      expect(mockChatPostMessage).toHaveBeenCalledTimes(1);
      expect(mockChatPostMessage).toHaveBeenCalledWith({
        channel: userShouldReceive.userId,
        blocks: expect.any(Array),
      });
    });
  });

  describe('User 모델의 getter 메서드 테스트', () => {
    it('getter 메서드들이 올바르게 작동하는지 확인', async () => {
      // Given: 테스트용 사용자 생성
      const user = await createTestUser('U_GETTER_TEST', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date() // 방금 전
      });

      // When: User 모델의 getter 메서드들 호출
      const userLocalTime = user.getUserLocalTime;
      const isNotificationTime = user.isNotificationTime;
      const hasReceivedNotificationToday = user.hasReceivedNotificationToday;
      const shouldSendNotification = user.shouldSendNotification;

      // Then: getter 메서드들이 올바른 타입을 반환하는지 확인
      expect(userLocalTime).toBeInstanceOf(Date);
      expect(typeof isNotificationTime).toBe('boolean');
      expect(typeof hasReceivedNotificationToday).toBe('boolean');
      expect(typeof shouldSendNotification).toBe('boolean');

      // 방금 생성된 사용자는 오늘 알림을 받은 것으로 처리됨
      expect(hasReceivedNotificationToday).toBe(true);
    });

    it('시간대별로 isNotificationTime이 올바르게 작동하는지 mock으로 확인', async () => {
      // Mock Date 사용하여 특정 시간으로 설정
      const mockGetHours = jest.fn();

      // 10시인 경우
      mockGetHours.mockReturnValue(10);
      const user1 = await createTestUser('U_10AM', organization);
      jest.spyOn(user1, 'getUserLocalTime', 'get').mockReturnValue({
        getHours: mockGetHours
      } as any);

      expect(user1.isNotificationTime).toBe(true);

      // 11시인 경우
      mockGetHours.mockReturnValue(11);
      const user2 = await createTestUser('U_11AM', organization);
      jest.spyOn(user2, 'getUserLocalTime', 'get').mockReturnValue({
        getHours: mockGetHours
      } as any);

      expect(user2.isNotificationTime).toBe(false);
    });

    it('hasReceivedNotificationToday가 날짜 비교를 올바르게 하는지 확인', async () => {
      // 어제 알림을 받은 사용자
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const user1 = await createTestUser('U_YESTERDAY', organization, {
        lastNotificationSentAt: yesterday
      });

      // 오늘 알림을 받은 사용자
      const user2 = await createTestUser('U_TODAY', organization, {
        lastNotificationSentAt: new Date()
      });

      expect(user1.hasReceivedNotificationToday).toBe(false);
      expect(user2.hasReceivedNotificationToday).toBe(true);
    });
  });

  describe('시간 조작을 사용한 통합 테스트', () => {
    it('특정 시간에 알림 조건을 정확히 확인', async () => {
      const user = await createTestUser('U_TIME_TEST', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date('2025-06-27T01:00:00.000Z') // 어제
      });

      // 10시 30분 - 알림 시간이므로 true
      const tenThirtyAM = new Date('2025-06-28T10:30:00');
      jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(tenThirtyAM);
      expect(user.shouldSendNotification).toBe(true);

      // 11시 30분 - 알림 시간이 아니므로 false
      const elevenThirtyAM = new Date('2025-06-28T11:30:00');
      jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(elevenThirtyAM);
      expect(user.shouldSendNotification).toBe(false);
    });
  });

  describe('시간 변화에 따른 세밀한 테스트', () => {
    it('9시 59분에서 10시로 넘어갈 때 알림 조건 변화', async () => {
      const user = await createTestUser('U_TIME_TRANSITION', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z') // 과거
      });

      const testTimes = [
        { hour: 9, minute: 59, expectedNotificationTime: false },
        { hour: 10, minute: 0, expectedNotificationTime: true },
        { hour: 10, minute: 30, expectedNotificationTime: true },
        { hour: 10, minute: 59, expectedNotificationTime: true },
        { hour: 11, minute: 0, expectedNotificationTime: false },
      ];

      for (const testTime of testTimes) {
        const mockLocalTime = new Date('2025-06-28T00:00:00');
        mockLocalTime.setHours(testTime.hour, testTime.minute);
        jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(mockLocalTime);
        
        expect(user.isNotificationTime).toBe(testTime.expectedNotificationTime);
        expect(user.shouldSendNotification).toBe(testTime.expectedNotificationTime);
      }
    });

    it('정확한 경계값에서의 동작 확인', async () => {
      const user = await createTestUser('U_BOUNDARY_TEST', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
      });

      const testCases = [
        { localHour: 9, expectedNotificationTime: false, description: '9시' },
        { localHour: 10, expectedNotificationTime: true, description: '10시' },
        { localHour: 11, expectedNotificationTime: false, description: '11시' },
      ];

      for (const testCase of testCases) {
        const mockLocalTime = new Date('2025-06-28T10:00:00');
        mockLocalTime.setHours(testCase.localHour);
        jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(mockLocalTime);
        
        expect(user.isNotificationTime).toBe(testCase.expectedNotificationTime);
      }
    });

    it('자정을 넘나드는 상황에서의 날짜 판단', async () => {
      // 어제 23시 30분에 알림을 받은 사용자
      const user = await createTestUser('U_MIDNIGHT_TEST', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date('2025-06-27T14:30:00.000Z') // 한국시간 6월 27일 23:30
      });

      // Mock으로 로컬 시간을 6월 28일 10시로 설정
      const june28TenAM = new Date('2025-06-28T10:00:00');
      jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(june28TenAM);
      
      expect(user.isNotificationTime).toBe(true);
      expect(user.hasReceivedNotificationToday).toBe(false); // 어제 알림이므로 오늘은 받지 않음
      expect(user.shouldSendNotification).toBe(true);
    });
  });

  describe('다양한 타임존 사용자들의 동시 테스트', () => {
    it('각 타임존별로 10시가 되는 시점에 알림 조건 확인', async () => {
      const timezoneTests = [
        {
          userId: 'U_NYC_10AM',
          tz: 'America/New_York',
          tz_offset: -14400, // EDT
        },
        {
          userId: 'U_LONDON_10AM',
          tz: 'Europe/London', 
          tz_offset: 3600, // BST
        },
        {
          userId: 'U_SEOUL_10AM',
          tz: 'Asia/Seoul',
          tz_offset: 32400, // KST
        }
      ];

      for (const testCase of timezoneTests) {
        const user = await createTestUser(testCase.userId, organization, {
          tz: testCase.tz,
          tz_offset: testCase.tz_offset,
          lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z') // 과거
        });

        // Mock으로 로컬 시간을 10시로 설정
        const tenAM = new Date('2025-06-28T10:00:00');
        const nineAM = new Date('2025-06-28T09:00:00');
        
        jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(tenAM);
        expect(user.isNotificationTime).toBe(true);
        expect(user.shouldSendNotification).toBe(true);

        // 9시로 변경
        jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(nineAM);
        expect(user.isNotificationTime).toBe(false);
        expect(user.shouldSendNotification).toBe(false);
      }
    });

    it('타임존별 동시 알림 발송 시나리오', async () => {
      // 각각의 타임존에서 10시인 시점들을 동시에 테스트
      const users = [
        await createTestUser('U_MULTI_NYC', organization, {
          tz: 'America/New_York',
          tz_offset: -14400,
          lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
        }),
        await createTestUser('U_MULTI_LONDON', organization, {
          tz: 'Europe/London',
          tz_offset: 3600,
          lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
        }),
        await createTestUser('U_MULTI_SEOUL', organization, {
          tz: 'Asia/Seoul',
          tz_offset: 32400,
          lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
        })
      ];

      // 서울 시간 10:00 AM (UTC 01:00) - 서울만 알림 시간
      jest.useFakeTimers({ now: new Date('2025-06-28T01:00:00.000Z') });

      // shouldSendNotification을 직접 체크하여 Mock 대신 실제 로직 확인
      expect(users[0].shouldSendNotification).toBe(false); // NYC 6:00 AM
      expect(users[1].shouldSendNotification).toBe(false); // London 11:00 AM  
      expect(users[2].shouldSendNotification).toBe(true);  // Seoul 10:00 AM
    });

    it('날짜 변경선을 넘나드는 복잡한 타임존 시나리오', async () => {
      // 극단적인 타임존 테스트
      const samoaUser = await createTestUser('U_SAMOA', organization, {
        tz: 'Pacific/Apia', // UTC+13 (서머타임)
        tz_offset: 46800,
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
      });
      
      const hawaiiUser = await createTestUser('U_HAWAII', organization, {
        tz: 'Pacific/Honolulu', // UTC-10
        tz_offset: -36000,
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z')
      });

      // Mock으로 각각 다른 로컬 시간 설정
      // 사모아: 10:00 AM (알림 시간)
      const samoaTenAM = new Date('2025-06-29T10:00:00');
      jest.spyOn(samoaUser, 'getUserLocalTime', 'get').mockReturnValue(samoaTenAM);
      
      // 하와이: 11:00 AM (알림 시간 아님)
      const hawaiiElevenAM = new Date('2025-06-28T11:00:00');
      jest.spyOn(hawaiiUser, 'getUserLocalTime', 'get').mockReturnValue(hawaiiElevenAM);

      expect(samoaUser.isNotificationTime).toBe(true); // 사모아 10시
      expect(hawaiiUser.isNotificationTime).toBe(false); // 하와이 11시

      expect(samoaUser.shouldSendNotification).toBe(true);
      expect(hawaiiUser.shouldSendNotification).toBe(false);
    });
  });

  describe('연속 알림 방지 테스트', () => {
    it('같은 날 여러 번 10시가 되어도 한 번만 알림이 가야 함', async () => {
      // fake timer를 사용하지 않고 직접 lastNotificationSentAt 조작
      const todayTime = new Date('2025-06-28T01:00:00.000Z'); // 한국시간 10:00 AM
      
      const user = await createTestUser('U_DUPLICATE_PREVENTION', organization, {
        tz: 'Asia/Seoul',
        tz_offset: 32400,
        lastNotificationSentAt: new Date('2024-01-01T00:00:00.000Z') // 과거
      });

      // Mock으로 현재 시간을 10시로 설정
      jest.spyOn(user, 'getUserLocalTime', 'get').mockReturnValue(new Date('2025-06-28T10:00:00'));
      
      // 첫 번째 확인 - 과거에 알림을 받았으므로 알림이 가야 함
      expect(user.isNotificationTime).toBe(true);
      expect(user.hasReceivedNotificationToday).toBe(false);
      expect(user.shouldSendNotification).toBe(true);

      // 오늘 알림을 받았다고 가정하고 직접 속성 변경
      user.lastNotificationSentAt = todayTime;
      
      // 같은 시간에 다시 확인 - 이미 오늘 알림을 받았으므로 알림이 가면 안됨
      expect(user.isNotificationTime).toBe(true);
      expect(user.hasReceivedNotificationToday).toBe(true);
      expect(user.shouldSendNotification).toBe(false);
    });
  });
});