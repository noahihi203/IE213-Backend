export const adminConfig = {
  minActiveAdmins: parseInt(process.env.MIN_ACTIVE_ADMINS || "1"),
  maxActiveAdmins: parseInt(process.env.MAX_ACTIVE_ADMINS || "5"),
  superAdminId: process.env.SUPER_ADMIN_ID || null,
};
