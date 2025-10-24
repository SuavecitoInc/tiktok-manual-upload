import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import multer from 'multer';

import {
  createOrdersController,
  createFulfillmentsController,
  createFulfillmentsControllerV2,
} from '../controllers';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const routes = (app: Express) => {
  app.get('/uptime', (req: Request, res: Response) => {
    res.status(200).send({
      uptime: '',
      message: 'Ok',
      date: new Date(),
      ip: req.ip,
    });
  });

  const apiRouter = express.Router();

  apiRouter.post('/orders', upload.single('csv'), createOrdersController);
  apiRouter.post(
    '/fulfillments',
    upload.single('csv'),
    createFulfillmentsControllerV2,
  );

  app.use('/api', apiRouter);
};

export default routes;
