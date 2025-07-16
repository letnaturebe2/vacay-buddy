import winston from 'winston';

// GCP Cloud Logging 표준 포맷
const gcpLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  // biome-ignore lint/suspicious/noExplicitAny: Winston's LogEntry type is too restrictive for GCP format
  winston.format.printf((info: any) => {
    const { timestamp, level, message, stack, ...meta } = info;

    // GCP Cloud Logging 표준 필드
    const gcpLogEntry: Record<string, unknown> = {
      timestamp,
      severity: level.toUpperCase(), // GCP uses severity instead of level
      message,
    };

    // 에러 스택이 있으면 추가
    if (stack) {
      gcpLogEntry.stack = stack;
    }

    // 추가 메타데이터가 있으면 labels로 추가 (GCP 스타일)
    if (Object.keys(meta).length > 0) {
      gcpLogEntry.labels = meta;
    }

    return JSON.stringify(gcpLogEntry);
  }),
);

// 로그 레벨 설정
const logLevel = process.env.LOG_LEVEL || 'info';

// Winston 로거 생성
export const logger = winston.createLogger({
  level: logLevel,
  format: gcpLogFormat,
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

// 로깅 헬퍼 함수들
export const logInfo = (message: string, meta?: object) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: object) => {
  logger.warn(message, meta);
};

export const logError = (message: string, error?: Error | unknown, meta?: object) => {
  if (error instanceof Error) {
    logger.error(message, { ...meta, error: error.message, stack: error.stack });
  } else if (error) {
    logger.error(message, { ...meta, error: String(error) });
  } else {
    logger.error(message, meta);
  }
};

export const logDebug = (message: string, meta?: object) => {
  logger.debug(message, meta);
};

// 성능 측정을 위한 헬퍼
export const logPerformance = (operation: string, duration: number, meta?: object) => {
  logger.info(`Performance: ${operation}`, {
    ...meta,
    operation,
    duration_ms: duration,
    performance: true,
  });
};

// 비즈니스 이벤트 로깅을 위한 헬퍼
export const logBusinessEvent = (event: string, data?: object) => {
  logger.info(`Business Event: ${event}`, {
    ...data,
    event_type: 'business',
    event_name: event,
  });
};

// 보안 관련 이벤트 로깅
export const logSecurityEvent = (event: string, data?: object) => {
  logger.warn(`Security Event: ${event}`, {
    ...data,
    event_type: 'security',
    event_name: event,
  });
};
