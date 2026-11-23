/** Creating an account: a code is sent, and proving it births the account. */

import { authApi } from "../api/auth.api";

export const registrationService = {
  register: authApi.register,
  verifyRegistration: authApi.registerVerify,
};
