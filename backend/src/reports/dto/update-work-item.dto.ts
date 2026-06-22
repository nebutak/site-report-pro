import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkItemRowDto {
  @IsInt({ message: 'ID hạng mục phải là số nguyên' })
  @IsOptional()
  id?: number;

  @IsString({ message: 'tempId phải là chuỗi ký tự' })
  @IsOptional()
  tempId?: string;

  @IsInt({ message: 'parentId phải là số nguyên' })
  @IsOptional()
  parentId?: number;

  @IsString({ message: 'tempParentId phải là chuỗi ký tự' })
  @IsOptional()
  tempParentId?: string;

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên' })
  @IsNotEmpty({ message: 'Thứ tự sắp xếp không được để trống' })
  sortOrder: number;

  @IsInt({ message: 'Cấp độ phân cấp phải là số nguyên' })
  @IsNotEmpty({ message: 'Cấp độ phân cấp không được để trống' })
  level: number;

  @IsString({ message: 'Mã hiệu phải là chuỗi ký tự' })
  @IsOptional()
  code?: string;

  @IsString({ message: 'Tên hạng mục không được để trống' })
  @IsNotEmpty({ message: 'Tên hạng mục không được để trống' })
  name: string;

  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsOptional()
  unit?: string;

  @IsNumber({}, { message: 'Khối lượng thiết kế phải là số' })
  @IsOptional()
  designQuantity?: number;

  @IsNumber({}, { message: 'Lũy kế trước phải là số' })
  @IsOptional()
  previousAccumulatedQuantity?: number;

  @IsNumber({}, { message: 'Khối lượng hôm nay phải là số' })
  @IsOptional()
  todayQuantity?: number;

  @IsNumber({}, { message: 'Lũy kế hiện tại phải là số' })
  @IsOptional()
  currentAccumulatedQuantity?: number;

  @IsNumber({}, { message: 'Phần trăm hoàn thành phải là số' })
  @IsOptional()
  completionPercent?: number;

  @IsString({ message: 'Người phụ trách phải là chuỗi ký tự' })
  @IsOptional()
  personInCharge?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;

  @IsBoolean({ message: 'Trạng thái nhóm phải là boolean' })
  @IsNotEmpty({ message: 'Trạng thái nhóm không được để trống' })
  isGroup: boolean;

  @IsBoolean({ message: 'Trạng thái khóa phải là boolean' })
  @IsNotEmpty({ message: 'Trạng thái khóa không được để trống' })
  isLocked: boolean;

  @IsOptional()
  formula?: unknown;
}

export class UpdateWorkItemDto {
  @IsArray({ message: 'Danh sách hạng mục phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => WorkItemRowDto)
  rows: WorkItemRowDto[];
}
