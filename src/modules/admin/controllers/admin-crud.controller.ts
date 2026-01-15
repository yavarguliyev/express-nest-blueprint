import { ApiController, BaseController } from '@common/controllers';
import { Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@common/decorators';
import { AdminGuard } from '@common/guards';
import { AdminCrudService } from '@modules/admin/services/admin-crud.service';
import { Logger } from '@common/logger';

@ApiController({ path: '/admin/crud' })
@UseGuards(AdminGuard)
export class AdminCrudController extends BaseController {
  private readonly logger = new Logger('AdminCrudController');

  constructor (private readonly adminCrudService: AdminCrudService) {
    super({ path: '/admin/crud' });
  }

  @Get('/schema')
  getSchema () {
    this.logger.log('Fetching schema');
    return this.adminCrudService.getTableSchema();
  }

  @Get('/:category/:name')
  async getTableData (@Param('category') category: string, @Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminCrudService.getTableData(category, name, pageNum, limitNum);
  }

  @Get('/:name')
  async getTableDataByName (@Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    this.logger.log(`Fetching data by name: ${name}, page: ${page}, limit: ${limit}`);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminCrudService.getTableDataByName(name, pageNum, limitNum);
  }

  @Get('/:category/:name/:id')
  async getTableRecord (@Param('category') category: string, @Param('name') name: string, @Param('id') id: string) {
    return this.adminCrudService.getTableRecord(category, name, parseInt(id, 10));
  }

  @Post('/:category/:name')
  async createTableRecord (@Param('category') category: string, @Param('name') name: string, @Body() data: unknown) {
    return this.adminCrudService.createTableRecord(category, name, data);
  }

  @Patch('/:category/:name/:id')
  async updateTableRecord (@Param('category') category: string, @Param('name') name: string, @Param('id') id: string, @Body() data: unknown) {
    return this.adminCrudService.updateTableRecord(category, name, parseInt(id, 10), data);
  }

  @Delete('/:category/:name/:id')
  async deleteTableRecord (@Param('category') category: string, @Param('name') name: string, @Param('id') id: string) {
    const success = await this.adminCrudService.deleteTableRecord(category, name, parseInt(id, 10));
    return { success };
  }
}
