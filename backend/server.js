require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow all origins (suitable for development)
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn('MONGODB_URI is not set in .env. Mongo connection will fail until configured.');
}

mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

const contactEnquirySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    mobile: String,
    dates: String,
    travellers: String,
    budget: String,
    destination: String,
    tripType: String,
    notes: String,
    package: String,
    nights: String,
    sourcePage: String,
  },
  { timestamps: true }
);

const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASSWORD;
const adminEmail = process.env.ADMIN_EMAIL;

if (!mailUser || !mailPass || !adminEmail) {
  console.warn('MAIL_USER, MAIL_PASSWORD, or ADMIN_EMAIL missing in .env. Email sending will fail until configured.');
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

function buildUserEmailHtml(enquiry) {
  const { name, destination, dates, travellers, budget, package: pkg, nights } = enquiry;

  return `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f4f4f5; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.12);">
      <tr>
        <td style="background:linear-gradient(135deg,#1d4ed8,#0ea5e9);padding:24px 28px;color:#e5f2ff;">
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Thank you for planning your trip with Wanderlust India</h1>
          <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">We have received your enquiry and our travel expert will get back to you within one working day.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px 8px;">
          <p style="margin:0 0 12px;font-size:14px;color:#0f172a;">Hi ${name || 'Traveller'},</p>
          <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">Thank you for sharing your trip details with us. We'll review your preferences and share personalised options that work for your dates and budget.</p>
          <h2 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.04em;">Your enquiry summary</h2>
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;color:#111827;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tbody>
              ${pkg ? `<tr><td style="background:#f9fafb;padding:8px 12px;font-weight:600;width:32%;">Package</td><td style="padding:8px 12px;">${pkg}${nights ? ` (${nights})` : ''}</td></tr>` : ''}
              ${destination ? `<tr><td style="background:#f9fafb;padding:8px 12px;font-weight:600;">Preferred destination</td><td style="padding:8px 12px;">${destination}</td></tr>` : ''}
              ${dates ? `<tr><td style="background:#f9fafb;padding:8px 12px;font-weight:600;">Preferred dates</td><td style="padding:8px 12px;">${dates}</td></tr>` : ''}
              ${travellers ? `<tr><td style="background:#f9fafb;padding:8px 12px;font-weight:600;">Travellers</td><td style="padding:8px 12px;">${travellers}</td></tr>` : ''}
              ${budget ? `<tr><td style="background:#f9fafb;padding:8px 12px;font-weight:600;">Approx. budget (per person)</td><td style="padding:8px 12px;">${budget}</td></tr>` : ''}
            </tbody>
          </table>
          <p style="margin:16px 0 8px;font-size:13px;color:#4b5563;">You can reply to this email with any additional details such as exact dates, hotel category, or special requirements and we'll factor those into your plan.</p>
          <p style="margin:0 0 18px;font-size:13px;color:#4b5563;">Looking forward to crafting a memorable journey for you.</p>
          <p style="margin:0;font-size:13px;color:#111827;font-weight:600;">Team Wanderlust India</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Travel planning desk · Mon–Sat, 10:00 AM – 7:00 PM IST</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">If you received this email in error, you can ignore it. This email was sent to you because you submitted an enquiry on the Wanderlust India website.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function buildAdminEmailHtml(enquiry) {
  const {
    name,
    email,
    mobile,
    destination,
    dates,
    travellers,
    budget,
    package: pkg,
    nights,
    tripType,
    notes,
    sourcePage,
  } = enquiry;

  return `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#0b1120; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;background:#020617;border-radius:16px;overflow:hidden;border:1px solid #1e293b;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#1d4ed8,#0f172a);">
          <h1 style="margin:0;font-size:18px;font-weight:700;color:#e5f2ff;">New contact enquiry · Wanderlust India</h1>
          <p style="margin:6px 0 0;font-size:12px;color:#cbd5f5;">Captured from ${sourcePage || 'website contact form'}.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 10px;">
          <h2 style="margin:0 0 10px;font-size:14px;font-weight:600;color:#e5e7eb;text-transform:uppercase;letter-spacing:0.06em;">Traveller details</h2>
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:12px;color:#e5e7eb;border-collapse:collapse;">
            <tbody>
              ${name ? `<tr><td style="padding:4px 8px 4px 0;width:26%;color:#9ca3af;">Name</td><td style="padding:4px 0;">${name}</td></tr>` : ''}
              ${email ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Email</td><td style="padding:4px 0;">${email}</td></tr>` : ''}
              ${mobile ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Mobile</td><td style="padding:4px 0;">${mobile}</td></tr>` : ''}
            </tbody>
          </table>

          <h2 style="margin:18px 0 8px;font-size:14px;font-weight:600;color:#e5e7eb;text-transform:uppercase;letter-spacing:0.06em;">Trip preferences</h2>
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:12px;color:#e5e7eb;border-collapse:collapse;">
            <tbody>
              ${pkg ? `<tr><td style="padding:4px 8px 4px 0;width:26%;color:#9ca3af;">Package</td><td style="padding:4px 0;">${pkg}${nights ? ` (${nights})` : ''}</td></tr>` : ''}
              ${destination ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Preferred destination</td><td style="padding:4px 0;">${destination}</td></tr>` : ''}
              ${dates ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Preferred dates</td><td style="padding:4px 0;">${dates}</td></tr>` : ''}
              ${travellers ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Travellers</td><td style="padding:4px 0;">${travellers}</td></tr>` : ''}
              ${budget ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Approx. budget</td><td style="padding:4px 0;">${budget}</td></tr>` : ''}
              ${tripType ? `<tr><td style="padding:4px 8px 4px 0;color:#9ca3af;">Trip type</td><td style="padding:4px 0;">${tripType}</td></tr>` : ''}
            </tbody>
          </table>

          ${notes ? `<h2 style="margin:18px 0 8px;font-size:14px;font-weight:600;color:#e5e7eb;text-transform:uppercase;letter-spacing:0.06em;">Additional notes</h2><p style="margin:0;font-size:12px;color:#d1d5db;white-space:pre-line;">${notes}</p>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:14px 24px 18px;border-top:1px solid #1e293b;background:#020617;">
          <p style="margin:0;font-size:11px;color:#6b7280;">This enquiry was captured at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Reply directly to the traveller to continue the conversation.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

app.post('/api/contact', async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      dates,
      travellers,
      budget,
      destination,
      tripType,
      notes,
      package: pkg,
      nights,
      sourcePage,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const enquiry = await ContactEnquiry.create({
      name,
      email,
      mobile,
      dates,
      travellers,
      budget,
      destination,
      tripType,
      notes,
      package: pkg,
      nights,
      sourcePage,
    });

    const enquiryData = enquiry.toObject();

    if (mailUser && adminEmail) {
      const userMailOptions = {
        from: { name: 'Wanderlust India', address: mailUser },
        to: email,
        subject: 'We have received your trip enquiry · Wanderlust India',
        html: buildUserEmailHtml(enquiryData),
      };

      const adminMailOptions = {
        from: { name: 'Wanderlust India Enquiries', address: mailUser },
        to: adminEmail,
        subject: `New travel enquiry from ${name}`,
        html: buildAdminEmailHtml(enquiryData),
        replyTo: email,
      };

      await Promise.all([
        transporter.sendMail(userMailOptions),
        transporter.sendMail(adminMailOptions),
      ]);
    }

    return res.status(201).json({ message: 'Enquiry submitted successfully.' });
  } catch (err) {
    console.error('Error handling /api/contact:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Wanderlust India backend is running.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
