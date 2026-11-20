import type { FastifyPluginAsync } from 'fastify';
import { enquirySchema, type EnquiryAccepted } from '@catalogue/shared';
import type { EnquiryService } from '../services/enquiry.service';

export const enquiriesRoutes: FastifyPluginAsync<{ enquiries: EnquiryService }> = async (
  app,
  { enquiries },
) => {
  app.post(
    '/enquiries',
    // Basic abuse protection: 5 enquiries per minute per client IP (DECISIONS A15).
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply): Promise<EnquiryAccepted> => {
      const enquiry = enquirySchema.parse(request.body);
      const accepted = await enquiries.submit(enquiry);
      // 202: accepted and handed to the mail provider; there's no stored resource to point to.
      reply.status(202);
      return accepted;
    },
  );
};
