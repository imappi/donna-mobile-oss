// Finnish copy for the existing invented seed records. Never translate or
// derive identities, amounts, dates, authority or lifecycle fields on-device.
export const demoCopy = (en, fi) => process.env.DEMO_LOCALE === 'fi' ? fi : en;
const copy = {
  'client_evidence_request:ask-cafe': {
    title: 'Oliko Café Veranon ateria työasia vai henkilökohtainen?',
    question: 'Oliko 84,00 €:n ateria Café Veranossa työasia vai henkilökohtainen?',
    choices: ['Työateria', 'Henkilökohtainen']
  },
  'client_evidence_request:ask-fuel': {
    title: 'Oliko Meadow Fuel Stationin tankkaus työautoon?',
    question: 'Oliko 92,30 €:n tankkaus Meadow Fuel Stationilla työautoon vai omaan autoosi?',
    choices: ['Työautoon', 'Omaan autoon']
  },
  'client_evidence_request:ask-fabrics': {
    title: 'Atelier Fabricsin kuitti puuttuu',
    question: 'Voitko kuvata Atelier Fabricsin 212,40 €:n kuitin? Kuva riittää.'
  },
  'client_evidence_request:ask-insurance': {
    title: 'Miltä tililtä Northgate Insurancen vakuutus maksettiin?',
    question: 'Northgate Insurancen 640,00 €:n vakuutusmaksua ei näy yritystilillä. Maksoitko sen toiselta tililtä?'
  },
  'client_evidence_request:ask-mobile': {
    title: 'Onko Loop Mobilen liittymä kokonaan työkäytössä?',
    question: 'Onko Loop Mobilen 45,00 €/kk liittymä vain työkäytössä vai myös henkilökohtaisessa käytössä?',
    choices: ['Vain työkäytössä', 'Myös henkilökohtainen']
  },
  'client_evidence_request:ask-inv2041': {
    title: 'Miten lasku INV-2041 maksettiin?',
    question: 'Kestrel Studion lasku INV-2041 (980,00 €) näyttää maksetulta, mutta vastaavaa tilitapahtumaa ei löydy. Miten maksu tuli?'
  },
  'outbound_action:act-reminder-harbour': {
    title: 'Lähetetäänkö Harbour Joinerylle maksumuistutus?', detail: 'INV-2038 · 18 päivää erääntynyt',
    description: 'Ystävällinen ensimmäinen muistutus laskusta INV-2038 (1 450,00 €) on valmis lähetettäväksi.',
    hold: 'Hyväksyt maksumuistutukset ennen niiden lähettämistä.'
  },
  'outbound_action:act-reminder-brightpost': {
    title: 'Lähetetäänkö Rowan & Chaselle maksumuistutus?', detail: 'INV-2035 · 24 päivää erääntynyt',
    description: 'Ystävällinen ensimmäinen muistutus laskusta INV-2035 (760,00 €) on valmis lähetettäväksi.',
    hold: 'Hyväksyt maksumuistutukset ennen niiden lähettämistä.'
  },
  'outbound_action:act-issue-kestrel': {
    title: 'Lähetetäänkö Kestrel Studion kuukausilasku?', detail: 'Toistuva kuukausilasku',
    description: 'Kestrel Studion tavallinen kuukausilasku (680,00 €) on valmis lähetettäväksi.',
    hold: 'Uudet laskut lähetetään vain hyväksynnälläsi.'
  },
  'authority_grant:grant-receipt-chase': {
    title: 'Kuittien pyytäminen automaattisesti', detail: 'Jatkuva valtuutus',
    description: 'Donna pyytäisi puuttuvan kuitin heti ostoksen ilmestyessä tilille sen sijaan, että pyynnöt kootaan kuun loppuun.',
    hold: 'Tähän jatkuvaan toimintatapaan tarvitaan suostumuksesi.'
  },
  'reconciliation_batch:fyi-july-recon': {
    title: '14 tapahtumaa täsmäytetty', detail: 'Yhdistetty kuitteihin ja laskuihin',
    description: '14 tilitapahtumaa on yhdistetty kuitteihin ja laskuihin. Sinulta ei tarvita mitään.'
  },
  'outbound_action:fyi-cloudbill': {
    title: 'Cloudbill kirjattu ohjelmistokuluksi', detail: 'Kuukausitilaus · 29,00 €',
    description: 'Cloudbillin kuukausimaksu (29,00 €) on kirjattu ohjelmistokuluksi, kuten aiemminkin.'
  },
  'reconciliation_match:fyi-brightpost': {
    title: 'Brightpost Couriersin maksu täsmäytetty', detail: 'Korttimaksu · 36,90 €',
    description: 'Brightpost Couriersin 36,90 €:n maksu on yhdistetty lähettämääsi toimituskuittiin.'
  },
  'digest:fyi-july-summary': {
    title: 'Kuukausiyhteenveto lähetetty', description: 'Edellisen kuukauden kirjanpitoyhteenveto on lähetetty sähköpostiisi.'
  },
  'outbound_action:fyi-parking': {
    title: 'Quayside Parking kirjattu matkakuluihin', detail: 'Korttimaksu · 4,50 €',
    description: 'Quayside Parkingin 4,50 €:n maksu on kirjattu matkakuluihin.'
  },
  'client_evidence_request:ask-glenview': {
    title: 'Oliko Glenview Hardwaren ostos mökkiä varten?',
    question: 'Oliko Glenview Hardwaren 137,40 €:n ostos Rowanberry Cottagen korjaukseen vai henkilökohtainen?',
    choices: ['Mökin korjaukseen', 'Henkilökohtainen']
  },
  'outbound_action:fyi-rent-aug': {
    title: 'Vuokralasku lähetetty', detail: 'Rowanberry Cottage · vuokra',
    description: 'Vuokralasku on lähetetty jatkuvan valtuutuksesi mukaisesti samoilla ehdoilla kuin edellisessä kuussa.'
  }
};
export const localizeSeedCards = (cards, locale = process.env.DEMO_LOCALE) => locale !== 'fi' ? cards :
  cards.map(card => {
    const text = copy[card.id];
    if (!text) return card;
    return { ...card, title: text.title, detail: text.detail ?? card.counterparty ?? null,
      ...(card.ask ? { ask: { ...card.ask, question: text.question ?? card.ask.question,
        choices: card.ask.choices?.map((choice, index) => ({ ...choice, label: text.choices?.[index] ?? choice.label })) ?? null } } : {}),
      ...(card.approval ? { approval: { ...card.approval, description: text.description ?? card.approval.description,
        hold_reason: text.hold ?? card.approval.hold_reason } } : {}),
      ...(card.fyi ? { fyi: { ...card.fyi, description: text.description ?? card.fyi.description } } : {})
    };
  });
export const localizeSeedDocuments = (documents, locale = process.env.DEMO_LOCALE) => locale !== 'fi' ? documents :
  documents.map(document => ({
    ...document,
    filename: ({ 'doc-p01': 'puutavara.jpg', 'doc-p03': 'liimatarvikkeet.jpg' })[document.id] ?? document.filename,
    ...(document.id === 'doc-f01' ? { failure_message: 'Kuva oli liian epäselvä. Kokeile kuvata kuitti suorana ja lähempää.' } : {}),
    ...(document.id === 'doc-f02' ? { failure_message: 'PDF on suojattu salasanalla, eikä sitä voida avata.' } : {})
  }));

// ── Activity, close status and chat (the same invented records) ───────────
const fiMonth = (date) => date.toLocaleDateString('fi-FI', { month: 'long' });
const capital = (text) => text.charAt(0).toLocaleUpperCase('fi') + text.slice(1);
const activityCopy = {
  'ev-001': { title: '2 maksumuistutusta odottaa hyväksyntääsi', body: 'Harbour Joineryn ja Rowan & Chasen laskut ovat erääntyneet.' },
  'ev-002': { title: '14 tilitapahtumaa täsmäytetty' },
  'ev-003': { title: 'receipt-quayside-22aug.jpg on nyt kirjanpidossasi' },
  'ev-004': { title: 'Heinäkuu on valmis suljettavaksi', body: 'Kaikki on täsmäytetty. Donna sulkee kuukauden 5. päivänä, ellet sano muuta.' },
  'ev-005': { title: 'Heinäkuun yhteenvetosi', body: 'Tulot 4 980 € · Kulut 2 210 € · 3 kysymykseen vastattu.' },
  'ev-h01': { title: (event) => `${capital(fiMonth(new Date(event.at)))}n vuokra laskutettu`,
    body: 'Rowanberry Cottage · 1 150,00 €, jatkuvan valtuutuksesi mukaisesti.' },
  'ev-h02': { title: '1 kysymys Glenview Hardwaren ostoksesta' }
};
export const localizeSeedActivity = (events, locale = process.env.DEMO_LOCALE) => locale !== 'fi' ? events :
  events.map(event => {
    const text = activityCopy[event.id];
    if (!text) return event;
    const title = typeof text.title === 'function' ? text.title(event) : text.title;
    return { ...event, title: title ?? event.title, body: event.body == null ? null : text.body ?? event.body };
  });

const blockerCopy = {
  'A receipt or quick answer is still needed from you': 'Sinulta tarvitaan vielä kuitti tai lyhyt vastaus',
  'Donna is matching the latest bank lines': 'Donna täsmäyttää uusimpia tilitapahtumia',
  'One purchase needs a quick answer from you': 'Yhteen ostokseen tarvitaan sinulta lyhyt vastaus'
};
/** Period labels follow the persisted period start; a year stays when the English label has one. */
export const localizeStatus = (status, locale = process.env.DEMO_LOCALE) => locale !== 'fi' ? status : {
  ...status,
  periods: status.periods.map(period => {
    const [year, month] = period.period_start.split('-').map(Number);
    const name = capital(fiMonth(new Date(year, month - 1, 1)));
    return {
      ...period,
      label: /\d{4}/.test(period.label) ? `${name} ${year}` : name,
      blockers: period.blockers.map(blocker => ({ ...blocker, label: blockerCopy[blocker.label] ?? blocker.label }))
    };
  })
};

const chatCopy = {
  'msg-welcome': 'Huomenta, Sam. Elokuu etenee hyvin – kolmeen ostokseen tarvitaan sinulta kuitti tai lyhyt tieto. Kaikki muu on minun hoidossani.',
  'msg-owner-vat': 'Pitääkö kangastilauksesta maksaa ALV?',
  'msg-donna-vat': 'Yleinen verokanta pätee, ellei kuitissa lue muuta. Lähetä kuitti tänne, niin tarkistan lähteen ennen kuin kirjaan mitään.',
  'msg-welcome-hazelmoor': 'Hei Sam. Hazelmoorissa on rauhallista – vuokralasku lähti jatkuvan valtuutuksesi mukaisesti, ja yhteen Glenview Hardwaren ostokseen tarvitaan lyhyt vastaus, kun ehdit.'
};
export const localizeSeedChat = (messages, locale = process.env.DEMO_LOCALE) => locale !== 'fi' ? messages :
  messages.map(message => chatCopy[message.id] ? { ...message, text: chatCopy[message.id] } : message);
