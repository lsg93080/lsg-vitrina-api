import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  const mockConnection = { readyState: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    })
      .useMocker((token) => {
        if (token === 'DatabaseConnection') return mockConnection;
        return undefined;
      })
      .overrideProvider('DatabaseConnection')
      .useValue(mockConnection)
      .compile();

    controller = module.get<AppController>(AppController);
  });

  describe('GET /health', () => {
    it('should return ok when database is connected', () => {
      const result = controller.getHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('Vitrina API');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });
  });
});
