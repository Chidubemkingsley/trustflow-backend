import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { EscrowModule } from './escrow/escrow.module';
import { EscrowGraphQLModule } from './escrow/graphql/escrow-graphql.module';
import { WebhookModule } from './webhook/webhook.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { StellarModule } from './stellar/stellar.module';
import { SentryModule } from './sentry/sentry.module';
import { NotificationModule } from './notification/notification.module';
import { OutboxModule } from './outbox/outbox.module';
import { CacheModule } from './common/cache.module';

@Module({
  imports: [SentryModule, AuthModule, EscrowModule, WebhookModule, MonitoringModule, StellarModule, NotificationModule, OutboxModule, CacheModule],
import { LoggingModule } from './common/logging/logging.module';
import { CorrelationIdMiddleware } from './common/logging/correlation-id.middleware';
import { ShutdownModule } from './common/shutdown/shutdown.module';
import { DrainMiddleware } from './common/shutdown/drain.middleware';

import { AuditModule } from './audit/audit.module';
import { TracingModule } from './monitoring/tracing.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggingModule,
    ShutdownModule,
    SentryModule,
    RedisModule,
    DatabaseModule,
    RateLimitModule,
    IdempotencyModule,
    AuthModule,
    UserProfileModule,
    EscrowModule,
    EscrowGraphQLModule,
    WebhookModule,
    MonitoringModule,
    StellarModule,
    EventIngestionModule,
    DisputeModule,
    MigrationModule,
    IpfsPinningModule,
    GigModule,
    EscrowReconciliationModule,
    ReputationModule,
    AdminModule,
    DeliverableModule,
    MilestoneNotificationsModule,
    SorobanEventIndexerModule,
    OutboxModule,
    AuditModule,
    TracingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Correlation ID first so every later log line — including the drain middleware's own —
    // can be attributed to a request. DrainMiddleware must run after it but before the
    // route handlers, so that a request rejected with 503 during a shutdown is still logged
    // with its correlation ID rather than silently shed.
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(DrainMiddleware).forRoutes('*');
  }
}
