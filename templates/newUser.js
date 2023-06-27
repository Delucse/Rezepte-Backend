const moment = require('moment');

const url = process.env.API_BASE_URL;
const appUrl = process.env.APP_BASE_URL;

module.exports = newUser = (user, relation, token) => {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Nutzeranfrage</title>
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
      src: local('Lobster Two'), url(${appUrl}/datei/LobsterTwo-Bold.ttf) format('truetype');
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
<body style="margin:0;padding:0;word-spacing:normal;background-color:#939297;">
  <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#939297;">
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
              <td style="padding:40px 30px 30px 30px;text-align:left;font-size:24px;font-weight:bold;padding: 30px;background-color:darkgreen;">
                <a href="${url}" style="text-decoration:none;"><img src="${url}/datei/logo_font.png" width="150" alt="Delucse" style="width:150px;max-width:70%;height:auto;border:none;text-decoration:none;color:#ffffff;"></a>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 30px 15px 30px;background-color:#ffffff;">
                <h1 style="margin-top:0;margin-bottom:18px;font-size:26px;line-height:32px;font-weight:bold;letter-spacing:-0.02em;">Nutzeranfrage</h1>
                <div style="margin-top:0;margin-bottom:0px;">Hallo,<br/>"${user}" hat sich erfolgreich registriert und wartet nur noch auf deine Authorisierung:<br/><div style="font-style: italic;margin-top:10px;">${relation}</div></div>
                <p style="margin:18px;"><a href="${url}/user/authorization/${token}" style="background: green; text-decoration: none; padding: 10px 25px; color: #ffffff; border-radius: 0px; display:inline-block; mso-padding-alt:0;text-underline-color:#ff3884"><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%;mso-text-raise:20pt">&nbsp;</i><![endif]--><span style="mso-text-raise:10pt;font-weight:bold;">Nutzer bestätigen</span><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%">&nbsp;</i><![endif]--></a></p>
                <p style="margin:18px;"><a href="${url}/user/unauthorization/${token}" style="background: red; text-decoration: none; padding: 10px 25px; color: #ffffff; border-radius: 0px; display:inline-block; mso-padding-alt:0;text-underline-color:#ff3884"><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%;mso-text-raise:20pt">&nbsp;</i><![endif]--><span style="mso-text-raise:10pt;font-weight:bold;">Nutzer löschen</span><!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%">&nbsp;</i><![endif]--></a></p>

              </td>
            </tr>
            <tr>
              <td style="padding:0px 30px 11px 30px;font-size:0;background-color:#ffffff;border-bottom:1px solid #f0f0f5;border-color:rgba(201,201,207,.35);">
                <!--[if mso]>
                <table role="presentation" width="100%">
                <tr>
                <td style="width:395px;" align="left" valign="top">
                <![endif]-->
                <div class="col-lge" style="display:inline-block;width:100%;max-width:395px;vertical-align:top;padding-bottom:20px; font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
                  <p style="margin-top:0;margin-bottom:10px;">Bis dahin viel Spaß beim Kochen!</p>
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
              <td style="padding:30px;text-align:center;font-size:12px;background-color:#404040;color:#cccccc;">
                <div style="margin:0;font-size:14px;line-height:20px;"><div style="font-size: 13px;">&copy; Delucse ${moment().format(
                    'YYYY'
                )}</div><div style="font-family: Lobster Two;">mit Hunger erstellt</div></div>
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
