import { Module } from '@nestjs/common';
import { ArticleModule } from './articles/article.module';
import { DatabaseModule } from './articles/database.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ArticleModule,
  ],
})
export class AppModule {}
