import * as Mongo from 'mongodb';
import {getDbToken, InjectDb, MongoModule} from 'nest-mongodb';
import {Injectable, Logger, Module} from '@nestjs/common';
import {LazyModuleLoader, ModuleRef, NestFactory} from '@nestjs/core';

const connectionName = 'foo';
const dbName = 'test';

@Injectable()
export class DatabaseService {
    private db!: Mongo.Db;
    private logger = new Logger("Database");

    constructor(private moduleRef: ModuleRef) {}

    onModuleInit() {
        this.logger.log("onModuleInit");
        this.db = this.moduleRef.get(getDbToken(connectionName), { strict: false });
    }

    async stats(): Promise<void> {
        this.logger.log(await this.db.stats());
    }

}

@Module({
    imports: [
        MongoModule.forRootAsync({
            useFactory() {
                return {
                    connectionName,
                    uri: 'mongodb://root:password@localhost:27017',
                    dbName,
                };
            },
            connectionName,
        }),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}

@Module({})
export class Root {}

async function main() {
    const context = await NestFactory.createApplicationContext(Root);
    const loader = context.get(LazyModuleLoader);
    const moduleRef = await loader.load(() => DatabaseModule);
    const logger = new Logger("Root");
    const db = moduleRef.get(DatabaseService);
    db.onModuleInit();
    await db.stats();

    logger.log("Success!");
    await context.close();
}

main();
