import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ManpowerRowDto {
  @IsInt({ message: 'ID dòng nhân lực phải là số nguyên' })
  @IsOptional()
  id?: number;

  @IsString({ message: 'Tên nhân sự phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên nhân sự không được để trống' })
  name: string;

  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsOptional()
  unit?: string;

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên' })
  @IsNotEmpty({ message: 'Thứ tự sắp xếp không được để trống' })
  sortOrder: number;

  @IsNumber({}, { message: 'Lũy kế trước phải là số' })
  @IsOptional()
  previousQuantity?: number;

  @IsNumber({}, { message: 'Thay đổi hôm nay phải là số' })
  @IsOptional()
  changeQuantity?: number;

  @IsNumber({}, { message: 'Hôm nay phải là số' })
  @IsOptional()
  todayQuantity?: number;

  @IsNumber({}, { message: 'Số lượng quản lý phải là số' })
  @IsOptional()
  managerQuantity?: number;

  @IsNumber({}, { message: 'Số lượng nhân viên phải là số' })
  @IsOptional()
  staffQuantity?: number;

  @IsNumber({}, { message: 'Số lượng làm thêm phải là số' })
  @IsOptional()
  overtimeQuantity?: number;

  @IsNumber({}, { message: 'Số lượng bảo vệ phải là số' })
  @IsOptional()
  securityQuantity?: number;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;
}

export class UpdateManpowerDto {
  @IsArray({ message: 'Danh sách nhân lực phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ManpowerRowDto)
  rows: ManpowerRowDto[];
}
