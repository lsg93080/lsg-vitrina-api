import { ApiProperty } from '@nestjs/swagger';

export class CanDisconnectResponseDto {
  @ApiProperty()
  canDisconnect: boolean;

  @ApiProperty()
  publicationCount: number;
}
