import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, './swagger.json'), 'utf8'));

export function setupSwagger(app: any) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.get('/swagger.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerDocument);
    });

    console.log('Swagger documentation available at /api-docs');
}
