import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReportDto {
  @IsInt({ message: 'ID dự án phải là số nguyên' })
  @IsNotEmpty({ message: 'ID dự án không được để trống' })
  projectId: number;

  @IsString({ message: 'Loại báo cáo phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Loại báo cáo không được để trống' })
  @IsEnum(['DAILY', 'SUMMARY', 'V2', 'MESSAGE'], {
    message: 'Loại báo cáo phải là DAILY, SUMMARY, V2 hoặc MESSAGE',
  })
  reportType: string;

  @IsString({ message: 'Ngày báo cáo phải là chuỗi ký tự dạng YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Ngày báo cáo không được để trống' })
  reportDate: string;

  @IsInt({ message: 'ID nguồn báo cáo phải là số nguyên' })
  @IsOptional()
  sourceReportId?: number;

  @IsString({ message: 'Tiêu đề báo cáo phải là chuỗi ký tự' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'Số báo cáo phải là chuỗi ký tự' })
  @IsOptional()
  reportNo?: string;
}
