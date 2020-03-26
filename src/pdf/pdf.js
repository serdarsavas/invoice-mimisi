const path = require('path');
const { promisify } = require('util');
const { readFile, unlink } = require('fs');

const Intl = require('intl');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { sendPdfMail } = require('../email/email');

const _readFile = promisify(readFile);
const FILE_PATH = path.resolve(__dirname, 'invoice.pdf');

const monkey = 'Hello';

const viewPdf = response => {
  response.sendFile(FILE_PATH, err => {
    if (err) {
      throw new Error(err);
    } else {
      unlink(FILE_PATH, err => {
        if (err) {
          throw new Error(err);
        }
      });
    }
  });
};

const downloadPdf = (invoice, response) => {
  response.download(
    FILE_PATH,
    `faktura${invoice.invoiceNumber}-${invoice.recipient.name.toLowerCase()}-${
      invoice.date
    }`,
    err => {
      if (err) {
        throw new Error(err);
      } else {
        unlink(FILE_PATH, err => {
          if (err) throw new Error(err);
        });
      }
    }
  );
};

const emailPdf = async (invoice, user) => {
  try {
    const file = await _readFile(FILE_PATH);
    sendPdfMail({
      to: user.email,
      from: {
        email: 'ssavas@kth.se',
        name: 'Serdar Savas'
      },
      subject: `Faktura nr ${invoice.invoiceNumber}`,
      content: [
        {
          type: 'text/html',
          value: `<p>Hej ${
            user.name.split(' ')[0]
          }! Bifogad finns faktura med nummer ${invoice.invoiceNumber}.</p>`
        }
      ],
      attachments: [
        {
          content: Buffer.from(file).toString('base64'),
          type: 'application/pdf',
          filename: `faktura-${invoice.invoiceNumber}.pdf`,
          disposition: 'attachment'
        }
      ]
    });
    unlink(FILE_PATH, err => {
      if (err) throw new Error(err);
    });
  } catch (e) {
    throw new Error(e);
  }
};

//Utility function to use in pdf-template
const formatCurrency = num => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'CNY'
  }).format(num);
};

const formatDate = date => {
  const NUM_DAYS_TO_EXPIRY = 30;
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + NUM_DAYS_TO_EXPIRY);
  return newDate.toLocaleDateString('sv-SE');
};

const convertInvoiceToPdf = async (invoice, user) => {
  try {
    const template = await _readFile(__dirname + '/pdf.ejs', 'utf-8');
    if (!template) {
      throw new Error();
    }
    const html = await ejs.render(
      template,
      {
        invoice,
        user,
        formatCurrency,
        formatDate
      },
      true
    );

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html);
    await page.emulateMedia('screen');
    await page.pdf({
      path: FILE_PATH,
      format: 'A4',
      height: '297mm',
      width: '210mm'
      // headerTemplate: '<span class="pageNumber"></span>',
      // footerTemplate: `
      //   <div style="border-top: 1px solid rgb(64, 64, 64); padding: 1rem; margin: 20px auto; display: flex; justify-content: space-around; font-size: 9px; font-family: 'Helvetica'; width: 90%; ">
      //     <p>
      //       <span style="font-weight: bold;">Adress</span><br />
      //       ${user.street} <br/>
      //       ${user.zip} ${user.city}
      //     </p>
      //     <p>
      //       <span style="font-weight: bold;">Telefon</span><br />
      //       ${user.phone}
      //     </p>
      //     <p>
      //       <span style="font-weight: bold;">Wechat ID</span><br />
      //       ${user.wechatId}
      //     </p>
      //     <p>
      //       <span style="font-weight: bold;">Epost</span><br />
      //       ${user.email}
      //     </p>
      //     <p>
      //       <span style="font-weight: bold;">Organisationsnummer</span><br />
      //       ${user.registrationNumber}<br />
      //     </p>
      //   </div>
      //   `,
      // margin: {
      //   bottom: '150px',
      //   top: '50px',
      //   right: '20px',
      //   left: '20px'
      // }
    });
    await browser.close();
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  convertInvoiceToPdf,
  emailPdf,
  viewPdf,
  downloadPdf
};
