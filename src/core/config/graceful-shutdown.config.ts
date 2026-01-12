export interface GracefulShutdownConfig {
  SHUT_DOWN_TIMER: number;
  SHUTDOWN_RETRIES: number;
  SHUTDOWN_RETRY_DELAY: number;
}

export const gracefulShutdownConfig: GracefulShutdownConfig = {
  SHUT_DOWN_TIMER: parseInt(process.env.SHUT_DOWN_TIMER || '3000', 10),
  SHUTDOWN_RETRIES: parseInt(process.env.SHUTDOWN_RETRIES || '3', 10),
  SHUTDOWN_RETRY_DELAY: parseInt(process.env.SHUTDOWN_RETRY_DELAY || '1000', 10)
};
