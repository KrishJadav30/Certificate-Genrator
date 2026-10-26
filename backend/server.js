require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createCanvas, loadImage } = require('canvas');
const AdmZip = require('adm-zip');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_PATH = path.join(__dirname, 'uploads');

// --- HELPER: Delay to mimic human behavior (2 seconds) ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- EMAIL CONFIG ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true, // Reuses connections to look more professional
    maxMessages: 100,
    maxConnections: 5,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// --- HELPER: Logic for Drawing Name (UPDATED POSITIONING) ---
async function createCertBuffer(template, name) {
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(template, 0, 0);

    // Font Settings: 'serif' matches the traditional medical college look. 
    ctx.font = 'bold 70pt serif'; 
    
    // Color: #1a237e is a dark blue that matches the college logo. 
    ctx.fillStyle = '#1a237e'; 
    ctx.textAlign = 'center';

    // Positioning coordinates
    const x = template.width / 2;         // Center horizontally
    const y = template.height * 0.535;    // Place it exactly ~53.5% down the page (just above the line)

    ctx.fillText(name, x, y);
    return canvas.toBuffer('image/png');
}

// --- ROUTE: ZIP DOWNLOAD ---
app.get('/api/download-zip', async (req, res) => {
    try {
        const excelFile = path.join(UPLOADS_PATH, 'list.xlsx');
        const templateFile = path.join(UPLOADS_PATH, 'Certificate.png');

        if (!fs.existsSync(excelFile)) return res.status(404).send("Excel not found");

        const workbook = xlsx.readFile(excelFile);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const template = await loadImage(templateFile);
        const zip = new AdmZip();

        for (const row of data) {
            const name = row[0]?.toString().trim();
            if (!name || name.toLowerCase() === 'name') continue;

            const buffer = await createCertBuffer(template, name);
            const safeName = name.replace(/[^a-z0-9]/gi, '_');
            zip.addFile(`${safeName}.png`, buffer);
        }

        const zipBuffer = zip.toBuffer();
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=Certificates.zip',
            'Content-Length': zipBuffer.length
        });
        res.send(zipBuffer);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// --- ROUTE: SEND EMAILS ---
app.post('/api/send-emails', async (req, res) => {
    try {
        const excelFile = path.join(UPLOADS_PATH, 'list.xlsx');
        const templateFile = path.join(UPLOADS_PATH, 'Certificate.png');
        
        const workbook = xlsx.readFile(excelFile);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        const template = await loadImage(templateFile);

        let sentCount = 0;
        for (const row of data) {
            const name = row[0]?.toString().trim();
            const email = row[1]?.toString().trim();

            if (!name || !email || name.toLowerCase() === 'name') continue;

            const buffer = await createCertBuffer(template, name);

            try {
                // Wait 2 seconds between sends to avoid Gmail's "bot" filters
                await delay(2000);

                await transporter.sendMail({
                    from: '"Your Achivement" <your-email@gmail.com>',
                    to: email,
                    // Avoid trigger words like "Winner" or "Free"
                    subject: `Digital Certificate for ${name}`,
                    // CRITICAL: Text version included for anti-spam filters
                    text: `Hello ${name}. Your digital certificate has been issued. Please find it attached to this email.`,
                    html: `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                            <h2 style="color: #444;">Verification Successful</h2>
                            <p>Hello ${name},</p>
                            <p>Your requested certificate has been generated and is attached to this message as a high-quality image.</p>
                            <br />
                            <p style="font-size: 11px; color: #888;">Transaction ID: ${Date.now()}</p>
                            <p style="font-size: 12px; color: #555;">Regards,<br><strong>Administration Team</strong></p>
                        </div>
                    `,
                    attachments: [{ filename: `Certificate_${name}.png`, content: buffer }]
                });
                sentCount++;
                console.log(`✅ Sent to: ${email}`);
            } catch (mailErr) {
                console.error(`❌ Failed to send to ${email}:`, mailErr.message);
            }
        }

        res.send(`Successfully sent ${sentCount} certificates!`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error: " + err.message);
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));