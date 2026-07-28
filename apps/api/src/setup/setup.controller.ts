import { Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SetupService } from './setup.service';

/**
 * One-shot database seed over HTTP, for environments where `prisma db seed`
 * cannot be run (serverless). Public route guarded by the `X-Setup-Key` header,
 * which must match the `SETUP_KEY` env var. Idempotent.
 */
@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Public()
  @Post('seed')
  @ApiOperation({ summary: 'Run the idempotent seed (requires X-Setup-Key header)' })
  async seed(@Headers('x-setup-key') key?: string): Promise<unknown> {
    const expected = process.env['SETUP_KEY'];
    if (!expected) {
      throw new ForbiddenException('SETUP_KEY is not configured on the server');
    }
    if (key !== expected) {
      throw new ForbiddenException('Invalid setup key');
    }
    return this.setup.run();
  }
}
