import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WeatherRowDto {
  @IsString({ message: 'Buổi trong ngày phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Buổi trong ngày không được để trống' })
  period: string;

  @IsBoolean({ message: 'isSunny phải là giá trị boolean' })
  @IsOptional()
  isSunny?: boolean;

  @IsBoolean({ message: 'isRainy phải là giá trị boolean' })
  @IsOptional()
  isRainy?: boolean;

  @IsBoolean({ message: 'isNormal phải là giá trị boolean' })
  @IsOptional()
  isNormal?: boolean;

  @IsString({ message: 'Gió phải là chuỗi ký tự' })
  @IsOptional()
  wind?: string;

  @IsString({ message: 'Sóng phải là chuỗi ký tự' })
  @IsOptional()
  wave?: string;

  @IsString({ message: 'Chiều dâng phải là chuỗi ký tự' })
  @IsOptional()
  swell?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;
}

export class UpdateWeatherDto {
  @IsArray({ message: 'Danh sách thời tiết phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => WeatherRowDto)
  rows: WeatherRowDto[];
}
