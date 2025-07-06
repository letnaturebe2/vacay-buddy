import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750598610925 implements MigrationInterface {
    name = 'Migration1750598610925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`tz\` varchar(30) NOT NULL DEFAULT 'Asia/Seoul'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`tz_offset\` int NOT NULL DEFAULT '32400'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`tz_offset\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`tz\``);
    }

}
