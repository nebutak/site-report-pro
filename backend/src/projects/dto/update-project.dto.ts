import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProjectDto {
  @IsString({ message: 'Tên dự án phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Mã dự án phải là chuỗi ký tự' })
  @IsOptional()
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Mã dự án chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới',
  })
  code?: string;

  @IsString({ message: 'Chủ đầu tư phải là chuỗi ký tự' })
  @IsOptional()
  ownerName?: string;

  @IsString({ message: 'Tư vấn giám sát phải là chuỗi ký tự' })
  @IsOptional()
  supervisorName?: string;

  @IsString({ message: 'Nhà thầu chính phải là chuỗi ký tự' })
  @IsOptional()
  contractorName?: string;

  @IsString({ message: 'Địa điểm phải là chuỗi ký tự' })
  @IsOptional()
  location?: string;

  @IsString({ message: 'Người báo cáo mặc định phải là chuỗi ký tự' })
  @IsOptional()
  defaultReporterName?: string;

  @IsString({ message: 'Người nhận mặc định phải là chuỗi ký tự' })
  @IsOptional()
  defaultReceiver?: string;

  @IsString({ message: 'CC mặc định phải là chuỗi ký tự' })
  @IsOptional()
  defaultCc?: string;

  @IsString({ message: 'Trạng thái dự án phải là chuỗi ký tự' })
  @IsOptional()
  status?: string;
}
