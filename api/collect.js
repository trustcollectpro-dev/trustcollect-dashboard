const AIRTABLE_BASE_ID = 'appNfQrr0JMJ7pJox';
const AVIS_TABLE = 'tblsZq7vxacMEhIZv';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Token Airtable manquant' });

  const { note, avis, nom, email, clientId } = req.body || {};

  if (!note || !avis || !clientId) {
    return res.status(400).json({ error: 'Champs manquants: note, avis et clientId sont requis' });
  }

  if (note < 1 || note > 5) {
    return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
  }

  try {
    const fields = {
      'Nom du client final': nom || 'Anonyme',
      'Note': parseInt(note),
      'Avis brut': avis,
      'Date de réception': new Date().toISOString().split('T')[0],
      'Statut': 'En attente',
      'Professionnel concerné': [clientId],
    };

    if (email) fields['Email client final'] = email;

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AVIS_TABLE}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error('[collect] Airtable error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erreur Airtable', detail: data.error });
    }

    console.log('[collect] Avis créé:', data.id);
    return res.status(200).json({ success: true, id: data.id });

  } catch (err) {
    console.error('[collect] Erreur serveur:', err.message);
    return res.status(500).json({ error: 'Erreur serveur', detail: err.message });
  }
};
