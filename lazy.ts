import * as Mongo from 'mongodb';
import {getDbToken, InjectDb, MongoModule} from 'nest-mongodb';
import {Injectable, Logger, Module} from '@nestjs/common';
import {LazyModuleLoader, ModuleRef, NestFactory} from '@nestjs/core';

const connectionName = 'foo';
const dbName = 'bar';

@Injectable()
export class DatabaseService {
    private db!: Mongo.Db;
    private test!: Mongo.Collection<any>;

    constructor(private moduleRef: ModuleRef) {}

    onModuleInit() {
        this.db = this.moduleRef.get(getDbToken(dbName));
        this.test = this.db.collection('test');
    }

    async insert(): Promise<void> {
        await this.test.insertOne({qux: 42});
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

    await db.insert();
    logger.log("Success!");
    await context.close();
}

main();
