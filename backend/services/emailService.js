const config = require('../config/env');

/**
 * Service to simulate transactional email notifications.
 * Logs output directly to console in development/testing mode, 
 * with structural placeholders to hook into a production provider (e.g. Resend, SendGrid, or SMTP).
 */

const sendEmail = async ({ to, subject, html }) => {
  // Simulating mail dispatch logs
  console.log(`\n==================================================`);
  console.log(`[EMAIL DISPATCH]`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:`);
  console.log(html.replace(/<[^>]*>/g, ' ').trim()); // simple text extraction
  console.log(`==================================================\n`);
  return { success: true, messageId: `msg_${Math.random().toString(36).substr(2, 9)}` };
};

/**
 * Send email verification link
 */
exports.sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${config.FRONTEND_URL}/portal/verify?token=${token}`;
  const subject = 'Verify your email address - PACE Portal';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Welcome to PACE, ${name}!</h2>
      <p>Please verify your email address to complete your registration and activate your account.</p>
      <p style="margin: 20px 0;">
        <a href="${verifyUrl}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email Address
        </a>
      </p>
      <p>Or copy this link into your browser: <br/> ${verifyUrl}</p>
      <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;" />
      <small style="color: #666;">NITK Civil Engineering Internship Platform</small>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Send professor approval or rejection email
 */
exports.sendProfessorStatusEmail = async (email, name, status, reason = '') => {
  const subject = `Your Professor Profile status update - PACE Portal`;
  let html = '';
  
  if (status === 'approved') {
    html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Congratulations Dr./Prof. ${name},</h2>
        <p>Your faculty profile request has been approved by the platform administrators.</p>
        <p>You now have full dashboard access to post new internship opportunities and review student applicants.</p>
        <p style="margin: 20px 0;">
          <a href="${config.FRONTEND_URL}/portal/login" style="background-color: #198754; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Faculty Dashboard
          </a>
        </p>
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;" />
        <small style="color: #666;">NITK Civil Engineering Internship Platform</small>
      </div>
    `;
  } else {
    html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${name},</h2>
        <p>Your faculty registration request was reviewed and declined by the administrators.</p>
        <p><strong>Reason provided:</strong> ${reason || 'No additional details provided.'}</p>
        <p>If you believe this was an error or wish to submit additional proof, you may re-register with proper credentials.</p>
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;" />
        <small style="color: #666;">NITK Civil Engineering Internship Platform</small>
      </div>
    `;
  }
  return sendEmail({ to: email, subject, html });
};

/**
 * Send application status transition emails (shortlisted, selected, rejected)
 */
exports.sendApplicationStatusEmail = async (email, studentName, internshipTitle, status) => {
  const subject = `Application Status Update: ${internshipTitle}`;
  let statusText = status.toUpperCase();
  let color = '#0d6efd'; // blue for shortlisted
  let detailMessage = 'The professor has shortlisted your application for further screening. They may contact you shortly.';

  if (status === 'selected') {
    color = '#198754'; // green
    statusText = 'SELECTED 🎉';
    detailMessage = 'Congratulations! You have been selected for this internship position. The faculty supervisor will get in touch with you regarding the next steps.';
  } else if (status === 'rejected') {
    color = '#dc3545'; // red
    statusText = 'REJECTED';
    detailMessage = 'We regret to inform you that your application for this position was not selected this time. Thank you for your interest.';
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Hello ${studentName},</h2>
      <p>There is an update on your application for the internship <strong>"${internshipTitle}"</strong>.</p>
      <div style="background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 15px; margin: 15px 0;">
        <span style="font-size: 14px; font-weight: bold; color: ${color}; text-transform: uppercase;">Status: ${statusText}</span>
        <p style="margin: 5px 0 0 0; font-size: 13px;">${detailMessage}</p>
      </div>
      <p style="margin: 20px 0;">
        <a href="${config.FRONTEND_URL}/portal/applications" style="background-color: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: bold;">
          View Applications Dashboard
        </a>
      </p>
      <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;" />
      <small style="color: #666;">NITK Civil Engineering Internship Platform</small>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Send notification to pending candidates when an internship is closed
 */
exports.sendInternshipClosedEmail = async (email, studentName, internshipTitle) => {
  const subject = `Internship Closing: ${internshipTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Hello ${studentName},</h2>
      <p>The internship listing <strong>"${internshipTitle}"</strong> has been closed by the faculty supervisor.</p>
      <p>Any pending applications for this position have been completed. Thank you for applying.</p>
      <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 20px;" />
      <small style="color: #666;">NITK Civil Engineering Internship Platform</small>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};
