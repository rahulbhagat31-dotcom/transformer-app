const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send QA review alert
 * @param {Object} item - Checklist item
 * @param {string} qaEmail - QA supervisor email
 */
async function sendQAReviewAlert(item, qaEmail = 'qa@company.com') {
    try {
        const mailOptions = {
            from: `"Transformer System" <${process.env.SMTP_USER}>`,
            to: qaEmail,
            subject: `QA Review Required: ${item.wo} - ${item.stage}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4472C4; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
                        .detail { margin: 10px 0; }
                        .label { font-weight: bold; color: #4472C4; }
                        .button { display: inline-block; padding: 12px 24px; background: #4472C4; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🔍 QA Review Required</h2>
                        </div>
                        <div class="content">
                            <p>A checklist item is ready for quality review:</p>
                            
                            <div class="detail">
                                <span class="label">Work Order:</span> ${item.wo}
                            </div>
                            <div class="detail">
                                <span class="label">Stage:</span> ${item.stage}
                            </div>
                            <div class="detail">
                                <span class="label">Inspection Point:</span> ${item.inspectionPoint}
                            </div>
                            <div class="detail">
                                <span class="label">Standard Value:</span> ${item.standardValue || 'N/A'}
                            </div>
                            <div class="detail">
                                <span class="label">Actual Value:</span> ${item.actualValue || 'N/A'}
                            </div>
                            <div class="detail">
                                <span class="label">Technician:</span> ${item.technician || 'N/A'}
                            </div>
                            <div class="detail">
                                <span class="label">Shop Supervisor:</span> ${item.shopSupervisor || 'N/A'}
                            </div>
                            
                            <a href="http://localhost:3000" class="button">View Checklist</a>
                        </div>
                        <div class="footer">
                            <p>This is an automated notification from the Transformer Manufacturing System</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info('QA review email sent', { wo: item.wo, stage: item.stage, to: qaEmail });
    } catch (error) {
        logger.logError(error, { context: 'sendQAReviewAlert', item });
    }
}

/**
 * Send delay alert for transformer
 * @param {Object} transformer - Transformer details
 * @param {string} managerEmail - Manager email
 */
async function sendDelayAlert(transformer, managerEmail = 'manager@company.com') {
    try {
        const daysDelayed = Math.floor((new Date() - new Date(transformer.deliveryDate)) / (1000 * 60 * 60 * 24));

        const mailOptions = {
            from: `"Transformer System" <${process.env.SMTP_USER}>`,
            to: managerEmail,
            subject: `⚠️ Transformer Delayed: ${transformer.woNumber}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #DC3545; color: white; padding: 20px; text-align: center; }
                        .content { background: #fff3cd; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107; }
                        .detail { margin: 10px 0; }
                        .label { font-weight: bold; }
                        .warning { color: #dc3545; font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>⚠️ Transformer Delivery Delayed</h2>
                        </div>
                        <div class="content">
                            <p class="warning">Transformer is ${daysDelayed} days overdue!</p>
                            
                            <div class="detail">
                                <span class="label">Work Order:</span> ${transformer.woNumber}
                            </div>
                            <div class="detail">
                                <span class="label">Customer:</span> ${transformer.customerId}
                            </div>
                            <div class="detail">
                                <span class="label">Rating:</span> ${transformer.rating} kVA
                            </div>
                            <div class="detail">
                                <span class="label">Expected Delivery:</span> ${new Date(transformer.deliveryDate).toLocaleDateString()}
                            </div>
                            <div class="detail">
                                <span class="label">Days Delayed:</span> ${daysDelayed} days
                            </div>
                            
                            <p style="margin-top: 20px;">Please review and take necessary action.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info('Delay alert email sent', { wo: transformer.woNumber, daysDelayed });
    } catch (error) {
        logger.logError(error, { context: 'sendDelayAlert', transformer });
    }
}

/**
 * Send daily summary report
 * @param {Object} summary - Summary data
 * @param {string} recipientEmail - Recipient email
 */
async function sendDailySummary(summary, recipientEmail = 'admin@company.com') {
    try {
        const mailOptions = {
            from: `"Transformer System" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: `📊 Daily Summary - ${new Date().toLocaleDateString()}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                        .stat-box { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; }
                        .stat-number { font-size: 32px; font-weight: bold; color: #4472C4; }
                        .stat-label { color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>📊 Daily Summary Report</h2>
                            <p>${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <div class="stat-box">
                            <div class="stat-number">${summary.pendingQA || 0}</div>
                            <div class="stat-label">Items Pending QA Review</div>
                        </div>
                        
                        <div class="stat-box">
                            <div class="stat-number">${summary.delayedTransformers || 0}</div>
                            <div class="stat-label">Delayed Transformers</div>
                        </div>
                        
                        <div class="stat-box">
                            <div class="stat-number">${summary.completedToday || 0}</div>
                            <div class="stat-label">Items Completed Today</div>
                        </div>
                        
                        <div class="stat-box">
                            <div class="stat-number">${summary.activeTransformers || 0}</div>
                            <div class="stat-label">Active Transformers</div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info('Daily summary email sent', { to: recipientEmail });
    } catch (error) {
        logger.logError(error, { context: 'sendDailySummary' });
    }
}

/**
 * Send lock notification
 * @param {Object} data - Lock data
 */
async function sendLockNotification(data) {
    try {
        const mailOptions = {
            from: `"Transformer System" <${process.env.SMTP_USER}>`,
            to: 'qa@company.com',
            subject: `🔒 Row Locked: ${data.wo}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #dc3545;">🔒 Checklist Row Locked</h2>
                        <p><strong>Work Order:</strong> ${data.wo}</p>
                        <p><strong>Stage:</strong> ${data.stage}</p>
                        <p><strong>Locked By:</strong> ${data.lockedBy}</p>
                        <p><strong>Reason:</strong> ${data.reason}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info('Lock notification sent', { wo: data.wo });
    } catch (error) {
        logger.logError(error, { context: 'sendLockNotification' });
    }
}

/**
 * Test email configuration
 */
async function testEmailConfig() {
    try {
        await transporter.verify();
        logger.info('Email configuration verified successfully');
        return true;
    } catch (error) {
        logger.logError(error, { context: 'testEmailConfig' });
        return false;
    }
}

module.exports = {
    sendQAReviewAlert,
    sendDelayAlert,
    sendDailySummary,
    sendLockNotification,
    testEmailConfig
};
