import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1752554613895 implements MigrationInterface {
    name = 'Migration1752554613895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_approval\` ADD \`deleted_at\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_approval\` DROP COLUMN \`deleted_at\``);
    }

}
