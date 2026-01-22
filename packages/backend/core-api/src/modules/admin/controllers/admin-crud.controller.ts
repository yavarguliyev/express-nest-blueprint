import { ApiController, BaseController, Body, Delete, Get, Param, Patch, Post, Query, CurrentUser, JwtPayload, Roles, UserRoles } from '@config/libs';

import { AdminCrudService } from '@modules/admin/services/admin-crud.service';

@ApiController({ path: '/admin/crud' })
@Roles(UserRoles.GLOBAL_ADMIN, UserRoles.ADMIN)
export class AdminCrudController extends BaseController {
  constructor(private readonly adminCrudService: AdminCrudService) {
    super({ path: '/admin/crud' });
  }

  @Get('/schema')
  getSchema() {
    return this.adminCrudService.getTableSchema();
  }

  @Get('/:category/:name')
  async getTableData(@Param('category') category: string, @Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.adminCrudService.getTableData(category, name, page, limit, search);
  }

  @Get('/:name')
  async getTableDataByName(@Param('name') name: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.adminCrudService.getTableDataByName(name, page, limit, search);
  }

  @Get('/:category/:name/:id')
  async getTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string) {
    return this.adminCrudService.getTableRecord(category, name, id);
  }

  @Post('/:category/:name')
  async createTableRecord(@Param('category') category: string, @Param('name') name: string, @Body() data: unknown) {
    return this.adminCrudService.createTableRecord(category, name, data);
  }

  @Patch('/:category/:name/:id')
  async updateTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string, @Body() data: Record<string, unknown>, @CurrentUser() user: JwtPayload) {
    return this.adminCrudService.updateTableRecord(category, name, id, data, user);
  }

  @Delete('/:category/:name/:id')
  async deleteTableRecord(@Param('category') category: string, @Param('name') name: string, @Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.adminCrudService.deleteTableRecord(category, name, id, user);
  }
}
