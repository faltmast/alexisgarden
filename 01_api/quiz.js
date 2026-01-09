// Vercel Serverless Function - Quiz Submission
// Sends email notification when someone completes the quiz

export default async function handler(req, res) {
    // CORS headers
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
        const { growing, help, email, message } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Format the quiz response
        const growingLabels = {
            company: 'A company',
            project: 'A project',
            myself: 'Myself'
        };

        const helpLabels = {
            strategy: 'Brand strategy & positioning',
            website: 'A website that works',
            photography: 'Photography that captures the real thing',
            workshop: 'A workshop to get unstuck'
        };

        const emailBody = `
New quiz submission from alexis.garden

Growing: ${growingLabels[growing] || growing}
Needs help with: ${helpLabels[help] || help}
Email: ${email}
${message ? `\nMessage: ${message}` : ''}

---
Sent from alexis.garden quiz
        `.trim();

        // Option 1: Send via Resend (recommended)
        if (process.env.RESEND_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'alexis.garden <quiz@alexis.garden>',
                    to: process.env.NOTIFICATION_EMAIL || 'hello@alexis.garden',
                    subject: `🌱 New inquiry: ${helpLabels[help] || help}`,
                    text: emailBody
                })
            });

            if (!response.ok) {
                console.error('Resend error:', await response.text());
            }
        }

        // Log for debugging
        console.log('Quiz submission received:', {
            growing,
            help,
            email,
            message: message ? '(provided)' : '(none)',
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Quiz submission error:', error);
        return res.status(500).json({ error: 'Failed to process submission' });
    }
}
