import nodemailer from 'nodemailer';

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
});

export interface BookingEmailData {
  patientName: string;
  patientEmail: string;
  nurseName: string;
  nurseEmail: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  address: string;
  estimatedCost: number;
  bookingId: string;
  notes?: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  try {
    // Email to patient
    const patientMailOptions = {
      from: process.env.GMAIL_USER,
      to: data.patientEmail,
      subject: 'Booking Confirmation - CareBridge',
      html: generatePatientEmailTemplate(data),
    };

    // Email to nurse
    const nurseMailOptions = {
      from: process.env.GMAIL_USER,
      to: data.nurseEmail,
      subject: 'New Assignment - CareBridge',
      html: generateNurseEmailTemplate(data),
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(patientMailOptions),
      transporter.sendMail(nurseMailOptions),
    ]);

    console.log('Booking confirmation emails sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation emails:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function generatePatientEmailTemplate(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: bold; color: #475569; }
        .detail-value { color: #1e293b; }
        .cost { font-size: 18px; font-weight: bold; color: #0891b2; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 CareBridge</h1>
          <h2>Booking Confirmation</h2>
        </div>
        <div class="content">
          <p>Dear ${data.patientName},</p>
          <p>Your nurse booking has been confirmed! Here are the details:</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${data.serviceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nurse:</span>
              <span class="detail-value">${data.nurseName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(data.appointmentDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${data.appointmentTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${data.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estimated Cost:</span>
              <span class="detail-value cost">PKR ${data.estimatedCost}</span>
            </div>
            ${data.notes ? `
            <div class="detail-row">
              <span class="detail-label">Notes:</span>
              <span class="detail-value">${data.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Your assigned nurse will contact you before the appointment</li>
            <li>Please ensure someone is available at the scheduled time</li>
            <li>Have your medical history and current medications ready</li>
            <li>Payment will be collected after the service is completed</li>
          </ul>
          
          <p>If you need to reschedule or cancel, please contact us at least 2 hours before your appointment.</p>
          
          <div class="footer">
            <p>Thank you for choosing CareBridge!</p>
            <p>For support, contact us at support@carebridge.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateNurseEmailTemplate(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .assignment-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: bold; color: #475569; }
        .detail-value { color: #1e293b; }
        .cost { font-size: 18px; font-weight: bold; color: #0891b2; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        .action-button { background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 CareBridge</h1>
          <h2>New Patient Assignment</h2>
        </div>
        <div class="content">
          <p>Dear ${data.nurseName},</p>
          <p>You have been assigned a new patient. Please review the details below:</p>
          
          <div class="assignment-details">
            <h3>Assignment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Patient:</span>
              <span class="detail-value">${data.patientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${data.serviceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(data.appointmentDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${data.appointmentTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${data.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Your Fee:</span>
              <span class="detail-value cost">PKR ${data.estimatedCost}</span>
            </div>
            ${data.notes ? `
            <div class="detail-row">
              <span class="detail-label">Patient Notes:</span>
              <span class="detail-value">${data.notes}</span>
            </div>
            ` : ''}
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Log into your CareBridge dashboard to accept/decline this assignment</li>
            <li>Contact the patient 30 minutes before the appointment</li>
            <li>Bring necessary medical supplies and equipment</li>
            <li>Update the patient's treatment log after completion</li>
          </ul>
          
          <div class="footer">
            <p>Thank you for being part of the CareBridge team!</p>
            <p>For support, contact us at support@carebridge.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
