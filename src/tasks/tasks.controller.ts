import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTasksDto } from './dto/create-tasks.dto';
import { UpdateTasksDto } from './dto/update-tasks.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/param/token-payload.param';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';

@Controller('tasks')
//@UseInterceptors(LoggerInterceptor)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Get('/All')
  findAllTasks(@Query() paginationDto: PaginationDto) {
    return this.taskService.findAll(paginationDto);
  }

  @Get(':id')
  findOneTask(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @UseGuards(AuthTokenGuard)
  @Post()
  createTask(
    @Body() createTaskDto: CreateTasksDto,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.create(createTaskDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTasksDto: UpdateTasksDto,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.update(id, updateTasksDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: PayloadTokenDto,
  ) {
    return this.taskService.Delete(id, tokenPayload);
  }
}
