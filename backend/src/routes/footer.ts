import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const footer = db.prepare('SELECT * FROM footer WHERE id = 1').get() as any;
  if (!footer) return res.json({});
  res.json({
    tagline: footer.tagline,
    copyright: footer.copyright,
    contact: { address: footer.address, phone: footer.phone, email: footer.email, hours: footer.hours },
    socialLinks: JSON.parse(footer.socialLinks || '[]'),
    quickLinks: JSON.parse(footer.quickLinks || '[]'),
    customerService: JSON.parse(footer.customerServiceLinks || '[]'),
    paymentIcons: JSON.parse(footer.paymentIcons || '[]'),
  });
});

export default router;
