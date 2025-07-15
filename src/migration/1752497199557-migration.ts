import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1752497199557 implements MigrationInterface {
    name = 'Migration1752497199557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_request\` ADD \`deleted_at\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_request\` DROP COLUMN \`deleted_at\``);
    }

}
