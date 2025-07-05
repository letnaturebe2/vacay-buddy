import { startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Organization } from './organization.model';

@Entity()
export class User extends BaseEntity {
  @Column()
  userId: string; // TODO : set unique

  @ManyToOne(
    () => Organization,
    (organization) => organization.users,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  name: string | null;

  @Column({ type: 'float', default: 15 })
  annualPtoDays: number;

  @Column({ type: 'float', default: 0 })
  usedPtoDays: number;

  @Column({ type: 'varchar', nullable: false, length: 30, default: 'Asia/Seoul' })
  tz: string;

  @Column({ type: 'int', nullable: false, default: 32400 })
  tz_offset: number;

  @Column({
    type: 'datetime',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastNotificationSentAt: Date;

  /**
   * 사용자의 현재 로컬 시간 가져오기
   */
  get getUserLocalTime(): Date {
    return toZonedTime(new Date(), this.tz);
  }

  /**
   * 사용자의 timezone 기준으로 현재 시간이 10시대(10:00-10:59)인지 확인
   */
  get isNotificationTime(): boolean {
    const userLocalTime = this.getUserLocalTime;
    return userLocalTime.getHours() === 10;
  }

  /**
   * 사용자가 오늘 이미 알림을 받았는지 확인
   * - 오늘 받았으면 true (중복 방지)
   * - 어제 이전에 받았으면 false (보내야 함)
   * - 미래에 받았으면 true (시간대 엣지케이스 방지)
   */
  get hasReceivedNotificationToday(): boolean {
    const userNow = this.getUserLocalTime;
    const userToday = startOfDay(userNow);

    const lastNotificationUserTime = toZonedTime(this.lastNotificationSentAt, this.tz);
    const lastNotificationDay = startOfDay(lastNotificationUserTime);

    // 마지막 알림이 오늘 또는 미래인 경우만 true
    // 과거(어제 이전)인 경우는 false → 알림 발송
    return lastNotificationDay >= userToday;
  }

  /**
   * 사용자의 로컬 시간 기준으로 오늘이 주말(토요일, 일요일)인지 확인
   */
  get isWeekend(): boolean {
    const userLocalTime = this.getUserLocalTime;
    const dayOfWeek = userLocalTime.getDay(); // 0: 일요일, 6: 토요일
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * 사용자가 알림을 받을 수 있는 상태인지 확인
   * - 10시대여야 함
   * - 오늘 알림을 받지 않았어야 함
   * - 평일이어야 함 (주말 제외)
   */
  get shouldSendNotification(): boolean {
    return this.isNotificationTime && !this.hasReceivedNotificationToday && !this.isWeekend;
  }

  /**
   * 사용자의 남은 연차 계산
   */
  get remainingPtoDays(): number {
    return this.annualPtoDays - this.usedPtoDays;
  }
}
