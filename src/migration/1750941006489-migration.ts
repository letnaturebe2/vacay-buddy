import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750941006489 implements MigrationInterface {
    name = 'Migration1750941006489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` ADD \`deleted_at\` datetime(6) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` DROP COLUMN \`deleted_at\``);
    }

}
