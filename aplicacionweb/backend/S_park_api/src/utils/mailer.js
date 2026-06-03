const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

/**
 * Initializes the Nodemailer transporter.
 * If no SMTP_USER is provided, it automatically creates an Ethereal test account.
 */
const initTransporter = async () => {
  if (transporter) return transporter;

  try {
    let user = process.env.SMTP_USER;
    let pass = process.env.SMTP_PASS;
    let host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    let port = parseInt(process.env.SMTP_PORT) || 587;

    // Use Ethereal test account if credentials are missing
    if (!user || !pass) {
      console.log('✉️ No SMTP credentials found. Creating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log('✅ Ethereal account created:');
      console.log(`   User: ${user}`);
      console.log(`   Pass: ${pass}`);
      // In a real scenario, you'd likely update the .env or just hold these in memory for dev
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    return transporter;
  } catch (error) {
    console.error('❌ Error initializing mail transporter:', error);
    throw error;
  }
};

/**
 * Sends the activation email with OTP and temporary password.
 * @param {string} to Recipient email address
 * @param {Object} data { nombre, tempPassword, otp }
 */
const sendActivationEmail = async (to, { nombre, tempPassword, otp }) => {
  const mailTransporter = await initTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'S-Park <noreply@spark-salud.com>',
    to,
    subject: 'S-Park - Activación de cuenta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #004a99; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">S-Park</h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff; color: #334155;">
          <h2 style="margin-top: 0; color: #0f172a;">Hola, ${nombre}</h2>
          <p>Bienvenido a S-Park. Tu médico te ha registrado en nuestra plataforma.</p>
          
          <p>Para tu primer acceso desde la aplicación, utiliza la siguiente contraseña temporal:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 24px 0;">
            ${tempPassword}
          </div>

          <p>Al iniciar sesión con esta contraseña, se te pedirá el siguiente código de activación (OTP) para verificar tu identidad y crear tu contraseña definitiva:</p>
          <div style="background-color: #e6f0ff; color: #004a99; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">
            ${otp}
          </div>
          
          <p style="font-size: 14px; color: #64748b;">* Este código expirará en 15 minutos.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">S-Park Plataforma de Diagnóstico</p>
          <p style="margin: 4px 0 0 0;">Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`✉️ Correo de activación enviado a: ${to}`);
    
    // Log preview URL if using Ethereal
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('❌ Error enviando correo de activación:', error);
    // Depending on business logic, we might throw or just return false
    throw error;
  }
};

module.exports = {
  sendActivationEmail
};
