import type { NextFunction, Request, Response } from 'express';
import type { PortfolioHomeReadService } from './portfolio-home.read-service';

export class PortfolioHomeController {
  constructor(private readonly service: PortfolioHomeReadService) {}

  getHome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: { code: 'PORTFOLIO_HOME_AUTH_REQUIRED' } });
        return;
      }
      const data = await this.service.getHome(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
