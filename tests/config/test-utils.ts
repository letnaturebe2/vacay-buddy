import { Repository } from "typeorm";
import { testDataSource } from "./test-db";
import { User } from "../../src/entity/user.model";
import { Organization } from "../../src/entity/organization.model";
import { PtoTemplate } from "../../src/entity/pto-template.model";
import { PtoRequest } from "../../src/entity/pto-request.model";
import { PtoApproval } from "../../src/entity/pto-approval.model";
import { OrganizationService } from "../../src/service/organization.service";
import { UserService } from "../../src/service/user.service";
import { TEST_INSTALLATION } from "./constants";

/**
 * 데이터베이스 안전 초기화 함수
 */
export const ensureTestDatabaseInitialized = async (): Promise<void> => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
};

/**
 * 데이터베이스 안전 종료 함수
 */
export const safelyDestroyTestDatabase = async (): Promise<void> => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
};

// Repository instances
export const getRepositories = () => ({
  userRepository: testDataSource.getRepository(User),
  organizationRepository: testDataSource.getRepository(Organization),
  ptoTemplateRepository: testDataSource.getRepository(PtoTemplate),
  ptoRequestRepository: testDataSource.getRepository(PtoRequest),
  ptoApprovalRepository: testDataSource.getRepository(PtoApproval),
});

// Service instances
export const getServices = () => {
  const userService = new UserService(testDataSource);
  const organizationService = new OrganizationService(testDataSource, userService);
  
  return {
    userService,
    organizationService,
  };
};

/**
 * 테스트용 Organization 생성 헬퍼 함수
 */
export const createOrganization = async (
  organizationId: string = "test-organization"
): Promise<Organization> => {
  const { organizationService } = getServices();
  
  return await organizationService.createOrganization(
    organizationId,
    false,
    JSON.stringify(TEST_INSTALLATION)
  );
};

/**
 * 테스트용 User 생성 헬퍼 함수
 */
export const createUser = async (
  userId: string,
  organization?: Organization
): Promise<User> => {
  const { userRepository } = getRepositories();
  
  const user = new User();
  user.userId = userId;
  if (organization) user.organization = organization;
  return userRepository.save(user);
};

/**
 * 테스트용 PtoTemplate 생성 헬퍼 함수
 */
export const createPtoTemplate = async (
  organization: Organization,
  data: Partial<PtoTemplate> = {}
): Promise<PtoTemplate> => {
  const { ptoTemplateRepository } = getRepositories();
  
  const template = new PtoTemplate();
  template.title = data.title || "Vacation";
  template.description = data.description || "Vacation template";
  template.content = data.content || "📋 Leave Request Details: \n - Reason:";
  template.enabled = data.enabled ?? true;
  template.daysConsumed = data.daysConsumed ?? 1;
  template.organization = organization;
  return ptoTemplateRepository.save(template);
};

/**
 * 테스트용 User with Organization 생성 헬퍼 함수
 */
export const createUserWithOrganization = async (
  userId: string,
  organizationId: string = "test-organization"
): Promise<{ user: User; organization: Organization }> => {
  const organization = await createOrganization(organizationId);
  const user = await createUser(userId, organization);
  
  return { user, organization };
};

/**
 * Notification 테스트용 User 생성 헬퍼 함수 (timezone 및 notification 관련 설정 포함)
 */
export const createTestUser = async (
  userId: string,
  organization: Organization,
  options: {
    name?: string;
    tz?: string;
    tz_offset?: number;
    lastNotificationSentAt?: Date;
  } = {}
): Promise<User> => {
  const { userRepository } = getRepositories();
  
  const user = await createUser(userId, organization);
  user.name = options.name || `Test User ${userId}`;
  user.tz = options.tz || 'Asia/Seoul';
  user.tz_offset = options.tz_offset ?? 32400;
  user.lastNotificationSentAt = options.lastNotificationSentAt || new Date();

  return userRepository.save(user);
};

/**
 * 여러 timezone의 사용자들을 한번에 생성하는 헬퍼 함수
 */
export const createUsersWithTimezones = async (
  organization: Organization,
  timezoneConfigs: Array<{
    userId: string;
    tz: string;
    tz_offset: number;
    name?: string;
  }>
): Promise<User[]> => {
  const { userRepository } = getRepositories();
  
  const users: User[] = [];
  for (const config of timezoneConfigs) {
    const user = await createUser(config.userId, organization);
    user.name = config.name || `Test User ${config.userId}`;
    user.tz = config.tz;
    user.tz_offset = config.tz_offset;
    user.lastNotificationSentAt = new Date('2024-01-01T00:00:00.000Z');
    
    const savedUser = await userRepository.save(user);
    users.push(savedUser);
  }
  
  return users;
};

/**
 * Notification 테스트용 여러 사용자 생성 헬퍼 함수
 */
export const createNotificationTestUsers = async (
  organization: Organization,
  count: number,
  baseUserId: string = "USER"
): Promise<User[]> => {
  const users: User[] = [];
  
  for (let i = 1; i <= count; i++) {
    const user = await createTestUser(`${baseUserId}_${i}`, organization, {
      name: `Test User ${i}`,
    });
    users.push(user);
  }
  
  return users;
};

/**
 * 모든 테스트 데이터 정리 헬퍼 함수
 */
export const clearAllTestData = async (): Promise<void> => {
  // 데이터베이스가 초기화되어 있는지 확인
  if (!testDataSource.isInitialized) {
    return;
  }

  try {
    // 순서 중요: 외래키 관계 고려
    await testDataSource.getRepository("PtoApproval").clear();
    await testDataSource.getRepository("PtoRequest").clear();
    await testDataSource.getRepository("PtoTemplate").clear();
    await testDataSource.getRepository("User").clear();
    await testDataSource.getRepository("Organization").clear();
  } catch (error) {
    console.warn('Failed to clear test data:', error);
    // 에러가 발생해도 테스트는 계속 진행되도록 함
  }
}; 