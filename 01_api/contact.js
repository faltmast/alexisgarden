// Vercel Serverless Function - Contact Form

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, interest, message } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const interestLabels = {
            brand: 'Brand strategy',
            gtm: 'Go-to-market',
            web: 'Website & content',
            photo: 'Photography',
            workshop: 'Workshop or retreat',
            other: 'Something else'
        };

        const emailBody = `
New contact from alexis.garden

Name: ${name}
Email: ${email}
Interest: ${interestLabels[interest] || interest}

Message:
${message}

---
Sent from alexis.garden
        `.trim();

        // Send via Resend
        if (process.env.RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'alexis.garden <hello@alexis.garden>',
                    to: process.env.NOTIFICATION_EMAIL || 'hello@alexis.garden',
                    subject: `New inquiry: ${interestLabels[interest] || interest}`,
                    text: emailBody,
                    reply_to: email
                })
            });
        }

        console.log('Contact form:', { name, email, interest, timestamp: new Date().toISOString() });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({ error: 'Failed to process' });
    }
}
