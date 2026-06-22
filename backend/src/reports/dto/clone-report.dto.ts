import { IsNotEmpty, IsString } from 'class-validator';

export class CloneReportDto {
  @IsString({ message: 'Ngày báo cáo mới phải là chuỗi ký tự dạng YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Ngày báo cáo mới không được để trống' })
  reportDate: string;
}
