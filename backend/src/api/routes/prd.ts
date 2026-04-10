import { Router } from 'express';
import { createPrd } from '../../services/prdService.js';

export const prdRouter = Router();

prdRouter.post('/', async (req, res, next) => {
  try {
    const result = await createPrd(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
