import * as Mongo from 'mongodb';
import {InjectDb, MongoModule} from 'nest-mongodb';
import {Injectable, Logger, Module} from '@nestjs/common';
import {LazyModuleLoader, NestFactory} from '@nestjs/core';

const connectionName = 'foo';
const databaseName = 'bar';

@Injectable()
export class DatabaseService {
    private readonly test: Mongo.Collection<any>;

    constructor(
        @InjectDb(connectionName)
        private readonly db: Mongo.Db,
    ) {
        this.test = this.db.collection('test');
    }

    async insert(): Promise<void> {
        await this.test.insertOne({qux: 42});
    }
}

@Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}

@Module({
    imports: [
        MongoModule.forRootAsync({
            useFactory() {
                return {
                    connectionName,
                    uri: 'mongodb://root:password@localhost:27017',
                    dbName: databaseName,
                };
            },
            connectionName,
        }),
    ],
})
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
