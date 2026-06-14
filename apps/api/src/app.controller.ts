import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('api/health')
  health(@Res() res: Response): void {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
}
