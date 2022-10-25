import * as Mongo from 'mongodb';
import {InjectDb, MongoModule} from 'nest-mongodb';
import {Injectable, Module, Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';

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
        DatabaseModule,
    ],
})
export class Root {}

async function main() {
    const context = await NestFactory.createApplicationContext(Root);
    const db = context.get(DatabaseService);
    const logger = new Logger("Root");

    await db.insert();
    logger.log("Success!");
}

main();
