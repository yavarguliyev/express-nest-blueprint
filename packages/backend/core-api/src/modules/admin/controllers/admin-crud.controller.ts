import { ApiController, BaseController, Body, Delete, Get, Param, Patch, Post, Query, CurrentUser, JwtPayload, Roles } from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@ApiController({ path: '/admin/crud' })
@Roles('admin')
export class AdminCrudController extends BaseController {
  constructor(private readonly adminCrudService: AdminCrudService) {
    super({ path: '/admin/crud' });
  }

  @Get('/schema')
  getSchema() {
    return this.adminCrudService.getTableSchema();
  }

  @Get('/:category/:name')
  async getTableData(@Param('category') category: string, @Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminCrudService.getTableData(category, name, pageNum, limitNum);
  }

  @Get('/:name')
  async getTableDataByName(@Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminCrudService.getTableDataByName(name, pageNum, limitNum);
  }

  @Get('/:category/:name/:id')
  async getTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string) {
    return this.adminCrudService.getTableRecord(category, name, parseInt(id, 10));
  }

  @Post('/:category/:name')
  async createTableRecord(@Param('category') category: string, @Param('name') name: string, @Body() data: unknown) {
    return this.adminCrudService.createTableRecord(category, name, data);
  }

  @Patch('/:category/:name/:id')
  @Patch('/:category/:name/:id')
  async updateTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string, @Body() data: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.adminCrudService.updateTableRecord(category, name, parseInt(id, 10), data, user);
  }

  @Delete('/:category/:name/:id')
  async deleteTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const success = await this.adminCrudService.deleteTableRecord(category, name, parseInt(id, 10), user);
    return { success };
  }
}
