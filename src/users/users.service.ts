import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,
  ) {}

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        Tasks: true,
      },
    });
    if (user) return user;

    throw new HttpException('Usuário não encontrado!', HttpStatus.BAD_REQUEST);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password,
      );

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      return user;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao cadastrar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    tokenPayLoad: PayloadTokenDto,
  ) {
    console.log(tokenPayLoad);
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new HttpException('Uusuário não existe!', HttpStatus.BAD_REQUEST);
      }
      if (user.id !== tokenPayLoad.sub) {
        throw new HttpException(
          'Você não tem permissão para atualizar este usuário!',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const dataUser: { name?: string; passwordHash?: string } = {
        name: updateUserDto.name ? updateUserDto.name : user.name,
      };
      if (updateUserDto?.password) {
        const passwordHash = await this.hashingService.hash(
          updateUserDto?.password,
        );
        dataUser['passwordHash'] = passwordHash;
      }
      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: updateUserDto.name ? updateUserDto.name : user.name,
          passwordHash: dataUser?.passwordHash
            ? dataUser?.passwordHash
            : user.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          Tasks: true,
        },
      });
      return updateUser;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao atualizar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(id: number, tokenPayLoad: PayloadTokenDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new HttpException('Usuário não existe', HttpStatus.BAD_REQUEST);
      }
      if (user.id !== tokenPayLoad.sub) {
        throw new HttpException(
          'Você não tem permissão para deletar este usuário!',
          HttpStatus.UNAUTHORIZED,
        );
      }
      await this.prisma.user.delete({
        where: {
          id: user.id,
        },
      });
      return {
        message: 'Usuário deletado com sucesso!',
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao deletar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadAvatarImage(
    tokenPayLoad: PayloadTokenDto,
    file: Express.Multer.File,
  ) {
    try {
      const mimeType = file.mimetype;
      const fileExtension = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);
      console.log(mimeType);
      console.log(fileExtension);
      const fileName = `${tokenPayLoad.sub}.${fileExtension}`;
      const fileLocale = path.resolve(process.cwd(), 'files', fileName);
      await fs.writeFile(fileLocale, file.buffer);
      const user = await this.prisma.user.findFirst({
        where: {
          id: tokenPayLoad.sub,
        },
      });
      if (!user) {
        throw new HttpException(
          'Falha ao atualizar o avatar do usuário!',
          HttpStatus.BAD_REQUEST,
        );
      }
      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: fileName,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });
      return updateUser;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao fazer upload da imagem!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
