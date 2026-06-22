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

export class MaterialRowDto {
  @IsInt({ message: 'ID dòng vật tư phải là số nguyên' })
  @IsOptional()
  id?: number;

  @IsString({ message: 'Tên vật tư phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên vật tư không được để trống' })
  name: string;

  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsOptional()
  unit?: string;

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên' })
  @IsNotEmpty({ message: 'Thứ tự sắp xếp không được để trống' })
  sortOrder: number;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @IsOptional()
  quantity?: number;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;
}

export class UpdateMaterialDto {
  @IsArray({ message: 'Danh sách vật tư phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => MaterialRowDto)
  rows: MaterialRowDto[];
}
