import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdatePreferenceSchema } from './notification.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('preferences/:address')
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Retrieves the current notification preferences for a given user address.',
  })
  @ApiParam({ name: 'address', description: 'User Stellar address' })
  @ApiResponse({ status: 200, description: 'Current notification preferences' })
  getPreferences(@Param('address') address: string) {
    return this.notificationService.getPreferences(address);
  }

  @Post('preferences/:address')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Updates notification preference toggles for a given user address.',
  })
  @ApiParam({ name: 'address', description: 'User Stellar address' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        emailEnabled: { type: 'boolean', description: 'Enable/disable email notifications' },
        pushEnabled: { type: 'boolean', description: 'Enable/disable push notifications' },
        disputeAlerts: { type: 'boolean', description: 'Enable/disable dispute alerts' },
        evidenceReminders: { type: 'boolean', description: 'Enable/disable evidence reminders' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated notification preferences' })
  updatePreferences(@Param('address') address: string, @Body() body: typeof UpdatePreferenceSchema._type) {
    return this.notificationService.updatePreferences(address, body);
  }
}
