const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');

const pdfHandler = require('../pdf/pdf');
const Invoice = require('../models/invoice');

//Helpers

const getInvoiceRows = req => {
  const numRows = req.body.description.length;
  let rows = [];

  for (let i = 0; i < numRows; i++) {
    rows.push({
      description: req.body.description[i],
      quantity: Number(req.body.quantity[i]),
      price: Number(req.body.price[i]),
      amount: req.body.quantity[i] * req.body.price[i]
    });
  }
  return rows;
};

const getTotal = rows => {
  const total = rows.reduce((sum, row) => {
    return sum + Number(row.amount);
  }, 0);
  return total.toFixed(2);
};

const createInvoice = async req => {
  const rows = getInvoiceRows(req);
  const invoice = new Invoice({
    invoiceNumber: req.body.invoiceNumber,
    date: req.body.date,
    recipient: {
      name: req.body.name,
      city: req.body.city,
      street: req.body.street,
      wechatId: req.body.wechatId,
      phone: req.body.phone
    },
    rows: rows,
    total: getTotal(rows),
    owner: req.user
  });
  try {
    await invoice.save();
    return invoice;
  } catch (e) {
    throw new Error(e);
  }
};

const getUniqueRecipients = async user => {
  try {
    const invoices = await Invoice.find({ owner: user });
    if (!invoices) {
      return [];
    }
    const allRecipients = invoices.map(invoice => invoice.recipient);
    const uniqueRecipients = [];
    const map = new Map();
    for (const recipient of allRecipients) {
      if (!map.has(recipient.name)) {
        map.set(recipient.name, true);
        uniqueRecipients.push({
          name: recipient.name,
          city: recipient.city,
          street: recipient.street,
          wechatId: recipient.wechatId,
          phone: recipient.phone
        });
      }
    }
    return uniqueRecipients;
  } catch (e) {
    throw new Error(e);
  }
};

//Exports

exports.getAddInvoice = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    res.render('admin/add-invoice', {
      pageTitle: 'Ny faktura',
      path: '/add',
      recipients,
      invoiceId: null,
      inputData: null,
      validationErrors: [],
      successMessage: null
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getRecipientData = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    const data = JSON.stringify(recipients);
    res.send(data);
  } catch (e) {
    next(new Error(e));
  }
};

exports.postSaveInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    const recipients = await getUniqueRecipients(req.user);
    if (!errors.isEmpty()) {
      return res.render('admin/add-invoice', {
        pageTitle: 'Ny faktura',
        path: '/add',
        recipients,
        invoiceId: null,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true }),
        successMessage: null
      });
    }

    const invoice = await createInvoice(req);

    res.render('admin/add-invoice', {
      pageTitle: 'Ny faktura',
      path: '/add',
      recipients,
      invoiceId: invoice._id.toString(),
      inputData: req.body,
      validationErrors: [],
      successMessage: 'Fakturan är sparad!'
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.postEmailInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipients: [],
      invoiceId: req.body.invoiceId,
      inputData: req.body,
      validationErrors: errors.array({ onlyFirstError: true }),
      successMessage: null
    });
  }
  try {
    const invoiceId = req.body.invoiceId;
    let invoice;
    if (!invoiceId) {
      invoice = await createInvoice(req);
    } else {
      const rows = getInvoiceRows(req);
      invoice = await Invoice.findByIdAndUpdate(invoiceId, {
        invoiceNumber: req.body.invoiceNumber,
        date: req.body.date,
        recipient: {
          name: req.body.name,
          street: req.body.street,
          city: req.body.city,
          wechatId: req.body.wechatId
        },
        rows: rows,
        total: getTotal(rows)
      });
      await invoice.save();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    await pdfHandler.emailPdf(invoice, req.user);
    return res.redirect('/admin/invoices');
  } catch (e) {
    next(new Error(e));
  }
};

exports.getEditInvoice = async (req, res, next) => {
  const invoiceId = req.params.invoiceId;
  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error();
    }
    res.render('admin/edit-invoice', {
      pageTitle: 'Redigera faktura',
      path: '/invoices',
      invoice,
      inputData: null,
      validationErrors: [],
      successMessage: null
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.postEditInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    const invoice = await Invoice.findById(req.body.invoiceId);
    if (!errors.isEmpty()) {
      return res.render('admin/edit-invoice', {
        pageTitle: 'Redigera faktura',
        path: '/invoices',
        invoice: invoice,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true }),
        successMessage: null
      });
    }
    const rows = getInvoiceRows(req);

    invoice.invoiceNumber = req.body.invoiceNumber;
    invoice.date = req.body.date;
    invoice.recipient.name = req.body.name;
    invoice.recipient.city = req.body.city;
    invoice.recipient.street = req.body.street;
    invoice.recipient.wechatId = req.body.wechatId;

    invoice.rows = rows;
    invoice.total = getTotal(rows);

    await invoice.save();

    res.render('admin/edit-invoice', {
      pageTitle: 'Redigera faktura',
      path: '/invoices',
      invoice,
      inputData: null,
      validationErrors: [],
      successMessage: 'Ändringar sparade'
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getInvoiceFolders = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    if (!recipients.length > 0) {
      return res.render('admin/invoice-folders', {
        path: '/invoices',
        pageTitle: 'Fakturor',
        recipients: recipients
      });
    }
    recipients.sort((a, b) =>
      a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
    );
    res.render('admin/invoice-folders', {
      path: '/invoices',
      pageTitle: 'Fakturor',
      recipients: recipients
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const documents = await Invoice.find({
      owner: req.user,
      'recipient.name': req.params.folderName
    });
    const invoices = [...documents].reverse();
    res.render('admin/invoices', {
      path: '',
      pageTitle: 'Fakturor',
      invoices
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getViewInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      throw new Error();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    await pdfHandler.viewPdf(res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.getDownloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      throw new Error();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    pdfHandler.downloadPdf(invoice, res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.postDeleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.body.invoiceId);
    res.redirect(`/admin/invoices/${invoice.recipient.authority}`);
  } catch (e) {
    next(new Error(e));
  }
};

exports.getEditProfile = (req, res) => {
  res.render('admin/edit-profile', {
    pageTitle: 'Mina uppgifter',
    path: '/profile',
    user: req.user,
    validationErrors: [],
    inputData: null,
    successMessage: null
  });
};

exports.postEditProfile = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-profile', {
      pageTitle: 'Mina uppgifter',
      path: '/profile',
      user: req.user,
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body,
      successMessage: null
    });
  }

  const user = req.user;

  try {
    const isNewPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (isNewPassword) {
      user.password = await bcrypt.hash(req.body.password, 8);
    }
    user.name = req.body.name;
    user.email = req.body.email;
    user.phone = req.body.phone;
    user.street = req.body.street;
    user.zip = req.body.zip;
    user.city = req.body.city;
    user.company = req.body.company;
    user.registrationNumber = req.body.registrationNumber;
    user.wechatId = req.body.wechatId;
    await user.save();

    req.user = user;
    res.render('admin/edit-profile', {
      pageTitle: 'Mina uppgifter',
      path: '/profile',
      user: req.user,
      validationErrors: [],
      inputData: null,
      successMessage: 'Dina uppgifter är nu sparade!'
    });
  } catch (e) {
    next(new Error(e));
  }
};
