import { IsOptional, IsString } from 'class-validator';

export class UpdateReportDto {
  @IsString({ message: 'Tiêu đề báo cáo phải là chuỗi ký tự' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'Số báo cáo phải là chuỗi ký tự' })
  @IsOptional()
  reportNo?: string;

  @IsString({ message: 'Ngày phát hành phải là chuỗi ký tự dạng YYYY-MM-DD' })
  @IsOptional()
  issueDate?: string;

  @IsString({ message: 'Nội dung lời dẫn phải là chuỗi ký tự' })
  @IsOptional()
  messageContent?: string;
}
