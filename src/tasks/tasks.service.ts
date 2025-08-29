import {
  HttpException,
  HttpStatus,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTasksDto } from './dto/create-tasks.dto';
import { UpdateTasksDto } from './dto/update-tasks.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '../../generated/prisma';
import { Role } from 'src/auth/common/role.enum';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto?: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto || {};

    const allTask = await this.prisma.task.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        createdAt: 'desc',
      },
    });
    return allTask;
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (task?.name) return task;
    throw new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND);
  }

  async create(createTaskDto: CreateTasksDto, user: User) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          name: createTaskDto.name,
          description: createTaskDto.description,
          completed: false,
          userId: user.id,
        },
      });
      console.log(newTask);
      return newTask;
    } catch (err) {
      console.log('erro aqui', err);
      throw new HttpException(
        'Falha ao cadastrar tarefa!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: number, updateTasksDto: UpdateTasksDto, user: User) {
    const findTask = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (!findTask) {
      throw new HttpException('Essa tarefa não existe!', HttpStatus.NOT_FOUND);
    }

    if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para editar essa tarefa!',
      );
    }

    const task = await this.prisma.task.update({
      where: {
        id: findTask.id,
      },
      data: {
        name: updateTasksDto?.name ? updateTasksDto.name : findTask.name,
        description: updateTasksDto?.description
          ? updateTasksDto.description
          : findTask.description,
        completed: updateTasksDto?.completed
          ? updateTasksDto.completed
          : findTask.completed,
      },
    });
    return task;
  }

  async Delete(id: number, user: User) {
    try {
      const findTask = await this.prisma.task.findFirst({
        where: {
          id: id,
        },
      });
      if (!findTask) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar essa tarefa!',
        );
      }
      await this.prisma.task.delete({
        where: {
          id: findTask.id,
        },
      });
      return { message: 'Tarefa deletada com sucesso!' };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Erro ao deletar a tarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
