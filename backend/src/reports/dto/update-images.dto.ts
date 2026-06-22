import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImageMetadataRowDto {
  @IsInt({ message: 'ID hình ảnh phải là số nguyên' })
  @IsNotEmpty({ message: 'ID hình ảnh không được để trống' })
  id: number;

  @IsString({ message: 'Chú thích phải là chuỗi ký tự' })
  @IsOptional()
  caption?: string;

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên' })
  @IsNotEmpty({ message: 'Thứ tự sắp xếp không được để trống' })
  sortOrder: number;
}

export class UpdateImagesDto {
  @IsArray({ message: 'Danh sách metadata ảnh phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => ImageMetadataRowDto)
  rows: ImageMetadataRowDto[];
}
