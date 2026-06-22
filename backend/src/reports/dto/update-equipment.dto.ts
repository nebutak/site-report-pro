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

export class EquipmentRowDto {
  @IsInt({ message: 'ID dòng thiết bị phải là số nguyên' })
  @IsOptional()
  id?: number;

  @IsString({ message: 'Tên thiết bị phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
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

  @IsNumber({}, { message: 'Số lượng hoạt động bình thường phải là số' })
  @IsOptional()
  normalQuantity?: number;

  @IsNumber({}, { message: 'Số lượng đang sửa chữa phải là số' })
  @IsOptional()
  repairingQuantity?: number;

  @IsNumber({}, { message: 'Số lượng bị hỏng phải là số' })
  @IsOptional()
  brokenQuantity?: number;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;
}

export class UpdateEquipmentDto {
  @IsArray({ message: 'Danh sách thiết bị phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => EquipmentRowDto)
  rows: EquipmentRowDto[];
}
