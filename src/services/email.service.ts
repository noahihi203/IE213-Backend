import { EmailClient } from "@azure/communication-email";
import logger from "../config/logger.config.js";

const connectionString = process.env.AZURE_EMAIL_CONNECTION_STRING as string;
const senderAddress = process.env.AZURE_SENDER_EMAIL as string;

if (!connectionString || !senderAddress) {
  logger.error("Missing Azure Communication Services environment variables!");
}

const emailClient = new EmailClient(connectionString);

class EmailService {
  static async sendVerificationEmail(toEmail: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const message = {
      senderAddress: senderAddress,
      content: {
        subject: "🎓 Xác thực tài khoản UniSync của bạn",
        plainText: `Chào mừng bạn đến với UniSync! Vui lòng truy cập liên kết sau để xác thực email và bắt đầu khám phá thông tin các trường đại học tại TP.HCM: ${verificationLink}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">
              
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                  Chào mừng bạn đến với UniSync! 🎓
                </h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0;">
                  Chào mừng bạn đến với UniSync – nền tảng tổng hợp thông tin các trường đại học tại TP.HCM. 
                  Chúng tôi rất vui khi bạn tham gia cùng cộng đồng sinh viên và người học.
                </p>

                <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                  Để bắt đầu sử dụng đầy đủ các tính năng như xem thông tin trường, ngành học và cập nhật mới nhất, 
                  vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2), 0 2px 4px -2px rgba(5, 150, 105, 0.1);">
                    Kích hoạt tài khoản UniSync
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                  Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết này vào trình duyệt:
                </p>

                <p style="font-size: 14px; color: #059669; word-break: break-all; margin-top: 8px;">
                  ${verificationLink}
                </p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                  Email được gửi tự động từ hệ thống UniSync. Vui lòng không trả lời email này.
                </p>
              </div>

            </div>
          </div>
        `,
      },
      recipients: {
        to: [{ address: toEmail }],
      },
    };

    try {
      const poller = await emailClient.beginSend(message);
      await poller.pollUntilDone();
      logger.info(`Verification email sent successfully to ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${toEmail}:`, error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(toEmail: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const message = {
      senderAddress: senderAddress,
      content: {
        subject: "🔐 Đặt lại mật khẩu tài khoản UniSync",
        plainText: `Bạn đã yêu cầu đặt lại mật khẩu tài khoản UniSync. Vui lòng truy cập liên kết sau để đặt lại mật khẩu: ${resetLink}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">
              
              <div style="background-color: #0f172a; padding: 35px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                  Đặt lại mật khẩu UniSync 🔐
                </h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 0;">
                  Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản UniSync của bạn.
                </p>

                <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                  Nhấp vào nút bên dưới để thiết lập mật khẩu mới. 
                  <b>Liên kết này chỉ có hiệu lực trong 15 phút.</b>
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetLink}" style="display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -2px rgba(37, 99, 235, 0.1);">
                    Đặt lại mật khẩu
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                  Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                  Liên kết dự phòng:
                </p>

                <p style="font-size: 14px; color: #2563eb; word-break: break-all; margin-top: 8px;">
                  ${resetLink}
                </p>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                  Email được gửi tự động từ hệ thống UniSync. Vui lòng không trả lời email này.
                </p>
              </div>

            </div>
          </div>
        `,
      },
      recipients: {
        to: [{ address: toEmail }],
      },
    };

    try {
      const poller = await emailClient.beginSend(message);
      await poller.pollUntilDone();
      logger.info(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send reset email to ${toEmail}:`, error);
      throw error;
    }
  }
}

export default EmailService;
