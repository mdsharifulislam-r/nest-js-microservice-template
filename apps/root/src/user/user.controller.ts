import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateProfileDto } from './user.dto';
import { USER_ROLES } from 'libs/enums/user';
import { Auth } from 'libs/guards/auth.guard';
import { CurrentUser } from 'libs/decorators/user.decorator';
import { FileUpload } from 'libs/decorators/file-uploader.decorator';
import { GetFile } from 'libs/decorators/get-file.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User created. OTP sent to email.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('profile')
  @Auth()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully.' })
  getProfile(@CurrentUser() user: any) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  @Auth()
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update user profile (supports image upload)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @FileUpload({ fieldName: 'image' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() payload: UpdateProfileDto,
    @GetFile('image') image: string | null,
  ) {
    return this.userService.updateProfile(user.id, payload, image ?? undefined);
  }

  @Get('all')
  @Auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all users (Admin/Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'sort', required: false, example: '-createdAt' })
  @ApiResponse({ status: 200, description: 'Paginated list of users.' })
  getAllUsers(@Query() query: Record<string, any>) {
    return this.userService.getAllUsers(query);
  }

}
