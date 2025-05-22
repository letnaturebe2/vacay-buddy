import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745118978340 implements MigrationInterface {
    name = 'Migration1745118978340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`google_access_token\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`google_access_token\` varchar(255) NULL`);
    }

}
