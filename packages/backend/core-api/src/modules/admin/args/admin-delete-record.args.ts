import { InputType } from '@config/libs';

import { AdminGetTableRecordArgs } from '@modules/admin/args/admin-get-table-record.args';

@InputType()
export class AdminDeleteRecordArgs extends AdminGetTableRecordArgs {}
