import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1752490937391 implements MigrationInterface {
    name = 'Migration1752490937391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_template\` ADD \`deleted_at\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pto_template\` DROP COLUMN \`deleted_at\``);
    }

}
