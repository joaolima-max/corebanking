import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { PixService } from './pix.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreatePixKeyDto } from './dtos/create-pix-key.dto';
import { CreatePixTransferDto } from './dtos/create-pix-transfer.dto';
import { CreatePixQrCodeDto } from './dtos/create-pix-qr-code.dto';
import type { Request } from 'express';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  // Keys
  @Post('keys')
  registerKey(@Body() dto: CreatePixKeyDto, @CurrentUser() actor: AuthUser) {
    return this.pixService.registerKey(dto, actor);
  }

  @Get('keys')
  listKeys(@Query('accountId') accountId: string | undefined, @CurrentUser() actor: AuthUser) {
    return this.pixService.listKeys(accountId, actor);
  }

  @Delete('keys/:id')
  deleteKey(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.pixService.deleteKey(id, actor);
  }

  @Get('keys/lookup')
  lookupKey(@Query('keyType') keyType: string, @Query('keyValue') keyValue: string) {
    return this.pixService.lookupKey(keyType, keyValue);
  }

  // Transfers
  @Post('transfers')
  initiateTransfer(
    @Body() dto: CreatePixTransferDto,
    @CurrentUser() actor: AuthUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? '';
    return this.pixService.initiateTransfer(dto, actor, ip);
  }

  @Get('transfers')
  listTransfers(@Query('accountId') accountId: string | undefined, @CurrentUser() actor: AuthUser) {
    return this.pixService.listTransfers(accountId, actor);
  }

  @Get('transfers/:id')
  getTransfer(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.pixService.getTransfer(id, actor);
  }

  // QR Codes
  @Post('qr-codes')
  createQrCode(@Body() dto: CreatePixQrCodeDto, @CurrentUser() actor: AuthUser) {
    return this.pixService.createQrCode(dto, actor);
  }

  @Get('qr-codes')
  listQrCodes(@Query('accountId') accountId: string | undefined, @CurrentUser() actor: AuthUser) {
    return this.pixService.listQrCodes(accountId, actor);
  }

  // Stats
  @Get('stats')
  getStats(@CurrentUser() actor: AuthUser) {
    return this.pixService.getStats(actor);
  }
}
