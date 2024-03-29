const moment = require('moment');

const url = process.env.APP_BASE_URL;

const sToReadableTime = (time) => {
    const minute = 60 * 1;
    const hour = 60 * minute;
    const day = 24 * hour;
    const days = parseInt(time / day);
    const hours = parseInt((time - days * day) / hour);
    const minutes = parseInt((time - days * day - hours * hour) / minute);
    var title = '';
    if (days > 0) {
        title += `${days} ${days > 1 ? 'Tage' : 'Tag'}`;
    }
    if (hours > 0) {
        title += `${title !== '' ? ' ' : ''}${hours} ${
            hours > 1 ? 'Stunden' : 'Stunde'
        }`;
    }
    if (minutes > 0) {
        title += `${title !== '' ? ' ' : ''}${minutes} ${
            minutes > 1 ? 'Minuten' : 'Minute'
        }`;
    }
    return title;
};

const time = sToReadableTime(process.env.VERIFY_TOKEN_EXPIRATION);

module.exports = verifyEmail = (name, token) => {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>E-Mail verifizieren</title>
  <!--[if mso]>
  <style>
    table {border-collapse:collapse;border-spacing:0;border:none;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @font-face {
      font-family: 'Lobster Two';
      font-weight: 700;
      src: local('Lobster Two'), url(${url}/datei/LobsterTwo-Bold.ttf) format('truetype');
    }
    table, td, div, h1, p {
      font-family: Arial, sans-serif;
    }
    @media screen and (max-width: 530px) {
      .unsub {
        display: block;
        padding: 8px;
        margin-top: 14px;
        border-radius: 6px;
        background-color: #555555;
        text-decoration: none !important;
        font-weight: bold;
      }
      .col-lge {
        max-width: 100% !important;
      }
    }
    @media screen and (min-width: 531px) {
      .col-sml {
        max-width: 27% !important;
      }
      .col-lge {
        max-width: 73% !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#dddddd;">
  <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#dddddd;">
    <table role="presentation" style="width:100%;border:none;border-spacing:0;">
      <tr>
        <td align="center" style="padding:0;">
          <!--[if mso]>
          <table role="presentation" align="center" style="width:600px;">
          <tr>
          <td>
          <![endif]-->
          <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
            <tr>
              <td style="padding:40px 30px 30px 30px;text-align:left;font-size:24px;font-weight:bold;padding: 30px;background-color:#e85917;">
                <a href="${url}" style="text-decoration:none;"><img src="${url}/datei/logo_font.png" width="150" alt="Delucse" style="width:150px;max-width:70%;height:auto;border:none;text-decoration:none;color:#ffffff;"></a>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 30px 15px 30px;background-color:#ffffff;">
                <h1 style="margin-top:0;margin-bottom:18px;font-size:26px;line-height:32px;font-weight:bold;letter-spacing:-0.02em;">Willkommen</h1>
                <p style="margin-top:0;margin-bottom:18px;">Hallo ${name},<br/>wir freuen uns, dass du dich für Delucse registriert hast. Um die Rezepte-Welt uneingeschränkt nutzen zu können, bestätige bitte deine E-Mail-Adresse. Wenn du das nicht warst, kannst du diese Nachricht einfach ignorieren.</p>
                <p style="margin:0;"><a href="${url}/verifizierung/${token}" style="background: #e85917; text-decoration: none; padding: 10px 25px; color: #ffffff; border-radius: 0px; display:inline-block; mso-padding-alt:0;text-underline-color:#ff3884"><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%;mso-text-raise:20pt">&nbsp;</i><![endif]--><span style="mso-text-raise:10pt;font-weight:bold;">E-Mail verifizieren</span><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%">&nbsp;</i><![endif]--></a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px 11px 30px;font-size:0;background-color:#ffffff;border-bottom:1px solid #f0f0f5;border-color:rgba(201,201,207,.35);">
                <!--[if mso]>
                <table role="presentation" width="100%">
                <tr>
                <td style="width:395px;" align="left" valign="top">
                <![endif]-->
                <div class="col-lge" style="display:inline-block;width:100%;max-width:395px;vertical-align:top;padding-bottom:20px; font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
                  <p style="margin-top:0;margin-bottom:18px;">Sollte der Button nicht funktionieren, bitte einfach diesen Link <a href="${url}/verifizierung/${token}" style="color:#e85917;text-decoration:underline;">${`${url}/verifizierung/${token}`
        .split('')
        .map((s) => s + '&#8203;')
        .join(
            ''
        )}</a> in die Adresszeile deines Browsers einfügen. Der Aktivierungslink ist ${time} lang gültig. Nach Ablauf der Zeit musst du dich <a href="${url}/registrierung" style="color:#e85917;text-decoration:underline;">hier</a> noch einmal neu registrieren.</p>
                  <p style="margin-top:0;margin-bottom:10px;">Viel Spaß beim Kochen!</p>
                </div>
                <!--[if mso]>
                </td>
                <td style="width:125px;padding-bottom:20px;padding-left:20px" valign="top">
                <![endif]-->
                <div class="col-sml" style="display:inline-block;width:100%;max-width:125px !important;vertical-align:top;text-align:left;font-family:Arial,sans-serif;font-size:14px;color:#363636;">
                  <img src="${url}/datei/logo115_color.png" width="115" alt="" style="width:125px;max-width:80%;margin-bottom:20px;margin-left:20px">
                </div>
                <!--[if mso]>
                </td>
                </tr>
                </table>
                <![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:30px;padding-top:10px;text-align:center;font-size:12px;background-color:#bdbdbd;">
				        <div style="margin-top:10px;">
                  <a href="${url}/impressum" style="color:#555555;text-decoration:underline;margin-right:5px;">Impressum</a>
                  <a href="${url}/datenschutz" style="color:#555555;text-decoration:underline;margin-right:5px;">Datenschutz</a>
                  <a href="${url}/kontakt" style="color:#555555;text-decoration:underline;margin-right:5px;">Kontakt</a>
                </div>
                <div style="margin:0;font-size:14px;line-height:20px;color:#E85917;">
                  <div style="font-size: 13px;">
                    &copy; Delucse ${moment().format('YYYY')}
                  </div>
                  <div style="font-family: Lobster Two;">mit Hunger erstellt</div>
                </div>
              </td>
            </tr>
          </table>
          <!--[if mso]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};
