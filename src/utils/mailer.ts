import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';
import { config } from '../config/env';

interface EmailTemplates {
  verification: (code: string) => string;
    passwordReset: (code: string) => string;

}

const smpt = config.SMTP;
const transporter: Transporter = nodemailer.createTransport({
  host: smpt.host,
  port: smpt.port,
  secure: false,
  auth: {
    user: smpt.user,
    pass: smpt.password
  }
});

export const sendMail = async (
  to: string,
  subject: string,
  html: string
):Promise<void> => {
  const mailOptions: SendMailOptions = {
    from: `"ReduxHub" <${process.env.SMTP_FROM_EMAIL}>`,
    to: to,
    subject: subject,
    html: html
  };
  
  try{
    await transporter.sendMail(mailOptions);
    console.log('dsada')
  } catch (error){
    throw error
  }
}