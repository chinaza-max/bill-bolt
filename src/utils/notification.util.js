import Joi from 'joi';
import USER_TYPE from '../constants/userTypes.js'; // your user type constant: MERCHANT/CLIENT

const notificationUtil = {
  // Validation for fetching notifications
  fetchNotifications: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(10),
    user_type: Joi.string()
      .valid(...Object.values(USER_TYPE))
      .optional(),
  }),
};

export default notificationUtil;
