const AIRTABLE_BASE_ID = 'appNfQrr0JMJ7pJox';
const CLIENTS_TABLE = 'tblJWLkDDScUtaMU8';
const AVIS_TABLE = 'tblsZq7vxacMEhIZv';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID clent manquant' });

    const token = process.env.AIRTABLE_TOKEN;
    if (!token) return res.status(500).json({ error: 'Token Airtable non configure' });

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
        const clientRes = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CLIENTS_TABLE}/${id}`,
            { headers }
        );

        if (!clientRes.ok) {
            const body = await clientRes.json().catch(() => clientRes.text());
            console.error('[dashboard] Airtable error', clientRes.status, JSON.stringify(body));
            return res.status(404).json({
                error: 'Client introuvable',
                debug: { airtableStatus: clientRes.status, airtableBody: body }
            });
        }

        const clientData = await clientRes.json();
        const f = clientData.fields;
        const avisIds = f['Avis'] || [];
        let avis = [];

        if (avisIds.length > 0) {
            const formula = `OR(${avisIds.map((rid) => `RECORD_ID()="${rid}"`).join(',')})`;
            const avisRes = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AVIS_TABLE}?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Date%20de%20r%C3%A9ception&sort[0][direction]=desc`,
                { headers }
            );
            const avisData = await avisRes.json();
            avis = (avisData.records || []).map((a) => ({
                id: a.id,
                nom: a.fields['Nom du client final'] || 'Anonyme',
                note: a.fields['Note ( 1 a 5 )'] || null,
                avis: a.fields['Avis reformule IA'] || a.fields['Avis brut'] || '',
                date: a.fields['Date de reception'] || null,
                statut: a.fields['Statut'] || null,
                affiche: a.fields['Affiche sur le widget'] || false,
            }));
        }

        return res.status(200).json({
            client: {
                id: clientData.id,
                name: f['Nom'] || '',
                email: f['Email'] || '',
                plan: f['Plan'] || '',
                statut: f['Statut'] || '',
                dateInscription: f['Date inscription'] || null,
            },
            avis,
        });
    } catch (err) {
        console.error('[dashboard] Uncaught error:', err);
        return res.status(500).json({ error: 'Erreur serveur', debug: { message: err.message } });
    }
};
