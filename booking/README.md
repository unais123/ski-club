# Gulmarg Ski Club — Booking Widget

A reusable, framework-free booking card (HTML + CSS + vanilla JS). It matches
the main site's design language and, on submit, performs **three actions**:

1. **WhatsApp** — opens WhatsApp Click-to-Chat to **+91 70065 75092** with the
   full, formatted booking.
2. **Email** — sends the same booking to **gulmargskiclub@gmail.com** via
   **EmailJS** (client-side, no backend).
3. **Google Sheet** — saves the booking as a row via a **Google Apps Script**
   web app.

WhatsApp works out of the box. Email and Sheet are optional — until you add the
keys below, the widget still works and quietly notes which integrations aren't
wired yet. **No other code changes are needed** — everything lives in the
`CONFIG` object at the top of `booking.js`.

```
booking/
├── booking.css     ← styles (namespaced .gsc-)
├── booking.js      ← logic + CONFIG
├── booking.html    ← standalone demo page
└── README.md       ← this file
```

---

## 1. Install on a page (2 lines + 1 div)

In `<head>`:

```html
<link rel="stylesheet" href="booking/booking.css">
```

Where you want the form (e.g. a "Book" section):

```html
<div id="booking-container" data-expedition="Skiing"></div>
```

Before `</body>`:

```html
<!-- optional: EmailJS SDK, only if you use Action 2 -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script src="booking/booking.js" defer></script>
```

That's it — the script renders the form into the div automatically.

### Auto-preselecting the expedition
Set `data-expedition` to one of:
`Skiing`, `Snowboarding`, `Private Instructor`, `Kashmir Great Lakes Trek`,
`Tarsar Marsar Trek`, `Mount Apharwat Summit`, `Sunset Peak Expedition`,
`Tour Package`, `Custom`.

If you omit it, the widget guesses from the page filename (e.g. `skiing.html`
→ Skiing, `trek-tarsar-marsar.html` → Tarsar Marsar Trek). Users can always
change the dropdown manually.

---

## 2. Configure contact details

Edit the top of **`booking.js`**:

```js
const CONFIG = {
  whatsappNumber: "917006575092",              // international, no "+"
  businessEmail: "gulmargskiclub@gmail.com",
  emailService: {
    serviceId:  "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID",
    publicKey:  "YOUR_EMAILJS_PUBLIC_KEY",
  },
  googleSheetWebhook: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
};
```

---

## 3. EmailJS setup (Action 2 — send email)

1. Create a free account at **https://www.emailjs.com/**.
2. **Email Services** → *Add New Service* (e.g. Gmail for
   `gulmargskiclub@gmail.com`). Copy the **Service ID**.
3. **Email Templates** → *Create New Template*. Paste this into the template
   body and set the "To email" to `{{to_email}}` and subject to `{{subject}}`:

   ```
   New booking request from the Gulmarg Ski Club website:

   Name:        {{name}}
   Phone:       {{phone}}
   Email:       {{email}}
   Expedition:  {{expedition}}
   Travel Dates:{{dates}}
   Persons:     {{persons}}
   From:        {{from}}
   Message:     {{message}}
   Received:    {{timestamp}}
   ```
   Copy the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Paste all three into `CONFIG.emailService` and make sure the EmailJS SDK
   `<script>` (step 1 above) loads **before** `booking.js`.

The template variables sent are: `to_email, subject, name, phone, email,
expedition, dates, persons, from, message, timestamp`.

---

## 4. Google Sheet setup (Action 3 — save every booking)

### 4a. Create the sheet
New Google Sheet → name row 1 exactly:

| Timestamp | Name | Phone | Email | Expedition | Start Date | End Date | Persons | Location | Message | Status |
|-----------|------|-------|-------|------------|------------|----------|---------|----------|---------|--------|

### 4b. Apps Script web app
In the sheet: **Extensions → Apps Script**, replace the contents with:

```javascript
// Gulmarg Ski Club — booking intake → Google Sheet
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1')
             || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var d = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),                 // Timestamp
      d.name || '',
      d.phone || '',
      d.email || '',
      d.expedition || '',
      d.start || '',
      d.end || '',
      d.persons || '',
      d.from || '',               // Location
      d.message || '',
      d.status || 'New'
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

### 4c. Deploy
**Deploy → New deployment → Type: Web app**
- *Execute as*: **Me**
- *Who has access*: **Anyone**

Click **Deploy**, authorise, and copy the **Web app URL**. Paste it into
`CONFIG.googleSheetWebhook`.

> The widget posts with `mode: "no-cors"` (Apps Script doesn't send CORS
> headers), so the browser can't read the response — that's expected. Rows
> still append reliably. Test by submitting a booking and checking the sheet.

---

## 5. What the user sees

- Premium glassmorphism card, floating labels, custom range/single date picker,
  persons stepper, country-code phone, live validation.
- On submit: a formatted booking **summary**, WhatsApp opens with the request,
  email + sheet fire in the background, then an animated **success popup**
  ("Thank you!" with *Close* / *Book Another*).

## 6. Accessibility & performance
- Semantic form, ARIA labels, keyboard-navigable calendar and modal, visible
  focus states, `prefers-reduced-motion` respected.
- ~0 dependencies (EmailJS SDK only if you enable email). No build step.

## 7. Troubleshooting
- **WhatsApp doesn't open** → check `whatsappNumber` is international with no
  `+`/spaces (`917006575092`).
- **No email** → EmailJS SDK script missing, keys still `YOUR_…`, or template
  variable names don't match.
- **Sheet row not added** → re-deploy the web app after any script edit (a new
  deployment URL is created unless you "Manage deployments → edit"), and ensure
  *Who has access = Anyone*.
